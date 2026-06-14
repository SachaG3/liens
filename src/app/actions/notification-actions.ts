"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formText } from "@/lib/action-input";
import { dispatchDueNotifications, notificationPreferenceSchema, sendTestNotifications } from "@/lib/notifications";
import { rateLimitRequest } from "@/lib/rate-limit";

export async function updateNotificationPreference(form: FormData) {
  const user = await requireUser();
  const result = notificationPreferenceSchema.safeParse({
    emailEnabled: form.get("emailEnabled") === "on",
    emailAddress: formText(form, "emailAddress"),
    discordEnabled: form.get("discordEnabled") === "on",
    discordWebhookUrl: formText(form, "discordWebhookUrl"),
    signalEnabled: form.get("signalEnabled") === "on",
    signalRecipient: formText(form, "signalRecipient"),
    ntfyEnabled: form.get("ntfyEnabled") === "on",
    ntfyTopic: formText(form, "ntfyTopic"),
  });
  if (!result.success) return false;
  await db.notificationPreference.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...result.data },
    update: result.data,
  });
  revalidatePath("/account");
  return true;
}

export async function testNotifications() {
  const user = await requireUser();
  if (!(await rateLimitRequest("test-notifications", 5, 15 * 60_000))) redirect("/account?notificationTest=rate-limit");
  const preference = await db.notificationPreference.findUnique({ where: { userId: user.id } });
  const parsed = notificationPreferenceSchema.safeParse(preference);
  if (!parsed.success) redirect("/account?notificationTest=invalid");
  const result = await sendTestNotifications(parsed.data);
  redirect(`/account?notificationTest=${result.sent > 0 && result.failed === 0 ? "success" : "failed"}`);
}

export async function dispatchMyNotifications() {
  const user = await requireUser();
  if (!(await rateLimitRequest("dispatch-notifications", 5, 15 * 60_000))) redirect("/reminders?notifications=rate-limit");
  const result = await dispatchDueNotifications(user.id);
  redirect(`/reminders?notifications=${result.failed ? "partial" : "success"}&sent=${result.sent}`);
}
