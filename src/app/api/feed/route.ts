import { tickFeed } from "@/server/queries";
import { handleError } from "@/server/errors";
import { getUserId } from "@/server/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await tickFeed(await getUserId()));
  } catch (error) {
    return handleError(error);
  }
}
