
import { Telegraf } from 'telegraf';
import { setupStartHandler } from '../handlers/start.js';
import { setupAddPersonHandler } from '../handlers/addPerson.js';

export class PrayerBot {
    constructor(token) {
        this.bot = new Telegraf(token);
        this.setupHandlers();
    }

    setupHandlers() {
        setupStartHandler(this.bot);
        setupAddPersonHandler(this.bot);
    }

    launch() {
        this.bot.launch();
        console.log('🤖 Prayer Bot запущен');
    }
}