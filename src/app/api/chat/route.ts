import { sendChat } from "@/server/actions";
import { handleError } from "@/server/errors";
import { getChat } from "@/server/queries";
import { getUserId } from "@/server/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) return Response.json({ messages: [] });
    return Response.json({ messages: await getChat(userId) });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return Response.json({ error: "Войдите через Steam" }, { status: 401 });
    const body = (await request.json().catch(() => ({}))) as { body?: string };
    await sendChat(userId, body.body ?? "");
    return Response.json({ messages: await getChat(userId) });
  } catch (error) {
    return handleError(error);
  }
}
