import { sellItems } from "@/server/actions";
import { handleError } from "@/server/errors";
import { getUserId } from "@/server/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return Response.json({ error: "Войдите через Steam" }, { status: 401 });
    const body = (await request.json().catch(() => ({}))) as { ids?: number[] };
    return Response.json(await sellItems(userId, body.ids ?? []));
  } catch (error) {
    return handleError(error);
  }
}
