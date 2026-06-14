import "server-only";
import { headers } from "next/headers";

type Entry = { count: number; resetAt: number };
const entries = new Map<string, Entry>();

export function consumeRateLimit(key: string, limit: number, windowMs: number, now = Date.now()) {
  const current = entries.get(key);
  if (!current || current.resetAt <= now) {
    entries.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

export async function rateLimitRequest(scope: string, limit: number, windowMs: number) {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwarded || requestHeaders.get("x-real-ip") || "local";
  return consumeRateLimit(`${scope}:${address}`, limit, windowMs);
}

export function resetRateLimits() {
  entries.clear();
}
