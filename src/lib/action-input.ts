import { z } from "zod";

const textSchema = z.string().trim().max(20_000);
const idSchema = z.string().trim().min(1).max(200);
const emailSchema = z.email().trim().toLowerCase().max(320);
const positiveIntegerSchema = z.coerce.number().int().positive();
const positiveNumberSchema = z.coerce.number().positive().finite();

export function formText(form: FormData, key: string) {
  return textSchema.catch("").parse(String(form.get(key) ?? ""));
}

export function formId(form: FormData, key: string) {
  return idSchema.safeParse(formText(form, key));
}

export function formEmail(form: FormData, key: string) {
  return emailSchema.safeParse(formText(form, key));
}

export function formPositiveInteger(form: FormData, key: string, fallback: number) {
  const result = positiveIntegerSchema.safeParse(formText(form, key));
  return result.success ? result.data : fallback;
}

export function formPositiveNumber(form: FormData, key: string) {
  return positiveNumberSchema.safeParse(formText(form, key).replace(",", "."));
}

export function formDate(form: FormData, key: string) {
  const value = formText(form, key);
  if (!value) return { success: true, data: null } as const;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ({ success: false } as const)
    : ({ success: true, data: date } as const);
}

export function parseJsonArray(value: string, maximumItems = 5_000) {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) && parsed.length <= maximumItems ? parsed : null;
  } catch {
    return null;
  }
}

const importContactSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phone: z.string(),
  company: z.string(),
  birthday: z.string(),
  notes: z.string(),
  sourceId: z.string(),
  fileName: z.string(),
  choice: z.object({
    selected: z.boolean(),
    action: z.enum(["create", "merge", "skip"]),
    targetId: z.string().optional(),
    circleIds: z.array(z.string()).max(100),
    relationTags: z.array(z.string()).max(100),
  }).optional(),
});

export type ImportedContactInput = z.infer<typeof importContactSchema>;

export function parseImportedContacts(value: string) {
  const parsed = parseJsonArray(value);
  if (!parsed) return null;
  const result = z.array(importContactSchema).max(5_000).safeParse(parsed);
  return result.success ? result.data : null;
}
