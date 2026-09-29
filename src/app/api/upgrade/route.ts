import { doUpgrade } from "@/server/actions";
import { handleError } from "@/server/errors";
import { listInventory, listSkins } from "@/server/queries";
import { getUserId } from "@/server/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await getUserId();
    const skins = await listSkins();
    const inventory = userId ? await listInventory(userId) : { items: [], sold: [], upgrades: [], opens: [] };
    return Response.json({ skins, items: inventory.items });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return Response.json({ error: "Войдите через Steam" }, { status: 401 });
    const body = (await request.json().catch(() => ({}))) as {
      itemIds?: number[];
      balanceStake?: number;
      targetSkinId?: string;
    };
    if (!body.targetSkinId) return Response.json({ error: "Выберите предмет для апгрейда" }, { status: 400 });
    return Response.json(await doUpgrade(userId, body.itemIds ?? [], Number(body.balanceStake) || 0, body.targetSkinId));
  } catch (error) {
    return handleError(error);
  }
}
