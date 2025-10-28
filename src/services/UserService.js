import database from '../core/database.js';

export class UserService {
    constructor() {
        this.db = database.getConnection();
    }

    async findOrCreate(telegramId, name = null) {
        const stmt = this.db.prepare(`
            INSERT OR IGNORE INTO priests (telegram_id, name) 
            VALUES (?, ?)
        `);
        
        stmt.run(telegramId, name);
        
        // Получаем созданного/найденного пользователя
        const selectStmt = this.db.prepare(`
            SELECT * FROM priests WHERE telegram_id = ?
        `);
        
        const row = selectStmt.get(telegramId);
        return row ? {
            id: row.id,
            telegramId: row.telegram_id,
            name: row.name,
            createdAt: row.created_at
        } : null;
    }

    async getPriestPersons(priestId) {
        const stmt = this.db.prepare(`
            SELECT * FROM persons 
            WHERE priest_id = ?
            ORDER BY created_at DESC
        `);
        
        return stmt.all(priestId);
    }
}
