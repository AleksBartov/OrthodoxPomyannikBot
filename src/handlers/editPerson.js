
import { UserService } from '../services/UserService.js';
import { getMainKeyboard, getEditPersonKeyboard, getEditFieldKeyboard, getConfirmationKeyboard } from '../utils/keyboards.js';
import { STATES, setUserState, getUserState, clearUserState } from '../core/states.js';

export function setupEditPersonHandler(bot) {
    
    console.log('🔄 Настройка обработчика редактирования...');

    // Команда для редактирования
    bot.command('edit', async (ctx) => {
        await showEditMenu(ctx);
    });

    // Обработка выбора человека для редактирования
    bot.action(/^edit_(\d+)$/, async (ctx) => {
        const userId = ctx.from.id;
        const personId = parseInt(ctx.match[1]);
        
        const userService = new UserService();
        const priest = await userService.findOrCreate(userId, ctx.from.first_name);
        const person = await userService.getPersonById(personId, priest.id);
        
        if (!person) {
            await ctx.editMessageText('❌ Запись не найдена');
            return;
        }
        
        await showPersonEditMenu(ctx, person);
    });

    // Обработка выбора поля для редактирования
    bot.action(/^editfield_(\d+)_(name|type|notes|dates|archive)$/, async (ctx) => {
        const userId = ctx.from.id;
        const personId = parseInt(ctx.match[1]);
        const field = ctx.match[2];
        
        const userService = new UserService();
        const priest = await userService.findOrCreate(userId, ctx.from.first_name);
        const person = await userService.getPersonById(personId, priest.id);
        
        if (!person) {
            await ctx.editMessageText('❌ Запись не найдена');
            return;
        }
        
        setUserState(userId, `EDIT_${field.toUpperCase()}`, { personId, person });
        
        switch (field) {
            case 'name':
                await ctx.editMessageText(
                    `✏️ Редактирование имени:\n\n` +
                    `Текущее имя: *${person.name}*\n\n` +
                    `Введите новое имя в родительном падеже:`,
                    { parse_mode: 'Markdown', ...getEditFieldKeyboard('name', personId) }
                );
                break;
                
            case 'notes':
                await ctx.editMessageText(
                    `💬 Редактирование пометок:\n\n` +
                    `Текущие пометки: ${person.notes || 'нет'}\n\n` +
                    `Введите новые пометки:`,
                    getEditFieldKeyboard('notes', personId)
                );
                break;
                
            case 'dates':
                await ctx.editMessageText(
                    `📅 Редактирование дат:\n\n` +
                    `👼 Именины: ${person.name_day || 'не указано'}\n` +
                    `🎂 День рождения: ${person.birth_date || 'не указано'}\n` +
                    `📅 Дата кончины: ${person.death_date || 'не указано'}\n\n` +
                    `Введите новые даты в формате ДД.ММ (для именин) или ДД.ММ.ГГГГ:`,
                    getEditFieldKeyboard('dates', personId)
                );
                break;
                
            case 'archive':
                await ctx.editMessageText(
                    `📋 Архивирование:\n\n` +
                    `Вы уверены, что хотите архивировать:\n\n` +
                    `*${person.name}*\n` +
                    `${person.type === 'live' ? '🕯 О здравии' : '✝️ О упокоении'}\n` +
                    `${person.notes ? `📝 ${person.notes}\n` : ''}\n\n` +
                    `Запись будет скрыта из основного списка.`,
                    { parse_mode: 'Markdown', ...getConfirmationKeyboard('archive', personId) }
                );
                break;
        }
    });

    // Обработка подтверждения архивации
    bot.action(/^confirm_(archive|cancel)_(\d+)$/, async (ctx) => {
        const userId = ctx.from.id;
        const action = ctx.match[1];
        const personId = parseInt(ctx.match[2]);
        
        if (action === 'cancel') {
            await ctx.editMessageText('❌ Действие отменено');
            return;
        }
        
        const userService = new UserService();
        const priest = await userService.findOrCreate(userId, ctx.from.first_name);
        
        if (action === 'archive') {
            const success = await userService.archivePerson(personId, priest.id);
            if (success) {
                await ctx.editMessageText('✅ Запись архивирована');
            } else {
                await ctx.editMessageText('❌ Ошибка архивации');
            }
        }
        
        clearUserState(userId);
    });

    // Обработка текстового ввода для редактирования
    bot.on('text', async (ctx) => {
        const userId = ctx.from.id;
        const state = getUserState(userId);
        const text = ctx.message.text;

        if (!state.state) return;

        if (state.state.startsWith('EDIT_')) {
            const userService = new UserService();
            const priest = await userService.findOrCreate(userId, ctx.from.first_name);
            
            try {
                let updates = {};
                let successMessage = '';
                
                switch (state.state) {
                    case 'EDIT_NAME':
                        updates.name = text;
                        successMessage = `✅ Имя изменено на: *${text}*`;
                        break;
                        
                    case 'EDIT_NOTES':
                        updates.notes = text;
                        successMessage = `✅ Пометки обновлены: ${text}`;
                        break;
                        
                    case 'EDIT_DATES':
                        // Простая валидация - можно улучшить
                        if (text.includes('.') && (text.length === 5 || text.length === 10)) {
                            if (text.length === 5) {
                                updates.name_day = text;
                                successMessage = `✅ Дата именин обновлена: ${text}`;
                            } else {
                                if (state.data.person.type === 'dead') {
                                    updates.death_date = text;
                                    successMessage = `✅ Дата кончины обновлена: ${text}`;
                                } else {
                                    updates.birth_date = text;
                                    successMessage = `✅ Дата рождения обновлена: ${text}`;
                                }
                            }
                        } else {
                            await ctx.reply('❌ Неверный формат даты. Используйте ДД.ММ или ДД.ММ.ГГГГ');
                            return;
                        }
                        break;
                }
                
                if (Object.keys(updates).length > 0) {
                    const success = await userService.updatePerson(state.data.personId, priest.id, updates);
                    if (success) {
                        await ctx.reply(successMessage, { parse_mode: 'Markdown' });
                        
                        // Показываем обновленное меню редактирования
                        const updatedPerson = await userService.getPersonById(state.data.personId, priest.id);
                        await showPersonEditMenu(ctx, updatedPerson);
                    } else {
                        await ctx.reply('❌ Ошибка обновления');
                    }
                }
                
                clearUserState(userId);
                
            } catch (error) {
                console.error('❌ Ошибка при редактировании:', error);
                await ctx.reply('❌ Произошла ошибка при обновлении');
                clearUserState(userId);
            }
        }
    });

    console.log('✅ Обработчик редактирования настроен');
}

