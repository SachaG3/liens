import { beforeEach, describe, expect, it } from "vitest";
import { consumeRateLimit, resetRateLimits } from "@/lib/rate-limit";

describe("rate limiting", () => {
  beforeEach(resetRateLimits);

  it("blocks requests over the limit and resets after the window", () => {
    expect(consumeRateLimit("login:ip", 2, 1_000, 0)).toBe(true);
    expect(consumeRateLimit("login:ip", 2, 1_000, 1)).toBe(true);
    expect(consumeRateLimit("login:ip", 2, 1_000, 2)).toBe(false);
    expect(consumeRateLimit("login:ip", 2, 1_000, 1_001)).toBe(true);
  });
});
