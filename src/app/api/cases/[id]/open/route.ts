import { openCase } from "@/server/actions";
import { handleError } from "@/server/errors";
import { getUserId } from "@/server/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId();
    if (!userId) return Response.json({ error: "Войдите через Steam" }, { status: 401 });
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as { count?: number };
    const result = await openCase(userId, id, Number(body.count) || 1);
    return Response.json(result);
  } catch (error) {
    return handleError(error);
  }
}
