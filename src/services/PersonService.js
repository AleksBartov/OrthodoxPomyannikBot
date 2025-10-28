import database from '../core/database.js';

export class PersonService {
    constructor() {
        this.db = database.getConnection();
    }

    async addPerson(personData) {
        const {
            priestId,
            type,
            gender,
            roleType,
            churchRole,
            name,
            nameDay = null,
            birthDate = null,
            deathDate = null,
            notes = null
        } = personData;

        const stmt = this.db.prepare(`
            INSERT INTO persons 
            (priest_id, type, gender, role_type, church_role, name, name_day, birth_date, death_date, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            priestId, type, gender, roleType, churchRole, name, 
            nameDay, birthDate, deathDate, notes
        );
        return result.lastInsertRowid;
    }

    async getPersonCount(priestId) {
        const stmt = this.db.prepare(`
            SELECT COUNT(*) as count FROM persons WHERE priest_id = ?
        `);
        return stmt.get(priestId).count;
    }
}
