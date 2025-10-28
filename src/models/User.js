export class User {
    constructor(telegramId, name = null) {
        this.telegramId = telegramId;
        this.name = name;
    }

    static fromDb(row) {
        const user = new User(row.telegram_id, row.name);
        user.id = row.id;
        user.createdAt = row.created_at;
        return user;
    }
}
