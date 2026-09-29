import { loginSteam } from "@/server/actions";
import { handleError } from "@/server/errors";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { nickname?: string };
    const user = await loginSteam(body.nickname);
    return Response.json({ user });
  } catch (error) {
    return handleError(error);
  }
}
