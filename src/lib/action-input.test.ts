import { describe, expect, it } from "vitest";
import { formDate, formEmail, formPositiveInteger, formPositiveNumber, parseImportedContacts, parseJsonArray } from "@/lib/action-input";

describe("server action input validation", () => {
  it("normalizes valid values", () => {
    const form = new FormData();
    form.set("email", " Test@Example.com ");
    form.set("frequency", "14");
    form.set("amount", "12,50");
    form.set("date", "2026-06-14");

    expect(formEmail(form, "email")).toMatchObject({ success: true, data: "test@example.com" });
    expect(formPositiveInteger(form, "frequency", 30)).toBe(14);
    expect(formPositiveNumber(form, "amount")).toMatchObject({ success: true, data: 12.5 });
    expect(formDate(form, "date").success).toBe(true);
  });

  it("rejects malformed values without throwing", () => {
    const form = new FormData();
    form.set("email", "invalid");
    form.set("amount", "NaN");
    form.set("date", "not-a-date");

    expect(formEmail(form, "email").success).toBe(false);
    expect(formPositiveNumber(form, "amount").success).toBe(false);
    expect(formDate(form, "date").success).toBe(false);
    expect(parseJsonArray("{broken")).toBeNull();
    expect(parseJsonArray(JSON.stringify(Array.from({ length: 3 })), 2)).toBeNull();
    expect(parseImportedContacts(JSON.stringify([{ firstName: 123 }]))).toBeNull();
  });
});