async function showEditMenu(ctx) {
    const userService = new UserService();
    const priest = await userService.findOrCreate(ctx.from.id, ctx.from.first_name);
    const persons = await userService.getPriestPersons(priest.id);
    
    if (persons.length === 0) {
        await ctx.reply(
            '📭 Нет записей для редактирования.\n' +
            'Сначала добавьте поминаемых.',
            getMainKeyboard()
        );
        return;
    }
    
    const personsList = persons.map(person => 
        `${person.type === 'live' ? '🕯' : '✝️'} ${person.name}${person.notes ? ` (${person.notes})` : ''}`
    ).join('\n');
    
    await ctx.reply(
        `✏️ Редактирование записей\n\n` +
        `Выберите запись для редактирования:\n\n` +
        `${personsList}`,
        getEditPersonKeyboard(persons)
    );
}

async function showPersonEditMenu(ctx, person) {
    const typeText = person.type === 'live' ? '🕯 О здравии' : '✝️ О упокоении';
    const genderIcon = person.gender === 'female' ? '👩' : '👨';
    
    let datesText = '';
    if (person.name_day) datesText += `\n👼 Именины: ${person.name_day}`;
    if (person.birth_date) datesText += `\n🎂 День рождения: ${person.birth_date}`;
    if (person.death_date) datesText += `\n📅 Дата кончины: ${person.death_date}`;
    
    await ctx.editMessageText(
        `✏️ Редактирование:\n\n` +
        `*${person.name}*\n` +
        `${typeText} ${genderIcon}\n` +
        `${person.notes ? `📝 ${person.notes}` : ''}` +
        `${datesText}\n\n` +
        `Что хотите изменить?`,
        { parse_mode: 'Markdown', ...getEditPersonKeyboard([person]) }
    );
}