import { describe, expect, it, vi } from "vitest";
import { ownsAllContacts, ownsContact } from "@/lib/authorization";

describe("contact authorization", () => {
  it("only authorizes a contact owned by the current user", async () => {
    const db = { contact: { count: vi.fn().mockResolvedValue(1) } };
    await expect(ownsContact(db as never, "user-1", "contact-1")).resolves.toBe(true);
    expect(db.contact.count).toHaveBeenCalledWith({ where: { id: "contact-1", userId: "user-1" } });
  });

  it("rejects a mixed group of owned and foreign contacts", async () => {
    const db = { contact: { count: vi.fn().mockResolvedValue(1) } };
    await expect(ownsAllContacts(db as never, "user-1", ["owned", "foreign"])).resolves.toBe(false);
  });
});
