// Храним состояния пользователей в памяти
export const userStates = new Map();

export const STATES = {
    // Состояния для добавления
    AWAITING_TYPE: 'awaiting_type',
    AWAITING_GENDER: 'awaiting_gender',
    AWAITING_NAME: 'awaiting_name',
    AWAITING_ROLE_TYPE: 'awaiting_role_type',
    AWAITING_CHURCH_ROLE: 'awaiting_church_role',
    AWAITING_DEATH_DATE: 'awaiting_death_date',
    AWAITING_NAME_DAY: 'awaiting_name_day',
    AWAITING_BIRTH_DATE: 'awaiting_birth_date',
    AWAITING_NOTES: 'awaiting_notes',
    
    // Состояния для редактирования
    EDIT_NAME: 'EDIT_NAME',
    EDIT_NOTES: 'EDIT_NOTES', 
    EDIT_DATES: 'EDIT_DATES'
};

export function setUserState(userId, state, data = {}) {
    userStates.set(userId, { state, data });
}

export function getUserState(userId) {
    return userStates.get(userId) || { state: null, data: {} };
}

export function clearUserState(userId) {
    userStates.delete(userId);
}
