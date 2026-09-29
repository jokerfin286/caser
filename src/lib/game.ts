import type { Rarity } from "@/lib/catalog";

export function rollWeighted<T extends { weight: number }>(entries: T[]) {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  let cursor = Math.floor(Math.random() * Math.max(total, 1));
  const roll = cursor;
  for (const entry of entries) {
    if (cursor < entry.weight) return { entry, roll, total };
    cursor -= entry.weight;
  }
  return { entry: entries[entries.length - 1], roll: Math.max(0, total - 1), total };
}

export function rollWear(rarity: Rarity | string) {
  const bias = rarity === "gold" || rarity === "red" ? 1.4 : 1.08;
  const floatThousandths = Math.min(999, Math.max(0, Math.round(Math.random() ** bias * 1000)));
  const value = floatThousandths / 1000;
  const wear = value < 0.07 ? "FN" : value < 0.15 ? "MW" : value < 0.38 ? "FT" : value < 0.45 ? "WW" : "BS";
  return { floatThousandths, wear };
}

export function upgradeChanceBps(stake: number, target: number) {
  if (stake <= 0 || target <= 0) return 0;
  const raw = (stake / target) * 0.9;
  return Math.max(1, Math.round(Math.min(0.75, raw) * 10000));
}

export function chanceLabel(bps: number) {
  const percent = bps / 100;
  if (percent <= 0) return "Нет ставки";
  if (percent < 25) return "Низкий шанс";
  if (percent < 55) return "Средний шанс";
  return "Высокий шанс";
}

export function rarityRank(rarity: string) {
  return { blue: 1, purple: 2, pink: 3, red: 4, gold: 5 }[rarity] ?? 0;
}

export function isRare(rarity: string) {
  return rarity === "red" || rarity === "gold";
}
