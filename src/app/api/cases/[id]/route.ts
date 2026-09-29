import { getCaseDetail } from "@/server/queries";
import { handleError } from "@/server/errors";
import { getUserId } from "@/server/session";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const detail = await getCaseDetail(id, await getUserId());
    if (!detail) return Response.json({ error: "Кейс не найден" }, { status: 404 });
    return Response.json(detail);
  } catch (error) {
    return handleError(error);
  }
}
