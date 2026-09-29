import { deposit, withdraw } from "@/server/actions";
import { handleError } from "@/server/errors";
import { getUserId } from "@/server/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return Response.json({ error: "Войдите через Steam" }, { status: 401 });
    const body = (await request.json().catch(() => ({}))) as {
      action?: string;
      amount?: number;
      method?: string;
      destination?: string;
    };
    if (body.action === "withdraw") {
      return Response.json(await withdraw(userId, Number(body.amount) || 0, body.method ?? "", body.destination ?? ""));
    }
    return Response.json(await deposit(userId, Number(body.amount) || 0, body.method ?? "card"));
  } catch (error) {
    return handleError(error);
  }
}
