import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  caseSkins,
  cases,
  couponRedemptions,
  coupons,
  drops,
  inventory,
  messages,
  notifications,
  opens,
  rewardClaims,
  skins,
  transactions,
  upgrades,
  users,
  withdrawals,
} from "@/db/schema";
import { dailyAmount, formatMoney, METHOD_LABELS, moscowDate, rubleToCents } from "@/lib/format";
import { isRare, rollWear, rollWeighted, upgradeChanceBps } from "@/lib/game";
import type { Rarity } from "@/lib/types";
import { GameError } from "@/server/errors";
import { serializeSkin, serializeUser } from "@/server/queries";
import { ensureSeed } from "@/server/seed";
import { setSession } from "@/server/session";

const DEPOSIT_METHODS = ["card", "sbp", "yookassa", "crypto"];
const WITHDRAW_METHODS = ["card", "sbp", "crypto", "steam"];
const MILESTONES = [
  { key: "cases_5", goal: 5, field: "casesOpened" as const, reward: 10000, title: "Пять открытий" },
  { key: "cases_25", goal: 25, field: "casesOpened" as const, reward: 50000, title: "Серия из 25" },
  { key: "upgrades_3", goal: 3, field: "upgradesDone" as const, reward: 15000, title: "Три контракта" },
  { key: "rare_1", goal: 1, field: "rareDrops" as const, reward: 20000, title: "Первая редкость" },
];

function sanitizeNick(input?: string) {
  if (!input) return "";
  const clean = input.replace(/[^\p{L}\p{N}_ .-]/gu, "").trim().slice(0, 20);
  return clean.length >= 3 ? clean : "";
}

function randomNick() {
  const pool = ["recoil", "dustline", "palace", "anchor", "lurker", "wingman", "eco", "keiser"];
  return `${pool[Math.floor(Math.random() * pool.length)]}_${Math.floor(100 + Math.random() * 900)}`;
}

function supportReply(text: string) {
  const value = text.toLowerCase();
  if (value.includes("вывод")) {
    return "Заявка на вывод сразу уходит в статус «на рассмотрении» и видна в профиле. В этой демо-версии реальные выплаты не проводятся.";
  }
  if (value.includes("стим") || value.includes("steam")) {
    return "Кнопка Steam создаёт локальный профиль со SteamID и стартовым балансом. На боевом домене тот же вход уходит в OpenID steamcommunity.com.";
  }
  if (value.includes("баланс") || value.includes("попол")) {
    return "Пополнение демо-кошелька мгновенное: плюс у баланса, сумма от 50 ₽. Карта и крипто в этой сборке не списываются.";
  }
  if (value.includes("апгрейд") || value.includes("шанс")) {
    return "Шанс = мин(75%, ставка / цена цели × 90%). Предметы и баланс ставки списываются в любом случае.";
  }
  if (value.includes("кейс")) {
    return "Рулетка только показывает уже выпавший на сервере предмет. Шансы указаны на странице кейса в базисных пунктах.";
  }
  return "Я на связи. Могу подсказать по кейсам, апгрейдам, инвентарю и демо-балансу.";
}

async function welcomeUser(userId: number) {
  await db.insert(transactions).values({
    userId,
    type: "reward",
    amount: 75000,
    note: "Приветственный бонус",
  });
  await db.insert(notifications).values({
    userId,
    title: "Добро пожаловать в КЕЙСЕР",
    body: "На баланс начислено 750 ₽. Это демо-кошелёк, реальные платежи не проводятся.",
  });
  await db.insert(messages).values({
    userId,
    nickname: "Поддержка",
    body: "Привет! Напиши, если нужно объяснить шансы, апгрейд или вывод.",
    fromSupport: true,
  });
}

