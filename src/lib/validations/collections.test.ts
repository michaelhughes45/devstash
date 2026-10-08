import { describe, expect, it } from "vitest";

import { createCollectionSchema } from "@/lib/validations/collections";

describe("createCollectionSchema", () => {
  it("trims the name and description", () => {
    expect(
      createCollectionSchema.parse({ name: "  React Patterns ", description: " Hooks " }),
    ).toEqual({ name: "React Patterns", description: "Hooks" });
  });

  it("saves a blank, null or missing description as null", () => {
    expect(createCollectionSchema.parse({ name: "A", description: "   " }).description).toBeNull();
    expect(createCollectionSchema.parse({ name: "A", description: null }).description).toBeNull();
    expect(createCollectionSchema.parse({ name: "A" }).description).toBeNull();
  });

  it("requires a name", () => {
    for (const input of [{ name: "   " }, {}]) {
      const result = createCollectionSchema.safeParse(input);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe("Name is required");
    }
  });

  it("limits the name and description length", () => {
    expect(createCollectionSchema.safeParse({ name: "a".repeat(101) }).success).toBe(false);
    expect(
      createCollectionSchema.safeParse({ name: "A", description: "a".repeat(501) }).success,
    ).toBe(false);
  });
});
