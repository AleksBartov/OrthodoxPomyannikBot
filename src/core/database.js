import { DatabaseSync } from 'node:sqlite';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '../../data');
const dbPath = join(dataDir, 'prayers.db');

class Database {
    constructor() {
        this.ensureDataDir();
        this.db = new DatabaseSync(dbPath);
        this.init();
    }

    ensureDataDir() {
        if (!existsSync(dataDir)) {
            console.log('📁 Создаю папку data...');
            mkdirSync(dataDir, { recursive: true });
        }
    }

    init() {
        // Таблица для священников
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS priests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                telegram_id INTEGER UNIQUE NOT NULL,
                name TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Таблица для поминаемых - ОБНОВЛЯЕМ с is_active
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS persons (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                priest_id INTEGER NOT NULL,
                type TEXT CHECK(type IN ('live', 'dead')) NOT NULL,
                gender TEXT CHECK(gender IN ('male', 'female', NULL)),
                role_type TEXT CHECK(role_type IN ('laity', 'clergy', 'church_server', NULL)),
                church_role TEXT,
                name TEXT NOT NULL,
                name_day DATE,
                birth_date DATE,
                death_date DATE,
                notes TEXT,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (priest_id) REFERENCES priests (id)
            )
        `);

        // Индексы для быстрого поиска
        this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_persons_priest_id 
            ON persons(priest_id)
        `);

        this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_persons_active 
            ON persons(priest_id, is_active)
        `);

        console.log('✅ База данных инициализирована');
    }

    getConnection() {
        return this.db;
    }
}

export default new Database();
