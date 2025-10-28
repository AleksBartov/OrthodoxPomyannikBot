import { Markup } from "telegraf";

export function getMainKeyboard() {
  return Markup.keyboard([
    ["➕ Добавить поминаемого", "📖 Список поминаемых"],
    ["🔔 Напоминания", "⚙️ Настройки"],
  ]).resize();
}

export function getTypeKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback("🕯 О здравии", "type_live"),
      Markup.button.callback("✝️ О упокоении", "type_dead"),
    ],
  ]);
}

export function getGenderKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback("👨 Мужской", "gender_male"),
      Markup.button.callback("👩 Женский", "gender_female"),
    ],
    [Markup.button.callback("➡️ Пропустить", "gender_skip")],
  ]);
}

export function getRoleTypeKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback("🙏 Мирянин", "role_laity"),
      Markup.button.callback("🛐 Священнослужитель", "role_clergy"),
    ],
    [
      Markup.button.callback("📖 Церковнослужитель", "role_church_server"),
      Markup.button.callback("➡️ Пропустить", "role_skip"),
    ],
  ]);
}

export function getChurchRoleKeyboard(gender) {
  const maleRoles = [
    ["👑 Митрополит", "church_metropolitan"],
    ["⚜️ Архиепископ", "church_archbishop"],
    ["✝️ Епископ", "church_bishop"],
    ["🛐 Иерей", "church_priest"],
    ["📖 Протодиакон", "church_protodeacon"],
    ["📚 Диакон", "church_deacon"],
    ["🙏 Игумен", "church_hegumen"],
    ["🌿 Иеромонах", "church_hieromonk"],
    ["🌿 Монах", "church_monk"],
    ["📖 Псаломщик", "church_psalmist"],
    ["🎵 Регент", "church_choir_director"],
    ["📝 Чтец", "church_reader"],
  ];

  const femaleRoles = [
    ["👑 Игуменья", "church_hegumenia"],
    ["🙏 Монахиня", "church_nun"],
    ["🌿 Послушница", "church_novice"],
    ["🎵 Регент", "church_choir_director"],
    ["📝 Чтец", "church_reader"],
  ];

  const commonRoles = [
    ["❓ Другое", "church_other"],
    ["➡️ Пропустить", "church_skip"],
  ];

  const roles = gender === "female" ? femaleRoles : maleRoles;

  const keyboard = [];

  // Разбиваем на ряды по 2 кнопки
  for (let i = 0; i < roles.length; i += 2) {
    const row = roles
      .slice(i, i + 2)
      .map((role) => Markup.button.callback(role[0], role[1]));
    keyboard.push(row);
  }

  // Добавляем общие роли
  commonRoles.forEach((role) => {
    keyboard.push([Markup.button.callback(role[0], role[1])]);
  });

  return Markup.inlineKeyboard(keyboard);
}

// ИНЛАЙН-клавиатуры для editMessageText
export function getSkipInlineKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback("➡️ Пропустить", "skip_step"),
      Markup.button.callback("❌ Отмена", "cancel_dialog"),
    ],
  ]);
}

export function getCancelInlineKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("❌ Отмена", "cancel_dialog")],
  ]);
}

// ОБЫЧНЫЕ клавиатуры для sendMessage (оставляем для текстовых шагов)
export function getSkipKeyboard() {
  return Markup.keyboard([["➡️ Пропустить", "❌ Отмена"]]).resize();
}

export function getCancelKeyboard() {
  return Markup.keyboard([["❌ Отмена"]]).resize();
}

// Добавляем в конец файла:
export function getListNavigationKeyboard(currentPage, totalPages) {
  const keyboard = [];

  if (totalPages > 1) {
    const navButtons = [];
    if (currentPage > 0) {
      navButtons.push(
        Markup.button.callback("⬅️ Назад", `list_prev_${currentPage}`)
      );
    }
    if (currentPage < totalPages - 1) {
      navButtons.push(
        Markup.button.callback("Вперед ➡️", `list_next_${currentPage}`)
      );
    }
    if (navButtons.length > 0) {
      keyboard.push(navButtons);
    }
  }

  keyboard.push([Markup.button.callback("❌ Закрыть список", "list_close")]);

  return Markup.inlineKeyboard(keyboard);
}
