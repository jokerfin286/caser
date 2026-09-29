import { and, desc, eq, sql } from "drizzle-orm";
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
import { dailyAmount, moscowDate } from "@/lib/format";
import type {
  CaseDTO,
  CaseSkinDTO,
  ChatDTO,
  DropDTO,
  InventoryDTO,
  NoticeDTO,
  SkinDTO,
  TxDTO,
  UpgradeDTO,
  UserDTO,
  WithdrawalDTO,
} from "@/lib/types";
import { getUserId } from "@/server/session";
import { ensureSeed } from "@/server/seed";

export function serializeSkin(row: typeof skins.$inferSelect): SkinDTO {
  return {
    id: row.id,
    name: row.name,
    rarity: row.rarity as SkinDTO["rarity"],
    price: row.price,
    image: row.image,
  };
}

export function serializeCase(row: typeof cases.$inferSelect): CaseDTO {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    image: row.image,
    label: row.label,
    tagline: row.tagline,
    story: row.story,
    category: row.category,
    accent: row.accent,
    timerEndsAt: row.timerEndsAt ? row.timerEndsAt.toISOString() : null,
    sortOrder: row.sortOrder,
  };
}

export function serializeUser(row: typeof users.$inferSelect): UserDTO {
  return {
    id: row.id,
    nickname: row.nickname,
    steamId: row.steamId,
    avatarHue: row.avatarHue,
    avatarUrl: row.avatarUrl,
    isSteam: !row.steamId.startsWith("local-"),
    balance: row.balance,
    tradeUrl: row.tradeUrl,
    createdAt: row.createdAt.toISOString(),
    casesOpened: row.casesOpened,
    upgradesDone: row.upgradesDone,
    upgradesWon: row.upgradesWon,
    totalDropValue: row.totalDropValue,
    bestDropValue: row.bestDropValue,
    bestDropName: row.bestDropName,
    streak: row.streak,
    rareDrops: row.rareDrops,
  };
}

function serializeDrop(drop: typeof drops.$inferSelect, skin: typeof skins.$inferSelect): DropDTO {
  return {
    id: drop.id,
    nickname: drop.nickname,
    avatarHue: drop.avatarHue,
    skinName: drop.skinName,
    skinId: drop.skinId,
    rarity: drop.rarity as DropDTO["rarity"],
    price: drop.price,
    caseName: drop.caseName,
    caseId: drop.caseId,
    createdAt: drop.createdAt.toISOString(),
    image: skin.image,
  };
}

function serializeNotice(row: typeof notifications.$inferSelect): NoticeDTO {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    read: row.read,
    createdAt: row.createdAt.toISOString(),
  };
}

function serializeItem(
  item: typeof inventory.$inferSelect,
  skin: typeof skins.$inferSelect,
): InventoryDTO {
  return {
    id: item.id,
    skin: serializeSkin(skin),
    value: item.value,
    wear: item.wear,
    floatThousandths: item.floatThousandths,
    stattrak: item.stattrak,
    source: item.source,
    acquiredAt: item.acquiredAt.toISOString(),
    caseId: item.caseId,
    status: item.status,
  };
}

export async function getOnline() {
  const [row] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(users)
    .where(and(eq(users.isBot, false), sql`${users.lastSeen} > now() - interval '3 minutes'`));
  const now = new Date();
  return 980 + now.getHours() * 16 + (now.getMinutes() % 5) * 4 + Number(row?.c ?? 0);
}

