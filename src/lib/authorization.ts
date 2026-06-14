import "server-only";
import type { PrismaClient } from "@prisma/client";

type AuthorizationDb = Pick<PrismaClient, "contact">;

export async function ownsContact(db: AuthorizationDb, userId: string, contactId: string) {
  if (!contactId) return false;
  return (await db.contact.count({ where: { id: contactId, userId } })) === 1;
}

export async function ownsAllContacts(db: AuthorizationDb, userId: string, contactIds: string[]) {
  const uniqueIds = [...new Set(contactIds.filter(Boolean))];
  if (!uniqueIds.length) return false;
  return (await db.contact.count({ where: { userId, id: { in: uniqueIds } } })) === uniqueIds.length;
}
