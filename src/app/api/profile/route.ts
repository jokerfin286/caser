import { updateTradeUrl } from "@/server/actions";
import { handleError } from "@/server/errors";
import { getProfile } from "@/server/queries";
import { getUserId } from "@/server/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) return Response.json({ error: "Войдите через Steam" }, { status: 401 });
    const profile = await getProfile(userId);
    if (!profile) return Response.json({ error: "Профиль не найден" }, { status: 404 });
    return Response.json(profile);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return Response.json({ error: "Войдите через Steam" }, { status: 401 });
    const body = (await request.json().catch(() => ({}))) as { tradeUrl?: string };
    return Response.json(await updateTradeUrl(userId, body.tradeUrl ?? ""));
  } catch (error) {
    return handleError(error);
  }
}
