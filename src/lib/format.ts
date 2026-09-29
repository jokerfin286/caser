export function formatMoney(cents: number) {
  const value = (cents / 100).toLocaleString("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${value} ₽`;
}

export function formatFloat(thousandths: number) {
  return (thousandths / 1000).toFixed(3);
}

export function timeAgo(iso: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 5) return "только что";
  if (seconds < 60) return `${seconds} с назад`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} мин назад`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} ч назад`;
  return `${Math.floor(seconds / 86400)} д назад`;
}

export function moscowDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Moscow" }).format(date);
}

export function rubleToCents(rubles: number) {
  if (!Number.isFinite(rubles)) return 0;
  return Math.round(rubles * 100);
}

export function splitSkinName(name: string) {
  const [weapon, finish] = name.split(" | ");
  return { weapon: weapon ?? name, finish: finish ?? "" };
}

export const METHOD_LABELS: Record<string, string> = {
  card: "Банковская карта",
  sbp: "СБП",
  yookassa: "ЮKassa",
  crypto: "Крипто",
  steam: "Steam",
};

export function dailyAmount(streak: number) {
  return Math.min(25000, 5000 + Math.max(0, streak - 1) * 1500);
}