export async function loginSteam(nickname?: string) {
  await ensureSeed();
  const name = sanitizeNick(nickname) || randomNick();
  const [existing] = await db
    .select()
    .from(users)
    .where(and(eq(users.nickname, name), eq(users.isBot, false)))
    .limit(1);
  if (existing && existing.steamId.startsWith("local-")) {
    await setSession(existing.id);
    return serializeUser(existing);
  }
  const steamId = `local-${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
  const [user] = await db
    .insert(users)
    .values({
      nickname: name,
      steamId,
      avatarHue: Math.floor(Math.random() * 360),
      balance: 75000,
    })
    .returning();
  await welcomeUser(user.id);
  await setSession(user.id);
  return serializeUser(user);
}

export async function upsertSteamUser(steamId: string, nickname: string | null, avatarUrl: string | null) {
  await ensureSeed();
  const [existing] = await db.select().from(users).where(eq(users.steamId, steamId)).limit(1);
  if (existing) {
    const [fresh] = await db
      .update(users)
      .set({
        nickname: sanitizeNick(nickname ?? undefined) || existing.nickname,
        avatarUrl: avatarUrl ?? existing.avatarUrl,
        lastSeen: new Date(),
      })
      .where(eq(users.id, existing.id))
      .returning();
    await setSession(fresh.id);
    return serializeUser(fresh);
  }
  const [user] = await db
    .insert(users)
    .values({
      nickname: sanitizeNick(nickname ?? undefined) || `Steam ${steamId.slice(-5)}`,
      steamId,
      avatarUrl,
      avatarHue: Math.floor(Math.random() * 360),
      balance: 75000,
    })
    .returning();
  await welcomeUser(user.id);
  await setSession(user.id);
  return serializeUser(user);
}

export async function openCase(userId: number, caseId: string, countInput: number) {
  await ensureSeed();
  const count = Math.min(5, Math.max(1, Math.floor(countInput) || 1));
  return db.transaction(async (tx) => {
    const [caseRow] = await tx.select().from(cases).where(eq(cases.id, caseId)).limit(1);
    if (!caseRow) throw new GameError("Кейс не найден", 404);
    const pool = await tx
      .select({ skin: skins, chance: caseSkins.chance })
      .from(caseSkins)
      .innerJoin(skins, eq(caseSkins.skinId, skins.id))
      .where(eq(caseSkins.caseId, caseId));
    if (!pool.length) throw new GameError("В кейсе нет предметов");
    const total = caseRow.price * count;
    const updated = await tx
      .update(users)
      .set({
        balance: sql`${users.balance} - ${total}`,
        casesOpened: sql`${users.casesOpened} + ${count}`,
      })
      .where(and(eq(users.id, userId), sql`${users.balance} >= ${total}`))
      .returning();
    if (!updated.length) throw new GameError("Недостаточно средств", 402);
    const user = updated[0];
    let dropSum = 0;
    let rare = 0;
    let bestValue = user.bestDropValue;
    let bestName = user.bestDropName;
    const results = [];
    for (let index = 0; index < count; index += 1) {
      const rolled = rollWeighted(pool.map((row) => ({ ...row, weight: row.chance })));
      const skin = rolled.entry.skin;
      const wear = rollWear(skin.rarity);
      const stattrak = isRare(skin.rarity) && Math.random() < 0.08;
      const value = stattrak ? Math.round(skin.price * 1.15) : skin.price;
      const [item] = await tx
        .insert(inventory)
        .values({
          userId,
          skinId: skin.id,
          status: "owned",
          source: "case",
          value,
          floatThousandths: wear.floatThousandths,
          wear: wear.wear,
          stattrak,
          caseId,
        })
        .returning();
      await tx.insert(drops).values({
        userId,
        nickname: user.nickname,
        avatarHue: user.avatarHue,
        skinId: skin.id,
        skinName: stattrak ? `ST ${skin.name}` : skin.name,
        rarity: skin.rarity,
        price: value,
        caseId,
        caseName: caseRow.name,
      });
      await tx.insert(opens).values({
        userId,
        caseId,
        skinId: skin.id,
        inventoryId: item.id,
        roll: rolled.roll,
        value,
      });
      await tx.insert(transactions).values({
        userId,
        type: "case",
        amount: -caseRow.price,
        note: `Открытие «${caseRow.name}»`,
      });
      dropSum += value;
      if (isRare(skin.rarity)) rare += 1;
      if (value > bestValue) {
        bestValue = value;
        bestName = skin.name;
      }
      results.push({
        inventoryId: item.id,
        roll: rolled.roll,
        rollMax: rolled.total,
        stattrak,
        wear: wear.wear,
        floatThousandths: wear.floatThousandths,
        value,
        skin: serializeSkin(skin),
        chance: rolled.entry.chance,
      });
    }
    await tx
      .update(users)
      .set({
        totalDropValue: sql`${users.totalDropValue} + ${dropSum}`,
        rareDrops: sql`${users.rareDrops} + ${rare}`,
        bestDropValue: bestValue,
        bestDropName: bestName,
      })
      .where(eq(users.id, userId));
    const highlight = [...results].sort((a, b) => b.value - a.value)[0];
    if (highlight && isRare(highlight.skin.rarity)) {
      await tx.insert(notifications).values({
        userId,
        title: highlight.skin.rarity === "gold" ? "Контрабанда" : "Редкий дроп",
        body: `${highlight.skin.name} теперь в инвентаре.`,
      });
    }
    const [fresh] = await tx.select().from(users).where(eq(users.id, userId)).limit(1);
    return { results, user: serializeUser(fresh) };
  });
}

export async function sellItems(userId: number, ids: number[]) {
  const unique = [...new Set(ids)].filter((id) => Number.isInteger(id) && id > 0);
  if (!unique.length) throw new GameError("Нечего продавать");
  return db.transaction(async (tx) => {
    const marked = await tx
      .update(inventory)
      .set({ status: "sold", soldAt: new Date() })
      .where(and(eq(inventory.userId, userId), eq(inventory.status, "owned"), inArray(inventory.id, unique)))
      .returning();
    if (marked.length !== unique.length) throw new GameError("Некоторые предметы уже недоступны");
    const sum = marked.reduce((total, item) => total + item.value, 0);
    const skinRows = await tx.select().from(skins).where(inArray(skins.id, marked.map((item) => item.skinId)));
    const names = skinRows.map((skin) => skin.name).join(", ").slice(0, 160);
    const [fresh] = await tx
      .update(users)
      .set({ balance: sql`${users.balance} + ${sum}` })
      .where(eq(users.id, userId))
      .returning();
    await tx.insert(transactions).values({
      userId,
      type: "sell",
      amount: sum,
      note: marked.length === 1 ? `Продажа: ${names}` : `Продажа ${marked.length} предметов`,
    });
    return { sold: marked.length, sum, user: serializeUser(fresh) };
  });
}

export async function doUpgrade(userId: number, itemIds: number[], balanceStakeInput: number, targetSkinId: string) {
  await ensureSeed();
  const stakeBalance = Math.max(0, Math.floor(balanceStakeInput) || 0);
  const ids = [...new Set(itemIds)].filter((id) => Number.isInteger(id) && id > 0);
  return db.transaction(async (tx) => {
    const [target] = await tx.select().from(skins).where(eq(skins.id, targetSkinId)).limit(1);
    if (!target) throw new GameError("Предмет для апгрейда не найден", 404);
    const owned = ids.length
      ? await tx
          .select()
          .from(inventory)
          .where(and(eq(inventory.userId, userId), eq(inventory.status, "owned"), inArray(inventory.id, ids)))
      : [];
    if (owned.length !== ids.length) throw new GameError("Предметы ставки недоступны");
    const itemsValue = owned.reduce((total, item) => total + item.value, 0);
    const stake = itemsValue + stakeBalance;
    if (stake <= 0) throw new GameError("Выберите предметы или баланс");
    if (target.price <= stake) throw new GameError("Цель должна быть дороже ставки");
    const chanceBps = upgradeChanceBps(stake, target.price);
    const charged = await tx
      .update(users)
      .set({
        balance: sql`${users.balance} - ${stakeBalance}`,
        upgradesDone: sql`${users.upgradesDone} + 1`,
      })
      .where(and(eq(users.id, userId), sql`${users.balance} >= ${stakeBalance}`))
      .returning();
    if (!charged.length) throw new GameError("Недостаточно баланса", 402);
    if (ids.length) {
      const marked = await tx
        .update(inventory)
        .set({ status: "upgraded" })
        .where(and(eq(inventory.userId, userId), eq(inventory.status, "owned"), inArray(inventory.id, ids)))
        .returning();
      if (marked.length !== ids.length) throw new GameError("Предметы ставки уже использованы");
    }
    const success = Math.floor(Math.random() * 10000) < chanceBps;
    let won: {
      inventoryId: number;
      wear: string;
      floatThousandths: number;
      value: number;
      skin: ReturnType<typeof serializeSkin>;
    } | null = null;
    if (success) {
      const wear = rollWear(target.rarity);
      const [item] = await tx
        .insert(inventory)
        .values({
          userId,
          skinId: target.id,
          status: "owned",
          source: "upgrade",
          value: target.price,
          floatThousandths: wear.floatThousandths,
          wear: wear.wear,
          stattrak: false,
        })
        .returning();
      won = {
        inventoryId: item.id,
        wear: wear.wear,
        floatThousandths: wear.floatThousandths,
        value: target.price,
        skin: serializeSkin(target),
      };
      const patch: {
        upgradesWon: ReturnType<typeof sql>;
        totalDropValue: ReturnType<typeof sql>;
        rareDrops?: ReturnType<typeof sql>;
        bestDropValue?: number;
        bestDropName?: string;
      } = {
        upgradesWon: sql`${users.upgradesWon} + 1`,
        totalDropValue: sql`${users.totalDropValue} + ${target.price}`,
      };
      if (isRare(target.rarity)) patch.rareDrops = sql`${users.rareDrops} + 1`;
      if (target.price > charged[0].bestDropValue) {
        patch.bestDropValue = target.price;
        patch.bestDropName = target.name;
      }
      await tx.update(users).set(patch).where(eq(users.id, userId));
      await tx.insert(drops).values({
        userId,
        nickname: charged[0].nickname,
        avatarHue: charged[0].avatarHue,
        skinId: target.id,
        skinName: target.name,
        rarity: target.rarity,
        price: target.price,
        caseName: "Апгрейд",
      });
      await tx.insert(notifications).values({
        userId,
        title: "Апгрейд удался",
        body: target.name,
      });
    }
    await tx.insert(upgrades).values({
      userId,
      targetSkinId: target.id,
      stakeValue: stake,
      chanceBps,
      success,
      stakeNote: `${owned.length} предм. + ${formatMoney(stakeBalance)}`,
    });
    await tx.insert(transactions).values({
      userId,
      type: success ? "upgrade_win" : "upgrade_loss",
      amount: success ? target.price - stake : -stake,
      note: success ? `Апгрейд удался: ${target.name}` : `Апгрейд сгорел: ${target.name}`,
    });
    const [fresh] = await tx.select().from(users).where(eq(users.id, userId)).limit(1);
    return {
      success,
      chanceBps,
      stake,
      won,
      target: serializeSkin(target),
      user: serializeUser(fresh),
    };
  });
}

export async function deposit(userId: number, rubles: number, method: string) {
  if (!DEPOSIT_METHODS.includes(method)) throw new GameError("Неизвестный способ пополнения");
  const amount = rubleToCents(rubles);
  if (amount < 5000 || amount > 10_000_000) throw new GameError("Сумма от 50 до 100 000 ₽");
  return db.transaction(async (tx) => {
    const [fresh] = await tx
      .update(users)
      .set({ balance: sql`${users.balance} + ${amount}` })
      .where(eq(users.id, userId))
      .returning();
    if (!fresh) throw new GameError("Профиль не найден", 404);
    await tx.insert(transactions).values({
      userId,
      type: "deposit",
      amount,
      note: `Демо-пополнение · ${METHOD_LABELS[method] ?? method}`,
    });
    await tx.insert(notifications).values({
      userId,
      title: "Баланс пополнен",
      body: formatMoney(amount),
    });
    return { user: serializeUser(fresh) };
  });
}

export async function withdraw(userId: number, rubles: number, method: string, destination: string) {
  if (!WITHDRAW_METHODS.includes(method)) throw new GameError("Неизвестный способ вывода");
  const amount = rubleToCents(rubles);
  if (amount < 10000 || amount > 10_000_000) throw new GameError("Вывод от 100 до 100 000 ₽");
  const dest = destination.trim().slice(0, 120);
  if (dest.length < 4) throw new GameError("Укажите реквизиты");
  return db.transaction(async (tx) => {
    const [fresh] = await tx
      .update(users)
      .set({ balance: sql`${users.balance} - ${amount}` })
      .where(and(eq(users.id, userId), sql`${users.balance} >= ${amount}`))
      .returning();
    if (!fresh) throw new GameError("Недостаточно средств", 402);
    const [row] = await tx
      .insert(withdrawals)
      .values({ userId, amount, method, destination: dest, status: "pending" })
      .returning();
    await tx.insert(transactions).values({
      userId,
      type: "withdraw",
      amount: -amount,
      note: `Заявка #${row.id} · ${METHOD_LABELS[method] ?? method}`,
    });
    await tx.insert(notifications).values({
      userId,
      title: "Заявка на вывод",
      body: `${formatMoney(amount)} · на рассмотрении`,
    });
    return {
      user: serializeUser(fresh),
      withdrawal: {
        id: row.id,
        amount: row.amount,
        method: row.method,
        destination: row.destination,
        status: row.status,
        createdAt: row.createdAt.toISOString(),
      },
    };
  });
}

