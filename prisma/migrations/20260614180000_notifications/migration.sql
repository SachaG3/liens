-- CreateTable
CREATE TABLE "NotificationPreference" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "emailAddress" TEXT NOT NULL DEFAULT '',
    "discordEnabled" BOOLEAN NOT NULL DEFAULT false,
    "discordWebhookUrl" TEXT NOT NULL DEFAULT '',
    "signalEnabled" BOOLEAN NOT NULL DEFAULT false,
    "signalRecipient" TEXT NOT NULL DEFAULT '',
    "ntfyEnabled" BOOLEAN NOT NULL DEFAULT false,
    "ntfyTopic" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotificationDelivery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reminderId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "dueAt" DATETIME NOT NULL,
    "sentAt" DATETIME,
    "error" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NotificationDelivery_reminderId_fkey" FOREIGN KEY ("reminderId") REFERENCES "Reminder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationDelivery_reminderId_channel_dueAt_key" ON "NotificationDelivery"("reminderId", "channel", "dueAt");