async function maybeSimulateDrop() {
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(420043)`);
    const [last] = await tx
      .select({ createdAt: drops.createdAt })
      .from(drops)
      .orderBy(desc(drops.createdAt))
      .limit(1);
    if (last && Date.now() - new Date(last.createdAt).getTime() < 7500) return;
    const bots = await tx.select().from(users).where(eq(users.isBot, true));
    if (!bots.length) return;
    const roll = Math.random();
    const rarity = roll < 0.62 ? "blue" : roll < 0.86 ? "purple" : roll < 0.95 ? "pink" : roll < 0.99 ? "red" : "gold";
    const pool = await tx.select().from(skins).where(eq(skins.rarity, rarity));
    const skin = pool[Math.floor(Math.random() * pool.length)];
    if (!skin) return;
    const bot = bots[Math.floor(Math.random() * bots.length)];
    const [link] = await tx.select().from(caseSkins).where(eq(caseSkins.skinId, skin.id)).limit(1);
    let caseName: string | null = null;
    const caseId = link?.caseId ?? null;
    if (caseId) {
      const [parent] = await tx.select().from(cases).where(eq(cases.id, caseId)).limit(1);
      caseName = parent?.name ?? null;
    }
    await tx.insert(drops).values({
      userId: bot.id,
      nickname: bot.nickname,
      avatarHue: bot.avatarHue,
      skinId: skin.id,
      skinName: skin.name,
      rarity: skin.rarity,
      price: skin.price,
      caseId,
      caseName,
    });
  });
}

export async function readDrops(limit = 24) {
  const rows = await db
    .select({ drop: drops, skin: skins })
    .from(drops)
    .innerJoin(skins, eq(drops.skinId, skins.id))
    .orderBy(desc(drops.createdAt))
    .limit(limit);
  return rows.map(({ drop, skin }) => serializeDrop(drop, skin));
}

export async function listCases() {
  await ensureSeed();
  const rows = await db.select().from(cases).orderBy(cases.sortOrder);
  return rows.map(serializeCase);
}

export async function getCaseDetail(id: string, userId: number | null) {
  await ensureSeed();
  const [caseRow] = await db.select().from(cases).where(eq(cases.id, id)).limit(1);
  if (!caseRow) return null;
  const pool = await db
    .select({ skin: skins, chance: caseSkins.chance })
    .from(caseSkins)
    .innerJoin(skins, eq(caseSkins.skinId, skins.id))
    .where(eq(caseSkins.caseId, id));
  const recent = await db
    .select({ drop: drops, skin: skins })
    .from(drops)
    .innerJoin(skins, eq(drops.skinId, skins.id))
    .where(eq(drops.caseId, id))
    .orderBy(desc(drops.createdAt))
    .limit(10);
  const mine = userId
    ? await db
        .select({ open: opens, skin: skins })
        .from(opens)
        .innerJoin(skins, eq(opens.skinId, skins.id))
        .where(and(eq(opens.userId, userId), eq(opens.caseId, id)))
        .orderBy(desc(opens.createdAt))
        .limit(10)
    : [];
  const skinsOut: CaseSkinDTO[] = pool
    .map((row) => ({ ...serializeSkin(row.skin), chance: row.chance }))
    .sort((a, b) => b.price - a.price);
  return {
    case: serializeCase(caseRow),
    skins: skinsOut,
    recent: recent.map(({ drop, skin }) => serializeDrop(drop, skin)),
    mine: mine.map(({ open, skin }) => ({
      id: open.id,
      roll: open.roll,
      value: open.value,
      createdAt: open.createdAt.toISOString(),
      skin: serializeSkin(skin),
    })),
  };
}

export async function listNotifications(userId: number) {
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(12);
  const [countRow] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
  return { items: rows.map(serializeNotice), unread: Number(countRow?.c ?? 0) };
}

export async function getBootstrap() {
  await ensureSeed();
  const userId = await getUserId();
  const [user] = userId ? await db.select().from(users).where(eq(users.id, userId)).limit(1) : [];
  const [dropList, online, notes] = await Promise.all([
    readDrops(),
    getOnline(),
    userId ? listNotifications(userId) : Promise.resolve({ items: [], unread: 0 }),
  ]);
  return {
    user: user ? serializeUser(user) : null,
    online,
    drops: dropList,
    notifications: notes.items,
    unread: notes.unread,
  };
}

export async function tickFeed(userId: number | null) {
  await ensureSeed();
  await maybeSimulateDrop();
  if (userId) {
    await db.update(users).set({ lastSeen: new Date() }).where(eq(users.id, userId));
  }
  const [dropList, online] = await Promise.all([readDrops(), getOnline()]);
  let balance: number | null = null;
  let notes: NoticeDTO[] = [];
  let unread = 0;
  if (userId) {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    balance = user?.balance ?? null;
    const packed = await listNotifications(userId);
    notes = packed.items;
    unread = packed.unread;
  }
  return { online, drops: dropList, balance, notifications: notes, unread };
}

export async function listInventory(userId: number) {
  const rows = await db
    .select({ item: inventory, skin: skins })
    .from(inventory)
    .innerJoin(skins, eq(inventory.skinId, skins.id))
    .where(eq(inventory.userId, userId))
    .orderBy(desc(inventory.acquiredAt));
  const owned = rows.filter((row) => row.item.status === "owned").map((row) => serializeItem(row.item, row.skin));
  const sold = rows
    .filter((row) => row.item.status === "sold")
    .slice(0, 40)
    .map((row) => serializeItem(row.item, row.skin));
  const upgradeRows = await db
    .select({ upgrade: upgrades, skin: skins })
    .from(upgrades)
    .innerJoin(skins, eq(upgrades.targetSkinId, skins.id))
    .where(eq(upgrades.userId, userId))
    .orderBy(desc(upgrades.createdAt))
    .limit(30);
  const history: UpgradeDTO[] = upgradeRows.map((row) => ({
    id: row.upgrade.id,
    success: row.upgrade.success,
    stakeValue: row.upgrade.stakeValue,
    chanceBps: row.upgrade.chanceBps,
    stakeNote: row.upgrade.stakeNote,
    createdAt: row.upgrade.createdAt.toISOString(),
    target: serializeSkin(row.skin),
  }));
  const openRows = await db
    .select({ open: opens, skin: skins, caseName: cases.name })
    .from(opens)
    .innerJoin(skins, eq(opens.skinId, skins.id))
    .innerJoin(cases, eq(opens.caseId, cases.id))
    .where(eq(opens.userId, userId))
    .orderBy(desc(opens.createdAt))
    .limit(30);
  return {
    items: owned,
    sold,
    upgrades: history,
    opens: openRows.map((row) => ({
      id: row.open.id,
      value: row.open.value,
      roll: row.open.roll,
      createdAt: row.open.createdAt.toISOString(),
      caseName: row.caseName,
      skin: serializeSkin(row.skin),
    })),
  };
}

export async function listSkins() {
  await ensureSeed();
  const rows = await db.select().from(skins).orderBy(skins.price);
  return rows.map(serializeSkin);
}

export async function getProfile(userId: number) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;
  const txs = await db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.createdAt))
    .limit(40);
  const cashouts = await db
    .select()
    .from(withdrawals)
    .where(eq(withdrawals.userId, userId))
    .orderBy(desc(withdrawals.createdAt))
    .limit(20);
  const txList: TxDTO[] = txs.map((row) => ({
    id: row.id,
    type: row.type,
    amount: row.amount,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
  }));
  const withdrawalList: WithdrawalDTO[] = cashouts.map((row) => ({
    id: row.id,
    amount: row.amount,
    method: row.method,
    destination: row.destination,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  }));
  const [rankRow] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(users)
    .where(sql`${users.bestDropValue} > ${user.bestDropValue}`);
  return {
    user: serializeUser(user),
    transactions: txList,
    withdrawals: withdrawalList,
    rank: Number(rankRow?.c ?? 0) + 1,
  };
}

const MILESTONES = [
  { key: "cases_5", title: "Пять открытий", hint: "Откройте 5 кейсов", goal: 5, field: "casesOpened" as const, reward: 10000 },
  { key: "cases_25", title: "Серия из 25", hint: "Откройте 25 кейсов", goal: 25, field: "casesOpened" as const, reward: 50000 },
  { key: "upgrades_3", title: "Три контракта", hint: "Сделайте 3 апгрейда", goal: 3, field: "upgradesDone" as const, reward: 15000 },
  { key: "rare_1", title: "Первая редкость", hint: "Поймайте тайное или контрабанду", goal: 1, field: "rareDrops" as const, reward: 20000 },
];

export async function getRewards(userId: number | null) {
  await ensureSeed();
  const [user] = userId ? await db.select().from(users).where(eq(users.id, userId)).limit(1) : [];
  const claims = userId
    ? await db.select().from(rewardClaims).where(eq(rewardClaims.userId, userId))
    : [];
  const claimed = new Set(claims.map((row) => row.rewardKey));
  const today = moscowDate();
  const yesterday = moscowDate(new Date(Date.now() - 86_400_000));
  const last = user?.lastDaily ? moscowDate(user.lastDaily) : null;
  const available = Boolean(user) && last !== today;
  const nextStreak = !user ? 1 : last === yesterday ? user.streak + 1 : last === today ? user.streak : 1;
  const couponRows = await db.select().from(coupons);
  const redeemed = userId
    ? await db.select().from(couponRedemptions).where(eq(couponRedemptions.userId, userId))
    : [];
  const redeemedSet = new Set(redeemed.map((row) => row.code));
  const leaders = await db
    .select()
    .from(users)
    .orderBy(desc(users.bestDropValue), desc(users.totalDropValue))
    .limit(10);
  return {
    daily: {
      available,
      streak: user?.streak ?? 0,
      amount: dailyAmount(available ? nextStreak : user?.streak || 1),
      nextStreak,
    },
    milestones: MILESTONES.map((item) => {
      const progress = user ? user[item.field] : 0;
      return {
        ...item,
        progress,
        claimed: claimed.has(item.key),
        ready: Boolean(user) && progress >= item.goal && !claimed.has(item.key),
      };
    }),
    coupons: couponRows.map((row) => ({
      code: row.code,
      amount: row.amount,
      description: row.description,
      redeemed: redeemedSet.has(row.code),
    })),
    leaderboard: leaders.map((row, index) => ({
      rank: index + 1,
      nickname: row.nickname,
      avatarHue: row.avatarHue,
      bestDropName: row.bestDropName,
      bestDropValue: row.bestDropValue,
      casesOpened: row.casesOpened,
      isMe: row.id === userId,
    })),
  };
}

export async function getChat(userId: number) {
  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.userId, userId))
    .orderBy(messages.createdAt)
    .limit(80);
  const list: ChatDTO[] = rows.map((row) => ({
    id: row.id,
    nickname: row.nickname,
    body: row.body,
    fromSupport: row.fromSupport,
    createdAt: row.createdAt.toISOString(),
  }));
  return list;
}
