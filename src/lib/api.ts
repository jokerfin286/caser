export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || "Ошибка запроса");
  }
  return data;
}

export function publishUser(user: unknown) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("keiser:user", { detail: user }));
}

export function toast(text: string, tone: "ok" | "bad" | "info" = "info") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("keiser:toast", {
      detail: { text, tone, id: Date.now() + Math.random() },
    }),
  );
}
