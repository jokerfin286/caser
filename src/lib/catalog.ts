import rawData from "./cs2-data.json";

export type Rarity = "blue" | "purple" | "pink" | "red" | "gold";

export type SkinDef = {
  id: string;
  name: string;
  rarity: Rarity;
  price: number;
  image: string;
  chance: number;
};

export type CaseDef = {
  id: string;
  name: string;
  price: number;
  image: string;
  label: string | null;
  tagline: string;
  story: string;
  category: string;
  accent: string;
  timerHours: number | null;
  sortOrder: number;
  skins: SkinDef[];
};

export const CASES = rawData as CaseDef[];

export const RARITY_META: Record<Rarity, { label: string; color: string; rank: number }> = {
  blue: { label: "Армейское", color: "#5b8cff", rank: 1 },
  purple: { label: "Запрещённое", color: "#a855f7", rank: 2 },
  pink: { label: "Засекреченное", color: "#e255e2", rank: 3 },
  red: { label: "Тайное", color: "#ef4b4b", rank: 4 },
  gold: { label: "Контрабанда", color: "#f0b429", rank: 5 },
};

export const WEAR_META: Record<string, string> = {
  FN: "Прямо с завода",
  MW: "Немного поношенное",
  FT: "После полевых испытаний",
  WW: "Поношенное",
  BS: "Закалённое в боях",
};
