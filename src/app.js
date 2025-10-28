import { PrayerBot } from './core/bot.js';

console.log('🚀 Запуск Prayer Bot...');

// Проверяем наличие BOT_TOKEN
if (!process.env.BOT_TOKEN) {
    console.error('❌ Ошибка: BOT_TOKEN не найден в .env файле');
    process.exit(1);
}

const bot = new PrayerBot(process.env.BOT_TOKEN);
bot.launch();

// Обработка graceful shutdown
process.once('SIGINT', () => {
    console.log('🛑 Остановка бота...');
    bot.bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
    console.log('🛑 Остановка бота...');
    bot.bot.stop('SIGTERM');
});
