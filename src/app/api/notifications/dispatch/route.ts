import { timingSafeEqual } from "node:crypto";
import { dispatchDueNotifications } from "@/lib/notifications";

export async function POST(request: Request) {
  const secret = process.env.NOTIFICATION_CRON_SECRET;
  if (!secret) return Response.json({ error: "Notifications planifiées non configurées" }, { status: 503 });
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!sameSecret(secret, provided)) return Response.json({ error: "Non autorisé" }, { status: 401 });
  return Response.json(await dispatchDueNotifications());
}

function sameSecret(expected: string, provided: string) {
  const left = Buffer.from(expected);
  const right = Buffer.from(provided);
  return left.length === right.length && timingSafeEqual(left, right);
}
