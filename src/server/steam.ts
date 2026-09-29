import { headers } from "next/headers";

export async function requestOrigin() {
  const list = await headers();
  const host = list.get("x-forwarded-host") ?? list.get("host") ?? "localhost:3000";
  const proto = list.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto.split(",")[0]}://${host.split(",")[0]}`;
}

export function buildSteamLoginUrl(origin: string) {
  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": `${origin}/api/auth/steam/return`,
    "openid.realm": origin,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });
  return `https://steamcommunity.com/openid/login?${params.toString()}`;
}

export async function verifySteamResponse(searchParams: URLSearchParams) {
  if (searchParams.get("openid.mode") !== "id_res") return null;
  const body = new URLSearchParams();
  searchParams.forEach((value, key) => {
    if (key.startsWith("openid.")) body.set(key, value);
  });
  body.set("openid.mode", "check_authentication");
  const response = await fetch("https://steamcommunity.com/openid/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
  });
  const text = await response.text();
  if (!text.includes("is_valid:true")) return null;
  const claimed = searchParams.get("openid.claimed_id") ?? "";
  const match = claimed.match(/\/openid\/id\/(\d{10,25})/);
  return match ? match[1] : null;
}

export async function fetchSteamProfile(steamId: string) {
  const key = process.env.STEAM_API_KEY;
  if (!key) return { nickname: null as string | null, avatarUrl: null as string | null };
  try {
    const response = await fetch(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${key}&steamids=${steamId}`,
      { cache: "no-store" },
    );
    const data = (await response.json()) as {
      response?: { players?: { personaname?: string; avatarfull?: string }[] };
    };
    const player = data.response?.players?.[0];
    return { nickname: player?.personaname ?? null, avatarUrl: player?.avatarfull ?? null };
  } catch {
    return { nickname: null, avatarUrl: null };
  }
}
