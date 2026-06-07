import { db } from "@/lib/db";

function normalize(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

function hasMention(content: string, alias: string) {
  const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`@${escaped}(?=$|[\\s,.;:!?\\)])`, "i").test(content);
}

export async function createMentionLinks(userId: string, sourceContactId: string, content: string) {
  if (!content.includes("@")) return;
  const contacts = await db.contact.findMany({ where: { userId }, select: { id: true, firstName: true, lastName: true } });
  const normalizedContent = normalize(content);
  const mentioned = contacts.filter(contact => {
    if (contact.id === sourceContactId) return false;
    const fullName = normalize(`${contact.firstName} ${contact.lastName}`.trim());
    const firstName = normalize(contact.firstName);
    return hasMention(normalizedContent, fullName) || hasMention(normalizedContent, firstName);
  });
  for (const contact of mentioned) {
    const [fromContactId, toContactId] = [sourceContactId, contact.id].sort();
    await db.contactLink.upsert({
      where: { fromContactId_toContactId: { fromContactId, toContactId } },
      create: { fromContactId, toContactId },
      update: {},
    });
  }
}
