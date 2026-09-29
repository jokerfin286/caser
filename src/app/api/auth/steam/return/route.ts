import { redirect } from "next/navigation";
import { upsertSteamUser } from "@/server/actions";
import { fetchSteamProfile, requestOrigin, verifySteamResponse } from "@/server/steam";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const origin = await requestOrigin();
  const url = new URL(request.url);
  let steamId: string | null = null;
  try {
    steamId = await verifySteamResponse(url.searchParams);
  } catch {
    steamId = null;
  }
  if (!steamId) {
    redirect(`${origin}/login?error=steam`);
  }
  const profile = await fetchSteamProfile(steamId);
  await upsertSteamUser(steamId, profile.nickname, profile.avatarUrl);
  redirect(`${origin}/`);
}
