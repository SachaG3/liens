import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  preferenceUpsert: vi.fn(),
  requireUser: vi.fn().mockResolvedValue({ id: "user-1" }),
}));

vi.mock("@/lib/db", () => ({ db: { notificationPreference: { upsert: mocks.preferenceUpsert } } }));
vi.mock("@/lib/auth", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/lib/rate-limit", () => ({ rateLimitRequest: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import { updateNotificationPreference } from "@/app/actions/notification-actions";

describe("notification actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("refuse un webhook Discord arbitraire", async () => {
    const form = new FormData();
    form.set("discordEnabled", "on");
    form.set("discordWebhookUrl", "https://example.com/webhook");
    await expect(updateNotificationPreference(form)).resolves.toBe(false);
    expect(mocks.preferenceUpsert).not.toHaveBeenCalled();
  });

  it("enregistre les préférences uniquement pour l’utilisateur connecté", async () => {
    const form = new FormData();
    form.set("ntfyEnabled", "on");
    form.set("ntfyTopic", "sujet-prive");
    await expect(updateNotificationPreference(form)).resolves.toBe(true);
    expect(mocks.preferenceUpsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: "user-1" },
      create: expect.objectContaining({ userId: "user-1", ntfyEnabled: true, ntfyTopic: "sujet-prive" }),
    }));
  });
});
