import { markNotificationsRead } from "@/server/actions";
import { handleError } from "@/server/errors";
import { getUserId } from "@/server/session";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const userId = await getUserId();
    if (!userId) return Response.json({ ok: true });
    await markNotificationsRead(userId);
    return Response.json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
