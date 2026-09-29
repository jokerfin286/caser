import { claimReward, redeemCoupon } from "@/server/actions";
import { handleError } from "@/server/errors";
import { getRewards } from "@/server/queries";
import { getUserId } from "@/server/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await getRewards(await getUserId()));
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return Response.json({ error: "Войдите через Steam" }, { status: 401 });
    const body = (await request.json().catch(() => ({}))) as { action?: string; key?: string; code?: string };
    if (body.action === "coupon") return Response.json(await redeemCoupon(userId, body.code ?? ""));
    return Response.json(await claimReward(userId, body.key ?? "daily"));
  } catch (error) {
    return handleError(error);
  }
}
