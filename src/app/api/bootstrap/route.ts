import { getBootstrap } from "@/server/queries";
import { handleError } from "@/server/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await getBootstrap());
  } catch (error) {
    return handleError(error);
  }
}
