import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  rateLimitKey,
  rateLimitMessage,
  retryAfterSeconds,
} from "@/lib/rate-limit";

const NOW = new Date("2026-01-01T00:00:00Z").getTime();

describe("rateLimitKey", () => {
  it("uses the first x-forwarded-for IP", () => {
    const headers = new Headers({ "x-forwarded-for": " 1.2.3.4 , 5.6.7.8" });
    expect(rateLimitKey(headers)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip, then unknown", () => {
    expect(rateLimitKey(new Headers({ "x-real-ip": "9.9.9.9" }))).toBe("9.9.9.9");
    expect(rateLimitKey(new Headers())).toBe("unknown");
  });

  it("appends the lowercased email", () => {
    const headers = new Headers({ "x-real-ip": "9.9.9.9" });
    expect(rateLimitKey(headers, "Demo@DevStash.io")).toBe("9.9.9.9:demo@devstash.io");
  });
});

describe("retry timing", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("rounds the retry delay up to whole seconds, at least 1", () => {
    expect(retryAfterSeconds(NOW + 1500)).toBe(2);
    expect(retryAfterSeconds(NOW - 5000)).toBe(1);
  });

  it("formats the message in minutes", () => {
    expect(rateLimitMessage(NOW + 30_000)).toBe(
      "Too many attempts. Please try again in 1 minute.",
    );
    expect(rateLimitMessage(NOW + 14 * 60_000 + 1)).toBe(
      "Too many attempts. Please try again in 15 minutes.",
    );
  });
});

describe("checkRateLimit", () => {
  it("fails open when Upstash isn't configured", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.resetModules();
    const { checkRateLimit } = await import("@/lib/rate-limit");

    await expect(checkRateLimit("signIn", "1.2.3.4")).resolves.toMatchObject({
      success: true,
    });
  });
});