export async function claimReward(userId: number, key: string) {
  return db.transaction(async (tx) => {
    const [user] = await tx.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new GameError("Профиль не найден", 404);
    if (key === "daily") {
      const today = moscowDate();
      const yesterday = moscowDate(new Date(Date.now() - 86_400_000));
      const last = user.lastDaily ? moscowDate(user.lastDaily) : null;
      if (last === today) throw new GameError("Ежедневная награда уже получена");
      const streak = last === yesterday ? user.streak + 1 : 1;
      const amount = dailyAmount(streak);
      const rewardKey = `daily:${today}`;
      const existing = await tx
        .select()
        .from(rewardClaims)
        .where(and(eq(rewardClaims.userId, userId), eq(rewardClaims.rewardKey, rewardKey)))
        .limit(1);
      if (existing.length) throw new GameError("Ежедневная награда уже получена");
      await tx.insert(rewardClaims).values({ userId, rewardKey });
      const [fresh] = await tx
        .update(users)
        .set({
          balance: sql`${users.balance} + ${amount}`,
          streak,
          lastDaily: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();
      await tx.insert(transactions).values({
        userId,
        type: "reward",
        amount,
        note: `Ежедневная награда · серия ${streak}`,
      });
      await tx.insert(notifications).values({
        userId,
        title: "Ежедневная награда",
        body: formatMoney(amount),
      });
      return { user: serializeUser(fresh), amount };
    }
    const milestone = MILESTONES.find((item) => item.key === key);
    if (!milestone) throw new GameError("Награда не найдена", 404);
    if (user[milestone.field] < milestone.goal) throw new GameError("Условие ещё не выполнено");
    const existing = await tx
      .select()
      .from(rewardClaims)
      .where(and(eq(rewardClaims.userId, userId), eq(rewardClaims.rewardKey, key)))
      .limit(1);
    if (existing.length) throw new GameError("Награда уже получена");
    await tx.insert(rewardClaims).values({ userId, rewardKey: key });
    const [fresh] = await tx
      .update(users)
      .set({ balance: sql`${users.balance} + ${milestone.reward}` })
      .where(eq(users.id, userId))
      .returning();
    await tx.insert(transactions).values({
      userId,
      type: "reward",
      amount: milestone.reward,
      note: milestone.title,
    });
    return { user: serializeUser(fresh), amount: milestone.reward };
  });
}

export async function redeemCoupon(userId: number, codeInput: string) {
  const code = codeInput.trim().toUpperCase();
  if (!code) throw new GameError("Введите код");
  return db.transaction(async (tx) => {
    const [coupon] = await tx.select().from(coupons).where(eq(coupons.code, code)).limit(1);
    if (!coupon) throw new GameError("Купон не найден");
    const existing = await tx
      .select()
      .from(couponRedemptions)
      .where(and(eq(couponRedemptions.userId, userId), eq(couponRedemptions.code, code)))
      .limit(1);
    if (existing.length) throw new GameError("Купон уже использован");
    await tx.insert(couponRedemptions).values({ userId, code });
    const [fresh] = await tx
      .update(users)
      .set({ balance: sql`${users.balance} + ${coupon.amount}` })
      .where(eq(users.id, userId))
      .returning();
    await tx.insert(transactions).values({
      userId,
      type: "reward",
      amount: coupon.amount,
      note: `Купон ${code}`,
    });
    return { user: serializeUser(fresh), amount: coupon.amount };
  });
}

export async function updateTradeUrl(userId: number, tradeUrl: string) {
  const value = tradeUrl.trim().slice(0, 200);
  const [fresh] = await db.update(users).set({ tradeUrl: value || null }).where(eq(users.id, userId)).returning();
  if (!fresh) throw new GameError("Профиль не найден", 404);
  return { user: serializeUser(fresh) };
}

export async function sendChat(userId: number, body: string) {
  const text = body.trim().slice(0, 500);
  if (text.length < 1) throw new GameError("Пустое сообщение");
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new GameError("Войдите через Steam", 401);
  await db.insert(messages).values({ userId, nickname: user.nickname, body: text, fromSupport: false });
  await db.insert(messages).values({
    userId,
    nickname: "Поддержка",
    body: supportReply(text),
    fromSupport: true,
  });
  return true;
}

export async function markNotificationsRead(userId: number) {
  await db.update(notifications).set({ read: true }).where(eq(notifications.userId, userId));
}

export function asRarity(value: string): Rarity {
  if (value === "purple" || value === "pink" || value === "red" || value === "gold") return value;
  return "blue";
}
