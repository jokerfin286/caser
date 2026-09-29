import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  nickname: text("nickname").notNull(),
  steamId: text("steam_id").notNull().unique(),
  avatarHue: integer("avatar_hue").notNull().default(128),
  avatarUrl: text("avatar_url"),
  balance: integer("balance").notNull().default(0),
  tradeUrl: text("trade_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastSeen: timestamp("last_seen", { withTimezone: true }).notNull().defaultNow(),
  lastDaily: timestamp("last_daily", { withTimezone: true }),
  casesOpened: integer("cases_opened").notNull().default(0),
  upgradesDone: integer("upgrades_done").notNull().default(0),
  upgradesWon: integer("upgrades_won").notNull().default(0),
  totalDropValue: integer("total_drop_value").notNull().default(0),
  bestDropValue: integer("best_drop_value").notNull().default(0),
  bestDropName: text("best_drop_name"),
  streak: integer("streak").notNull().default(0),
  rareDrops: integer("rare_drops").notNull().default(0),
  isBot: boolean("is_bot").notNull().default(false),
});

export const cases = pgTable("cases", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  image: text("image").notNull(),
  label: text("label"),
  tagline: text("tagline").notNull(),
  story: text("story").notNull(),
  category: text("category").notNull(),
  accent: text("accent").notNull(),
  timerEndsAt: timestamp("timer_ends_at", { withTimezone: true }),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const skins = pgTable("skins", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  rarity: text("rarity").notNull(),
  price: integer("price").notNull(),
  image: text("image").notNull(),
});

export const caseSkins = pgTable(
  "case_skins",
  {
    id: serial("id").primaryKey(),
    caseId: text("case_id").notNull(),
    skinId: text("skin_id").notNull(),
    chance: integer("chance").notNull(),
  },
  (t) => [index("case_skins_case_idx").on(t.caseId)],
);

export const inventory = pgTable(
  "inventory",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    skinId: text("skin_id").notNull(),
    status: text("status").notNull().default("owned"),
    source: text("source").notNull(),
    value: integer("value").notNull(),
    floatThousandths: integer("float_thousandths").notNull().default(150),
    wear: text("wear").notNull().default("FT"),
    stattrak: boolean("stattrak").notNull().default(false),
    caseId: text("case_id"),
    acquiredAt: timestamp("acquired_at", { withTimezone: true }).notNull().defaultNow(),
    soldAt: timestamp("sold_at", { withTimezone: true }),
  },
  (t) => [index("inventory_user_status_idx").on(t.userId, t.status)],
);

export const drops = pgTable(
  "drops",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id"),
    nickname: text("nickname").notNull(),
    avatarHue: integer("avatar_hue").notNull(),
    skinId: text("skin_id").notNull(),
    skinName: text("skin_name").notNull(),
    rarity: text("rarity").notNull(),
    price: integer("price").notNull(),
    caseId: text("case_id"),
    caseName: text("case_name"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("drops_created_idx").on(t.createdAt)],
);

export const transactions = pgTable(
  "transactions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    type: text("type").notNull(),
    amount: integer("amount").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("transactions_user_idx").on(t.userId)],
);

export const withdrawals = pgTable("withdrawals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(),
  method: text("method").notNull(),
  destination: text("destination").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const upgrades = pgTable("upgrades", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  targetSkinId: text("target_skin_id").notNull(),
  stakeValue: integer("stake_value").notNull(),
  chanceBps: integer("chance_bps").notNull(),
  success: boolean("success").notNull(),
  stakeNote: text("stake_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notifications_user_idx").on(t.userId)],
);

export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id"),
    nickname: text("nickname").notNull(),
    body: text("body").notNull(),
    fromSupport: boolean("from_support").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("messages_user_idx").on(t.userId)],
);

export const rewardClaims = pgTable(
  "reward_claims",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    rewardKey: text("reward_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("reward_user_key").on(t.userId, t.rewardKey)],
);

export const coupons = pgTable("coupons", {
  code: text("code").primaryKey(),
  amount: integer("amount").notNull(),
  description: text("description").notNull(),
});

export const couponRedemptions = pgTable(
  "coupon_redemptions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    code: text("code").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("coupon_user_code").on(t.userId, t.code)],
);

export const opens = pgTable(
  "opens",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    caseId: text("case_id").notNull(),
    skinId: text("skin_id").notNull(),
    inventoryId: integer("inventory_id"),
    roll: integer("roll").notNull(),
    value: integer("value").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("opens_user_case_idx").on(t.userId, t.caseId)],
);
