import { PersonService } from '../services/PersonService.js';
import { UserService } from '../services/UserService.js';
import { 
    STATES, 
    setUserState, 
    getUserState, 
    clearUserState 
} from '../core/states.js';
import { 
    getMainKeyboard, 
    getTypeKeyboard, 
    getGenderKeyboard, 
    getRoleTypeKeyboard, 
    getChurchRoleKeyboard, 
    getSkipKeyboard, 
    getCancelKeyboard,
    getSkipInlineKeyboard,
    getCancelInlineKeyboard
} from '../utils/keyboards.js';

export function setupAddPersonHandler(bot) {
    
    // Начало диалога добавления
    bot.hears('➕ Добавить поминаемого', async (ctx) => {
        setUserState(ctx.from.id, STATES.AWAITING_TYPE);
        
        await ctx.reply(
            '🕯 О ком будем молиться?',
            getTypeKeyboard()
        );
    });

    // Обработка выбора типа
    bot.action(/^type_(live|dead)$/, async (ctx) => {
        const userId = ctx.from.id;
        const type = ctx.match[1];
        const state = getUserState(userId);
        
        state.data.type = type;
        state.state = STATES.AWAITING_GENDER;
        setUserState(userId, state.state, state.data);

        const typeText = type === 'live' ? 'о здравии' : 'о упокоении';
        
        await ctx.editMessageText(
            `🎭 Укажите пол поминаемого ${typeText}:\n` +
            `*Это важно для канонической точности*`,
            { parse_mode: 'Markdown', ...getGenderKeyboard() }
        );
    });

    // Обработка выбора пола
    bot.action(/^gender_(male|female|skip)$/, async (ctx) => {
        const userId = ctx.from.id;
        const state = getUserState(userId);
        const gender = ctx.match[1];
        
        if (gender !== 'skip') {
            state.data.gender = gender;
        }
        
        state.state = STATES.AWAITING_NAME;
        setUserState(userId, state.state, state.data);

        const typeText = state.data.type === 'live' ? 'о здравии' : 'о упокоении';
        const genderText = gender === 'male' ? 'мужского пола' : 
                          gender === 'female' ? 'женского пола' : '';
        
        await ctx.editMessageText(
            `✍️ Введите имя ${genderText} ${typeText} (в родительном падеже):\n` +
            `Например: ${gender === 'female' ? '"Марии", "Любови"' : '"Иоанна", "Сергия"'}`,
            getCancelInlineKeyboard()
        );
    });

    // Обработка выбора типа роли
    bot.action(/^role_(laity|clergy|church_server|skip)$/, async (ctx) => {
        const userId = ctx.from.id;
        const state = getUserState(userId);
        const roleType = ctx.match[1];
        
        if (roleType === 'skip') {
            await proceedToNextStep(ctx, userId, state);
            return;
        }
        
        if (roleType === 'laity') {
            state.data.roleType = 'laity';
            state.data.churchRole = 'laity';
            setUserState(userId, state.state, state.data);
            await proceedToNextStep(ctx, userId, state);
            return;
        }
        
        // ПРОВЕРКА: для женщин исключаем священнические саны
        if (state.data.gender === 'female' && roleType === 'clergy') {
            await ctx.editMessageText(
                '❌ *Каноническое ограничение:*\n' +
                'В Православной Церкви женщины не могут быть священнослужителями.\n\n' +
                'Пожалуйста, выберите другой статус:',
                { parse_mode: 'Markdown', ...getRoleTypeKeyboard() }
            );
            return;
        }
        
        state.data.roleType = roleType;
        state.state = STATES.AWAITING_CHURCH_ROLE;
        setUserState(userId, state.state, state.data);
        
        const roleText = roleType === 'clergy' ? 'священнослужителя' : 'церковнослужителя';
        
        await ctx.editMessageText(
            `🎭 Выберите сан ${roleText}:`,
            getChurchRoleKeyboard(state.data.gender)
        );
    });

    // Обработка выбора церковной роли
    bot.action(/^church_(metropolitan|archbishop|bishop|priest|protodeacon|deacon|hegumen|hieromonk|monk|psalmist|choir_director|reader|hegumenia|nun|novice|other|skip)$/, async (ctx) => {
        const userId = ctx.from.id;
        const state = getUserState(userId);
        const churchRole = ctx.match[1];
        
        if (churchRole !== 'skip') {
            state.data.churchRole = churchRole;
        }
        
        setUserState(userId, state.state, state.data);
        await proceedToNextStep(ctx, userId, state);
    });

    // Обработка пропуска шага
    bot.action('skip_step', async (ctx) => {
        const userId = ctx.from.id;
        const state = getUserState(userId);
        
        // Пропускаем текущий шаг
        switch (state.state) {
            case STATES.AWAITING_DEATH_DATE:
                await handleDeathDateInput(ctx, userId, state, '➡️ Пропустить');
                break;
            case STATES.AWAITING_NAME_DAY:
                await handleNameDayInput(ctx, userId, state, '➡️ Пропустить');
                break;
            case STATES.AWAITING_BIRTH_DATE:
                await handleBirthDateInput(ctx, userId, state, '➡️ Пропустить');
                break;
            case STATES.AWAITING_NOTES:
                await handleNotesInput(ctx, userId, state, '➡️ Пропустить');
                break;
        }
    });

    // Обработка отмены диалога
    bot.action('cancel_dialog', async (ctx) => {
        const userId = ctx.from.id;
        clearUserState(userId);
        await ctx.editMessageText('Диалог отменен');
        await ctx.telegram.sendMessage(userId, 'Главное меню:', getMainKeyboard());
    });

    // Обработка текстовых сообщений (основной диалог)
    bot.on('text', async (ctx) => {
        const userId = ctx.from.id;
        const state = getUserState(userId);
        const text = ctx.message.text;

        if (!state.state) return;

        // Отмена диалога
        if (text === '❌ Отмена') {
            clearUserState(userId);
            await ctx.reply('Диалог отменен', getMainKeyboard());
            return;
        }

        switch (state.state) {
            case STATES.AWAITING_NAME:
                await handleNameInput(ctx, userId, state, text);
                break;

            case STATES.AWAITING_DEATH_DATE:
                await handleDeathDateInput(ctx, userId, state, text);
                break;

            case STATES.AWAITING_NAME_DAY:
                await handleNameDayInput(ctx, userId, state, text);
                break;

            case STATES.AWAITING_BIRTH_DATE:
                await handleBirthDateInput(ctx, userId, state, text);
                break;

            case STATES.AWAITING_NOTES:
                await handleNotesInput(ctx, userId, state, text);
                break;
        }
    });
}

