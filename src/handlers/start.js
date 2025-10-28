import { UserService } from '../services/UserService.js';
import { getMainKeyboard } from '../utils/keyboards.js';

export function setupStartHandler(bot) {
    bot.start(async (ctx) => {
        console.log('🚀 Команда /start вызвана');
        const userService = new UserService();
        const user = await userService.findOrCreate(
            ctx.from.id, 
            `${ctx.from.first_name} ${ctx.from.last_name || ''}`
        );

        await ctx.reply(
            `Благословите, отче! 🕍\n\n` +
            `Я ваш молитвенный помощник. Сохраняйте имена для поминовения, ` +
            `а я буду напоминать о важных датах.`,
            getMainKeyboard()
        );
    });

    // Добавляем лог для hears (если есть)
    bot.hears('📖 Список поминаемых', async (ctx) => {
        console.log('❌ Кнопка перехвачена start.js!');
        // Не делаем ничего - пусть обрабатывает listPersons.js
    });
}