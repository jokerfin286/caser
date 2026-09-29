import { redirect } from "next/navigation";
import { buildSteamLoginUrl, requestOrigin } from "@/server/steam";

export const dynamic = "force-dynamic";

export async function GET() {
  const origin = await requestOrigin();
  redirect(buildSteamLoginUrl(origin));
}
