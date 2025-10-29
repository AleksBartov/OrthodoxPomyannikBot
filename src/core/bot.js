import { Telegraf } from 'telegraf';
import { setupListPersonsHandler } from '../handlers/listPersons.js';
import { setupStartHandler } from '../handlers/start.js';
import { setupAddPersonHandler } from '../handlers/addPerson.js';
import { setupEditPersonHandler } from '../handlers/editPerson.js'; // НОВЫЙ ИМПОРТ

export class PrayerBot {
    constructor(token) {
        this.bot = new Telegraf(token);
        this.setupGlobalLogging();
        this.setupHandlers();
    }

    setupGlobalLogging() {
        this.bot.use(async (ctx, next) => {
            console.log('📨 Входящее сообщение:', {
                userId: ctx.from?.id,
                text: ctx.message?.text,
                command: ctx.message?.entities?.[0]?.type === 'bot_command' ? 'COMMAND' : 'TEXT'
            });
            await next();
        });
    }

    setupHandlers() {
        console.log('🔧 Настройка обработчиков...');
        
        try {
            // Загружаем listPersons ПЕРВЫМ чтобы его команды имели приоритет
            console.log('🔄 Загрузка listPersons.js...');
            setupListPersonsHandler(this.bot);
            console.log('✅ listPersons.js загружен');
            
            console.log('🔄 Загрузка start.js...');
            setupStartHandler(this.bot);
            console.log('✅ start.js загружен');
            
            console.log('🔄 Загрузка addPerson.js...');
            setupAddPersonHandler(this.bot);
            console.log('✅ addPerson.js загружен');
            
            // НОВЫЙ ОБРАБОТЧИК
            console.log('🔄 Загрузка editPerson.js...');
            setupEditPersonHandler(this.bot);
            console.log('✅ editPerson.js загружен');
            
        } catch (error) {
            console.error('❌ Ошибка загрузки обработчиков:', error);
        }
        
        console.log('✅ Все обработчики настроены');
    }

    launch() {
        this.bot.launch();
        console.log('🤖 Prayer Bot запущен');
    }
}
