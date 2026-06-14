import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  reminderFindMany: vi.fn(),
  deliveryUpsert: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    reminder: { findMany: mocks.reminderFindMany },
    notificationDelivery: { upsert: mocks.deliveryUpsert },
  },
}));

vi.mock("nodemailer", () => ({ default: { createTransport: vi.fn() } }));

import { dispatchDueNotifications } from "@/lib/notifications";

const dueAt = new Date("2026-06-14T08:00:00Z");
const preference = {
  emailEnabled: false,
  emailAddress: "",
  discordEnabled: true,
  discordWebhookUrl: "https://discord.com/api/webhooks/123/secret",
  signalEnabled: false,
  signalRecipient: "",
  ntfyEnabled: false,
  ntfyTopic: "",
};

describe("notification dispatch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
  });

  it("n’envoie pas deux fois le même canal pour la même échéance", async () => {
    mocks.reminderFindMany.mockResolvedValue([reminder([{ channel: "discord", dueAt, sentAt: new Date() }])]);
    await expect(dispatchDueNotifications("user-1")).resolves.toMatchObject({ sent: 0, failed: 0 });
    expect(fetch).not.toHaveBeenCalled();
    expect(mocks.deliveryUpsert).not.toHaveBeenCalled();
  });

  it("historise un envoi réussi", async () => {
    mocks.reminderFindMany.mockResolvedValue([reminder([])]);
    await expect(dispatchDueNotifications("user-1")).resolves.toMatchObject({ sent: 1, failed: 0 });
    expect(fetch).toHaveBeenCalledOnce();
    expect(mocks.deliveryUpsert).toHaveBeenCalledOnce();
  });
});

function reminder(deliveries: Array<{ channel: string; dueAt: Date; sentAt: Date | null }>) {
  return {
    id: "reminder-1",
    title: "Prendre des nouvelles",
    dueAt,
    contact: {
      firstName: "Camille",
      lastName: "Durand",
      user: { notificationPreference: preference },
    },
    deliveries,
  };
}
