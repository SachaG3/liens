import { randomBytes, createHash } from "crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

const COOKIE = "liens_session";

async function shouldUseSecureCookie() {
  const setting = process.env.SESSION_COOKIE_SECURE?.toLowerCase() ?? "auto";
  if (setting === "true") return true;
  if (setting === "false") return false;

  const requestHeaders = await headers();
  const forwardedProtocol = requestHeaders.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (forwardedProtocol) return forwardedProtocol === "https";
  return requestHeaders.get("origin")?.startsWith("https://") ?? false;
}

export async function createSession(userId: string) {
  const raw = randomBytes(32).toString("hex");
  const token = createHash("sha256").update(raw).digest("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await db.session.create({ data: { userId, token, expiresAt } });
  (await cookies()).set(COOKIE, raw, {
    httpOnly: true, sameSite: "lax", secure: await shouldUseSecureCookie(),
    expires: expiresAt, path: "/",
  });
}

export async function getUser() {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const token = createHash("sha256").update(raw).digest("hex");
  const session = await db.session.findUnique({ where: { token }, include: { user: true } });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export async function clearSession() {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (raw) {
    const token = createHash("sha256").update(raw).digest("hex");
    await db.session.deleteMany({ where: { token } });
  }
  (await cookies()).delete(COOKIE);
}
