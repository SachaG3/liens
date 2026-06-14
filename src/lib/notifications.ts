import "server-only";

import nodemailer from "nodemailer";
import { z } from "zod";
import { db } from "@/lib/db";

const optionalEmail = z.union([z.literal(""), z.email().trim().toLowerCase().max(320)]);
const optionalUrl = z.union([
  z.literal(""),
  z.url().max(2_000).refine(value => ["http:", "https:"].includes(new URL(value).protocol), "URL HTTP(S) attendue"),
]);
const optionalPhone = z.union([z.literal(""), z.string().trim().regex(/^\+[1-9]\d{6,14}$/)]);
const optionalTopic = z.union([z.literal(""), z.string().trim().min(1).max(200).regex(/^[a-zA-Z0-9_-]+$/)]);

export const notificationPreferenceSchema = z.object({
  emailEnabled: z.boolean(),
  emailAddress: optionalEmail,
  discordEnabled: z.boolean(),
  discordWebhookUrl: optionalUrl.refine(value => !value || isDiscordWebhook(value), "Webhook Discord invalide"),
  signalEnabled: z.boolean(),
  signalRecipient: optionalPhone,
  ntfyEnabled: z.boolean(),
  ntfyTopic: optionalTopic,
}).superRefine((value, context) => {
  const required = (enabled: boolean, field: keyof typeof value, message: string) => {
    if (enabled && !value[field]) context.addIssue({ code: "custom", path: [field], message });
  };
  required(value.emailEnabled, "emailAddress", "Adresse e-mail requise");
  required(value.discordEnabled, "discordWebhookUrl", "Webhook Discord requis");
  required(value.signalEnabled, "signalRecipient", "Numéro Signal destinataire requis");
  required(value.ntfyEnabled, "ntfyTopic", "Sujet ntfy requis");
});

export type NotificationPreferenceInput = z.infer<typeof notificationPreferenceSchema>;
type Channel = "email" | "discord" | "signal" | "ntfy";

type ReminderMessage = {
  title: string;
  body: string;
  url: string;
};

export function configuredChannels(preference: NotificationPreferenceInput): Channel[] {
  return [
    preference.emailEnabled && "email",
    preference.discordEnabled && "discord",
    preference.signalEnabled && "signal",
    preference.ntfyEnabled && "ntfy",
  ].filter((channel): channel is Channel => Boolean(channel));
}

export function reminderMessage(reminder: { title: string; dueAt: Date; contact: { firstName: string; lastName: string } }): ReminderMessage {
  const name = `${reminder.contact.firstName} ${reminder.contact.lastName}`.trim();
  const baseUrl = process.env.APP_URL?.replace(/\/$/, "") ?? "";
  return {
    title: `Rappel Liens : ${reminder.title}`,
    body: `${reminder.title}\nPersonne : ${name}\nÉchéance : ${reminder.dueAt.toLocaleDateString("fr-FR")}`,
    url: baseUrl ? `${baseUrl}/reminders` : "",
  };
}

export async function sendTestNotifications(preference: NotificationPreferenceInput) {
  const message = {
    title: "Test des notifications Liens",
    body: "Votre canal de notification est correctement configuré.",
    url: process.env.APP_URL?.replace(/\/$/, "") ?? "",
  };
  return sendToChannels(preference, message);
}

export async function dispatchDueNotifications(userId?: string) {
  const reminders = await db.reminder.findMany({
    where: {
      done: false,
      dueAt: { lte: new Date() },
      ...(userId ? { contact: { userId } } : {}),
      OR: [{ kind: { not: "contact" } }, { contact: { followUpStatus: "active" } }],
    },
    include: {
      contact: {
        select: {
          firstName: true,
          lastName: true,
          user: { select: { notificationPreference: true } },
        },
      },
      deliveries: true,
    },
    orderBy: { dueAt: "asc" },
    take: 100,
  });

  let sent = 0;
  let failed = 0;
  for (const reminder of reminders) {
    const preference = reminder.contact.user.notificationPreference;
    if (!preference) continue;
    const parsed = notificationPreferenceSchema.safeParse(preference);
    if (!parsed.success) continue;
    const message = reminderMessage(reminder);
    for (const channel of configuredChannels(parsed.data)) {
      if (reminder.deliveries.some(delivery => delivery.channel === channel && delivery.dueAt.getTime() === reminder.dueAt.getTime() && delivery.sentAt)) continue;
      try {
        await sendChannel(channel, parsed.data, message);
        await recordDelivery(reminder.id, channel, reminder.dueAt, new Date(), "");
        sent++;
      } catch (error) {
        await recordDelivery(reminder.id, channel, reminder.dueAt, null, errorMessage(error));
        failed++;
      }
    }
  }
  return { reminders: reminders.length, sent, failed };
}

async function sendToChannels(preference: NotificationPreferenceInput, message: ReminderMessage) {
  const channels = configuredChannels(preference);
  if (!channels.length) return { sent: 0, failed: 0 };
  const results = await Promise.allSettled(channels.map(channel => sendChannel(channel, preference, message)));
  return {
    sent: results.filter(result => result.status === "fulfilled").length,
    failed: results.filter(result => result.status === "rejected").length,
  };
}

async function sendChannel(channel: Channel, preference: NotificationPreferenceInput, message: ReminderMessage) {
  if (channel === "email") return sendEmail(preference.emailAddress, message);
  if (channel === "discord") return postJson(preference.discordWebhookUrl, { content: formatMessage(message) });
  if (channel === "signal") {
    const apiUrl = process.env.SIGNAL_API_URL;
    const sender = process.env.SIGNAL_SENDER;
    if (!apiUrl || !sender) throw new Error("SIGNAL_API_URL et SIGNAL_SENDER sont requis");
    return postJson(`${apiUrl.replace(/\/$/, "")}/v2/send`, {
    message: formatMessage(message),
    number: sender,
    recipients: [preference.signalRecipient],
  });
  }
  const ntfyBaseUrl = process.env.NTFY_BASE_URL?.replace(/\/$/, "") || "https://ntfy.sh";
  return postText(`${ntfyBaseUrl}/${preference.ntfyTopic}`, formatMessage(message), { Title: message.title });
}

async function sendEmail(to: string, message: ReminderMessage) {
  const host = process.env.SMTP_HOST;
  const from = process.env.SMTP_FROM;
  if (!host || !from) throw new Error("SMTP_HOST et SMTP_FROM sont requis");
  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD ?? "" } : undefined,
  });
  await transporter.sendMail({ from, to, subject: message.title, text: formatMessage(message) });
}

async function postJson(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
}

async function postText(url: string, body: string, headers: Record<string, string>) {
  const response = await fetch(url, { method: "POST", headers, body, signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
}

function formatMessage(message: ReminderMessage) {
  return [message.body, message.url].filter(Boolean).join("\n");
}

async function recordDelivery(reminderId: string, channel: Channel, dueAt: Date, sentAt: Date | null, error: string) {
  await db.notificationDelivery.upsert({
    where: { reminderId_channel_dueAt: { reminderId, channel, dueAt } },
    create: { reminderId, channel, dueAt, sentAt, error },
    update: { sentAt, error },
  });
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message.slice(0, 500) : "Erreur inconnue";
}

function isDiscordWebhook(value: string) {
  const url = new URL(value);
  return url.protocol === "https:" && ["discord.com", "discordapp.com"].includes(url.hostname) && url.pathname.startsWith("/api/webhooks/");
}
