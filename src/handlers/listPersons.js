import { UserService } from "../services/UserService.js";
import {
  getMainKeyboard,
  getListNavigationKeyboard,
} from "../utils/keyboards.js";

// Храним состояние просмотра списков
const listStates = new Map();

export function setupListPersonsHandler(bot) {
  // Обработка кнопки "Список поминаемых"
  bot.hears("📖 Список поминаемых", async (ctx) => {
    const userService = new UserService();
    const priest = await userService.findOrCreate(
      ctx.from.id,
      ctx.from.first_name
    );
    const persons = await userService.getPriestPersons(priest.id);

    if (persons.length === 0) {
      await ctx.reply(
        "📭 Список поминаемых пуст.\n" +
          "Добавьте первого человека для молитвенного поминовения.",
        getMainKeyboard()
      );
      return;
    }

    // Сохраняем состояние просмотра
    listStates.set(ctx.from.id, {
      persons: persons,
      currentPage: 0,
      pageSize: 10,
    });

    await showPersonsPage(ctx, ctx.from.id, 0);
  });

  // Навигация по страницам
  bot.action(/^list_(next|prev)_(\d+)$/, async (ctx) => {
    const userId = ctx.from.id;
    const action = ctx.match[1];
    const page = parseInt(ctx.match[2]);

    const state = listStates.get(userId);
    if (!state) return;

    let newPage = action === "next" ? page + 1 : page - 1;
    newPage = Math.max(
      0,
      Math.min(newPage, Math.ceil(state.persons.length / state.pageSize) - 1)
    );

    await showPersonsPage(ctx, userId, newPage);
  });

  // Закрытие списка
  bot.action("list_close", async (ctx) => {
    const userId = ctx.from.id;
    listStates.delete(userId);
    await ctx.deleteMessage();
    await ctx.telegram.sendMessage(userId, "Главное меню:", getMainKeyboard());
  });
}

async function showPersonsPage(ctx, userId, page) {
  const state = listStates.get(userId);
  if (!state) return;

  const startIndex = page * state.pageSize;
  const endIndex = Math.min(startIndex + state.pageSize, state.persons.length);
  const pagePersons = state.persons.slice(startIndex, endIndex);

  const listText = formatPersonsList(pagePersons, startIndex);
  const totalPages = Math.ceil(state.persons.length / state.pageSize);

  // Статистика
  const stats = getStats(state.persons);

  await ctx.editMessageText(
    `📖 Список поминаемых (${state.persons.length} чел.):\n` +
      `🕯 О здравии: ${stats.live} | ✝️ О упокоении: ${stats.dead}\n\n` +
      `${listText}\n\n` +
      `📄 Страница ${page + 1} из ${totalPages}`,
    {
      parse_mode: "Markdown",
      ...getListNavigationKeyboard(page, totalPages),
    }
  );

  // Обновляем состояние
  state.currentPage = page;
  listStates.set(userId, state);
}

function formatPersonsList(persons, startIndex = 0) {
  return persons
    .map((person, index) => {
      const number = startIndex + index + 1;
      const typeIcon = person.type === "live" ? "🕯" : "✝️";
      const genderIcon = person.gender === "female" ? "👩" : "👨";

      let roleText = "";
      if (person.church_role && person.church_role !== "laity") {
        const roleNames = {
          metropolitan: "митрополит",
          archbishop: "архиепископ",
          bishop: "епископ",
          priest: "иерей",
          protodeacon: "протодиакон",
          deacon: "диакон",
          hegumen: "игумен",
          hieromonk: "иеромонах",
          monk: "монах",
          psalmist: "псаломщик",
          choir_director: "регент",
          reader: "чтец",
          hegumenia: "игуменья",
          nun: "монахиня",
          novice: "послушница",
        };
        roleText = ` (${roleNames[person.church_role] || person.church_role})`;
      }

      let datesText = "";
      if (person.name_day) {
        datesText += ` 👼 ${person.name_day}`;
      }
      if (person.birth_date) {
        datesText += ` 🎂 ${person.birth_date}`;
      }
      if (person.death_date) {
        datesText += ` 📅 ${person.death_date}`;
      }

      const notesText = person.notes ? `\n   📝 ${person.notes}` : "";

      return `${number}. ${typeIcon}${genderIcon} *${person.name}*${roleText}${datesText}${notesText}`;
    })
    .join("\n\n");
}

function getStats(persons) {
  return {
    live: persons.filter((p) => p.type === "live").length,
    dead: persons.filter((p) => p.type === "dead").length,
  };
}
