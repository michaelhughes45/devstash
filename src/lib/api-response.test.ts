import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { jsonResponse, rateLimitedResponse } from "@/lib/api-response";

describe("jsonResponse", () => {
  it("returns the body as JSON with the status", async () => {
    const response = jsonResponse({ success: true, data: { id: "1" } }, 201);

    expect(response.status).toBe(201);
    expect(response.headers.get("Content-Type")).toContain("application/json");
    expect(await response.json()).toEqual({ success: true, data: { id: "1" } });
  });
});

describe("rateLimitedResponse", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-08T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a 429 with the rate-limit message and Retry-After", async () => {
    const response = rateLimitedResponse(Date.now() + 90_000);

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("90");
    expect(await response.json()).toEqual({
      success: false,
      error: "Too many attempts. Please try again in 2 minutes.",
    });
  });
});
