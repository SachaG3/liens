import { describe, expect, it } from "vitest";
import { configuredChannels, notificationPreferenceSchema, reminderMessage } from "@/lib/notifications";

const preference = {
  emailEnabled: true,
  emailAddress: "test@example.com",
  discordEnabled: false,
  discordWebhookUrl: "",
  signalEnabled: false,
  signalRecipient: "",
  ntfyEnabled: true,
  ntfyTopic: "liens-test-secret",
};

describe("notifications", () => {
  it("valide et liste uniquement les canaux actifs", () => {
    const parsed = notificationPreferenceSchema.parse(preference);
    expect(configuredChannels(parsed)).toEqual(["email", "ntfy"]);
  });

  it("refuse un canal actif incomplet", () => {
    expect(notificationPreferenceSchema.safeParse({ ...preference, discordEnabled: true }).success).toBe(false);
  });

  it("ne place aucune note privée dans le message", () => {
    const message = reminderMessage({
      title: "Prendre des nouvelles",
      dueAt: new Date("2026-06-14T00:00:00Z"),
      contact: { firstName: "Camille", lastName: "Durand" },
    });
    expect(message.body).toContain("Camille Durand");
    expect(message.body).toContain("Prendre des nouvelles");
  });
});
