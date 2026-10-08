import { describe, expect, it, vi } from "vitest";

import { createCollection } from "@/lib/db/collections";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({ prisma: { collection: { create: vi.fn() } } }));

describe("createCollection", () => {
  it("creates the collection for the given user", async () => {
    const created = {
      id: "col-1",
      name: "React Patterns",
      description: null,
      createdAt: new Date("2026-10-08T10:00:00Z"),
    };
    vi.mocked(prisma.collection.create).mockResolvedValue(created as never);

    const result = await createCollection("user-1", { name: "React Patterns", description: null });

    expect(result).toEqual(created);
    expect(prisma.collection.create).toHaveBeenCalledWith({
      data: { userId: "user-1", name: "React Patterns", description: null },
      select: { id: true, name: true, description: true, createdAt: true },
    });
  });
});