// Вспомогательные функции
async function handleNameInput(ctx, userId, state, text) {
    state.data.name = text;
    state.state = STATES.AWAITING_ROLE_TYPE;
    setUserState(userId, state.state, state.data);
    
    // Используем sendMessage для текстового ввода
    await ctx.reply(
        '🎭 Укажите статус:\n' +
        '• 🙏 Мирянин - для большинства прихожан\n' +
        '• 🛐 Священнослужитель - рукоположенные в священный сан\n' +
        '• 📖 Церковнослужитель - не рукоположенные, но служащие в церкви',
        getRoleTypeKeyboard()
    );
}

async function handleDeathDateInput(ctx, userId, state, text) {
    if (text !== '➡️ Пропустить') {
        state.data.deathDate = text;
    }
    
    state.state = STATES.AWAITING_NAME_DAY;
    setUserState(userId, state.state, state.data);
    
    // Используем sendMessage для текстового ввода
    await ctx.reply(
        '👼 Укажите дату именин усопшего(ей) (ДД.ММ):\n' +
        'Например: 29.09\n\n' +
        '*Будем сугубо молиться в день Ангела*',
        { parse_mode: 'Markdown', ...getSkipKeyboard() }
    );
}

async function handleNameDayInput(ctx, userId, state, text) {
    if (text !== '➡️ Пропустить') {
        state.data.nameDay = text;
    }
    
    state.state = STATES.AWAITING_BIRTH_DATE;
    setUserState(userId, state.state, state.data);
    
    const isDead = state.data.type === 'dead';
    const personText = isDead ? 'усопшего(ей)' : '';
    
    // Используем sendMessage для текстового ввода
    await ctx.reply(
        `🎂 Укажите дату рождения ${personText} (ДД.ММ.ГГГГ):\n` +
        'Например: 15.03.1980\n\n' +
        '*Будем сугубо молиться в день рождения*',
        { parse_mode: 'Markdown', ...getSkipKeyboard() }
    );
}

async function handleBirthDateInput(ctx, userId, state, text) {
    if (text !== '➡️ Пропустить') {
        state.data.birthDate = text;
    }
    
    state.state = STATES.AWAITING_NOTES;
    setUserState(userId, state.state, state.data);
    
    // Используем sendMessage для текстового ввода
    await ctx.reply(
        '📝 Добавьте пометки (родство, обстоятельства и т.д.):\n' +
        'Например: "Мать прихожанки Анны, болела онкологией"',
        getSkipKeyboard()
    );
}

async function handleNotesInput(ctx, userId, state, text) {
    if (text !== '➡️ Пропустить') {
        state.data.notes = text;
    }
    await finishAddingPerson(ctx, userId, state.data);
}

async function proceedToNextStep(ctx, userId, state) {
    const isDead = state.data.type === 'dead';
    
    if (isDead) {
        state.state = STATES.AWAITING_DEATH_DATE;
        setUserState(userId, state.state, state.data);
        
        await ctx.editMessageText(
            '📅 Укажите дату кончины (ДД.ММ.ГГГГ):\n' +
            'Например: 15.10.2023',
            getSkipInlineKeyboard()
        );
    } else {
        state.state = STATES.AWAITING_NAME_DAY;
        setUserState(userId, state.state, state.data);
        
        await ctx.editMessageText(
            '👼 Укажите дату именин (ДД.ММ):\n' +
            'Например: 29.09\n\n' +
            '*Это важно для сугубого поминовения в день Ангела*',
            { parse_mode: 'Markdown', ...getSkipInlineKeyboard() }
        );
    }
}

async function finishAddingPerson(ctx, userId, personData) {
    try {
        const userService = new UserService();
        const personService = new PersonService();
        
        const priest = await userService.findOrCreate(userId, ctx.from.first_name);
        const personId = await personService.addPerson({
            priestId: priest.id,
            ...personData
        });

        const personCount = await personService.getPersonCount(priest.id);
        
        clearUserState(userId);
        
        const typeText = personData.type === 'live' ? 'о здравии' : 'о упокоении';
        await ctx.reply(
            `✅ Добавлено поминовение ${typeText}:\n` +
            `🙏 *${personData.name}*\n` +
            `${personData.deathDate ? `📅 Кончина: ${personData.deathDate}\n` : ''}` +
            `${personData.nameDay ? `👼 Именины: ${personData.nameDay}\n` : ''}` +
            `${personData.birthDate ? `🎂 Рождение: ${personData.birthDate}\n` : ''}` +
            `${personData.notes ? `📝 Пометки: ${personData.notes}\n` : ''}` +
            `\nВсего в вашем списке: *${personCount}* человек`,
            { parse_mode: 'Markdown', ...getMainKeyboard() }
        );

    } catch (error) {
        console.error('Error adding person:', error);
        await ctx.reply('❌ Произошла ошибка при добавлении', getMainKeyboard());
    }
}
