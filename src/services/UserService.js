
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

    async getPriestPersons(priestId, activeOnly = true) {
        const whereClause = activeOnly ? 'WHERE priest_id = ? AND is_active = 1' : 'WHERE priest_id = ?';
        const stmt = this.db.prepare(`
            SELECT * FROM persons 
            ${whereClause}
            ORDER BY created_at DESC
        `);
        
        return stmt.all(priestId);
    }

    async getPersonById(personId, priestId) {
        const stmt = this.db.prepare(`
            SELECT * FROM persons 
            WHERE id = ? AND priest_id = ?
        `);
        
        return stmt.get(personId, priestId);
    }

    async updatePerson(personId, priestId, updates) {
        const allowedFields = ['name', 'type', 'gender', 'role_type', 'church_role', 'name_day', 'birth_date', 'death_date', 'notes', 'is_active'];
        const updateFields = [];
        const values = [];
        
        Object.keys(updates).forEach(key => {
            if (allowedFields.includes(key)) {
                updateFields.push(`${key} = ?`);
                values.push(updates[key]);
            }
        });
        
        if (updateFields.length === 0) {
            throw new Error('Нет полей для обновления');
        }
        
        values.push(personId, priestId);
        
        const stmt = this.db.prepare(`
            UPDATE persons 
            SET ${updateFields.join(', ')}
            WHERE id = ? AND priest_id = ?
        `);
        
        const result = stmt.run(...values);
        return result.changes > 0;
    }

    async archivePerson(personId, priestId) {
        const stmt = this.db.prepare(`
            UPDATE persons 
            SET is_active = 0
            WHERE id = ? AND priest_id = ?
        `);
        
        const result = stmt.run(personId, priestId);
        return result.changes > 0;
    }

    // НОВЫЙ МЕТОД: получение статистики
    async getPriestStats(priestId) {
        const stmt = this.db.prepare(`
            SELECT 
                type,
                COUNT(*) as count
            FROM persons 
            WHERE priest_id = ? AND is_active = 1
            GROUP BY type
        `);
        
        return stmt.all(priestId);
    }

    // ДЕБАГ МЕТОД: количество священников
    async debugGetPriestsCount() {
        const stmt = this.db.prepare('SELECT COUNT(*) as count FROM priests');
        return stmt.get().count;
    }

    // ДЕБАГ МЕТОД: все данные
    async debugGetAllData() {
        const priests = this.db.prepare('SELECT * FROM priests').all();
        const persons = this.db.prepare('SELECT * FROM persons').all();
        
        console.log('👥 Priests:', priests);
        console.log('📋 Persons:', persons);
        
        return { priests, persons };
    }
}
