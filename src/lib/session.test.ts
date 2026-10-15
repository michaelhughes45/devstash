import { describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { getCurrentUser } from "@/lib/session";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

const mockSession = (session: unknown) => vi.mocked(auth).mockResolvedValue(session as never);

describe("getCurrentUser", () => {
  it("returns the user's id and Pro status", async () => {
    mockSession({ user: { id: "user-1", isPro: true } });

    expect(await getCurrentUser()).toEqual({ id: "user-1", isPro: true });
  });

  it("defaults isPro to false when the session doesn't have it", async () => {
    mockSession({ user: { id: "user-1" } });

    expect(await getCurrentUser()).toEqual({ id: "user-1", isPro: false });
  });

  it("returns null when signed out", async () => {
    mockSession(null);

    expect(await getCurrentUser()).toBeNull();
  });
});
