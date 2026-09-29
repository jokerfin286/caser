import crypto from "crypto";
import { cookies } from "next/headers";

const SECRET = process.env.SESSION_SECRET || "keiser-demo-session-v1";

function signature(id: string) {
  return crypto.createHmac("sha256", SECRET).update(id).digest("hex").slice(0, 32);
}

export function signSession(id: number) {
  return `${id}.${signature(String(id))}`;
}

export function readSession(raw: string | undefined | null) {
  if (!raw) return null;
  const [id, sig] = raw.split(".");
  if (!id || !sig) return null;
  const expected = signature(id);
  const left = Buffer.from(sig);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return null;
  const numeric = Number(id);
  return Number.isInteger(numeric) && numeric > 0 ? numeric : null;
}

export async function getUserId() {
  const jar = await cookies();
  return readSession(jar.get("keiser_session")?.value);
}

export async function setSession(id: number) {
  const jar = await cookies();
  jar.set("keiser_session", signSession(id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete("keiser_session");
}
