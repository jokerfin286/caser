import { listInventory } from "@/server/queries";
import { handleError } from "@/server/errors";
import { getUserId } from "@/server/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) return Response.json({ error: "Войдите через Steam" }, { status: 401 });
    return Response.json(await listInventory(userId));
  } catch (error) {
    return handleError(error);
  }
}
