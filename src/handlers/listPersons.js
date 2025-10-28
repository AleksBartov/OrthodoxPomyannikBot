import { UserService } from '../services/UserService.js';
import { getMainKeyboard } from '../utils/keyboards.js';

export function setupListPersonsHandler(bot) {
    
    console.log('🔄 Обработчик listPersons НАСТРОЕН!');

    // Обработка кнопки "Список поминаемых" - ПРОСТОЙ ВАРИАНТ
    bot.hears('📖 Список поминаемых', async (ctx) => {
        console.log('📖 Кнопка "Список поминаемых" нажата!');
        await showPersonsList(ctx);
    });

    // Команда /list 
    bot.command('list', async (ctx) => {
        console.log('🔍 Команда /list ВЫЗВАНА!');
        await showPersonsList(ctx);
    });

    // Команда /debug
    bot.command('debug', async (ctx) => {
        console.log('🐛 Команда /debug ВЫЗВАНА!');
        
        try {
            const userService = new UserService();
            const priest = await userService.findOrCreate(ctx.from.id, ctx.from.first_name);
            const persons = await userService.getPriestPersons(priest.id);
            
            const priestsCount = await userService.debugGetPriestsCount();
            
            await ctx.reply(
                `🐛 Debug информация:\n` +
                `👥 Священников в базе: ${priestsCount}\n` +
                `📋 Ваших поминаемых: ${persons.length}\n` +
                `🆔 Ваш ID: ${ctx.from.id}`,
                getMainKeyboard()
            );
            
        } catch (error) {
            console.error('❌ Ошибка в /debug:', error);
            await ctx.reply('❌ Ошибка при отладке');
        }
    });

    console.log('✅ Обработчики зарегистрированы');
}

// Выносим общую логику в отдельную функцию
async function showPersonsList(ctx) {
    try {
        const userService = new UserService();
        const priest = await userService.findOrCreate(ctx.from.id, ctx.from.first_name);
        const persons = await userService.getPriestPersons(priest.id);
        
        console.log('📊 Найдено persons:', persons.length);
        
        if (persons.length === 0) {
            await ctx.reply(
                '📭 Список поминаемых пуст.\n' +
                'Добавьте первого человека для молитвенного поминовения.',
                getMainKeyboard()
            );
            return;
        }
        
        // Форматируем красивый список
        const listText = persons.map((person, index) => {
            const number = index + 1;
            const typeIcon = person.type === 'live' ? '🕯' : '✝️';
            const genderIcon = person.gender === 'female' ? '👩' : '👨';
            
            let roleText = '';
            if (person.church_role && person.church_role !== 'laity') {
                const roleNames = {
                    'metropolitan': 'митрополит',
                    'archbishop': 'архиепископ', 
                    'bishop': 'епископ',
                    'priest': 'иерей',
                    'protodeacon': 'протодиакон',
                    'deacon': 'диакон',
                    'hegumen': 'игумен',
                    'hieromonk': 'иеромонах',
                    'monk': 'монах',
                    'psalmist': 'псаломщик',
                    'choir_director': 'регент',
                    'reader': 'чтец',
                    'hegumenia': 'игуменья',
                    'nun': 'монахиня',
                    'novice': 'послушница'
                };
                roleText = ` (${roleNames[person.church_role] || person.church_role})`;
            }
            
            let datesText = '';
            if (person.name_day) datesText += ` 👼 ${person.name_day}`;
            if (person.birth_date) datesText += ` 🎂 ${person.birth_date}`;
            if (person.death_date) datesText += ` 📅 ${person.death_date}`;
            
            const notesText = person.notes ? `\n   📝 ${person.notes}` : '';
            
            return `${number}. ${typeIcon}${genderIcon} *${person.name}*${roleText}${datesText}${notesText}`;
        }).join('\n\n');
        
        const stats = {
            live: persons.filter(p => p.type === 'live').length,
            dead: persons.filter(p => p.type === 'dead').length
        };
        
        await ctx.reply(
            `📖 Ваш список поминаемых (${persons.length} чел.):\n` +
            `🕯 О здравии: ${stats.live} | ✝️ О упокоении: ${stats.dead}\n\n` +
            `${listText}`,
            { 
                parse_mode: 'Markdown',
                ...getMainKeyboard()
            }
        );
        
    } catch (error) {
        console.error('❌ Ошибка при показе списка:', error);
        await ctx.reply('❌ Ошибка при загрузке списка', getMainKeyboard());
    }
}
