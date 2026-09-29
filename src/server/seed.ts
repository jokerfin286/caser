import { sql } from "drizzle-orm";
import { db } from "@/db";
import { caseSkins, cases, coupons, drops, skins, users } from "@/db/schema";
import { CASES, type SkinDef } from "@/lib/catalog";

let ready = false;

const BOTS = [
  { nickname: "never win", hue: 18, best: "M4A4 | Howl", value: 1192000, casesOpened: 86 },
  { nickname: "яйцо", hue: 48, best: "★ Karambit | Doppler", value: 792000, casesOpened: 54 },
  { nickname: "coldlane", hue: 200, best: "AK-47 | Bloodsport", value: 208600, casesOpened: 120 },
  { nickname: "mirage_only", hue: 142, best: "★ Flip Knife | Blue Steel", value: 232000, casesOpened: 40 },
  { nickname: "eco_round", hue: 268, best: "Desert Eagle | Code Red", value: 54600, casesOpened: 33 },
  { nickname: "dropgod", hue: 320, best: "★ Butterfly Knife | Fade", value: 3990000, casesOpened: 210 },
  { nickname: "nafany", hue: 88, best: "M4A1-S | Cyrex", value: 44600, casesOpened: 17 },
  { nickname: "silentawp", hue: 210, best: "AWP | Neo-Noir", value: 96600, casesOpened: 64 },
  { nickname: "recoilqueen", hue: 340, best: "★ Sport Gloves | Pandora's Box", value: 552000, casesOpened: 77 },
  { nickname: "palace", hue: 12, best: "AK-47 | Neon Rider", value: 138600, casesOpened: 29 },
];

export async function ensureSeed() {
  if (ready) return;
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(420042)`);
    const existing = await tx.select({ id: cases.id }).from(cases).limit(1);
    if (existing.length) return;

    const now = Date.now();
    await tx.insert(cases).values(
      CASES.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price * 100,
        image: item.image,
        label: item.label,
        tagline: item.tagline,
        story: item.story,
        category: item.category,
        accent: item.accent,
        timerEndsAt: item.timerHours ? new Date(now + item.timerHours * 3_600_000) : null,
        sortOrder: item.sortOrder,
      })),
    );

    const skinRows = new Map<string, SkinDef>();
    for (const item of CASES) {
      const sum = item.skins.reduce((total, skin) => total + skin.chance, 0);
      if (sum !== 10000) throw new Error(`Шансы кейса ${item.id} = ${sum}`);
      for (const skin of item.skins) {
        if (skinRows.has(skin.id)) throw new Error(`Дубль скина ${skin.id}`);
        skinRows.set(skin.id, skin);
      }
    }

    await tx.insert(skins).values(
      [...skinRows.values()].map((skin) => ({
        id: skin.id,
        name: skin.name,
        rarity: skin.rarity,
        price: skin.price * 100,
        image: skin.image,
      })),
    );

    await tx.insert(caseSkins).values(
      CASES.flatMap((item) =>
        item.skins.map((skin) => ({
          caseId: item.id,
          skinId: skin.id,
          chance: skin.chance,
        })),
      ),
    );

    await tx.insert(coupons).values([
      { code: "CHICKEN", amount: 5000, description: "50 ₽ к операции Chicken Farm" },
      { code: "FARM100", amount: 10000, description: "100 ₽ на демо-баланс" },
      { code: "KEISER200", amount: 20000, description: "200 ₽ для первых открытий" },
    ]);

    const botRows = await tx
      .insert(users)
      .values(
        BOTS.map((bot, index) => ({
          nickname: bot.nickname,
          steamId: `bot-${1000 + index}`,
          avatarHue: bot.hue,
          balance: 0,
          casesOpened: bot.casesOpened,
          upgradesDone: 3 + index,
          upgradesWon: index % 4,
          totalDropValue: bot.value * 3,
          bestDropValue: bot.value,
          bestDropName: bot.best,
          rareDrops: 1 + (index % 5),
          isBot: true,
          streak: index % 3,
        })),
      )
      .returning();

    const allSkins = [...skinRows.values()];
    const common = allSkins.filter((skin) => skin.rarity === "blue" || skin.rarity === "purple");
    await tx.insert(drops).values(
      Array.from({ length: 18 }, (_, index) => {
        const bot = botRows[index % botRows.length];
        const skin =
          index % 8 === 0
            ? (allSkins.find((item) => item.rarity === "red") ?? allSkins[0])
            : common[index % common.length];
        const parent = CASES.find((item) => item.skins.some((entry) => entry.id === skin.id)) ?? CASES[0];
        return {
          userId: bot.id,
          nickname: bot.nickname,
          avatarHue: bot.avatarHue,
          skinId: skin.id,
          skinName: skin.name,
          rarity: skin.rarity,
          price: skin.price * 100,
          caseId: parent.id,
          caseName: parent.name,
          createdAt: new Date(now - (18 - index) * 42_000),
        };
      }),
    );
  });
  ready = true;
}
