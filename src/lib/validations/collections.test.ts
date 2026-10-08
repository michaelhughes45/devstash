import { describe, expect, it } from "vitest";

import {
  collectionIdSchema,
  createCollectionSchema,
  updateCollectionSchema,
} from "@/lib/validations/collections";

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

describe("updateCollectionSchema", () => {
  it("uses the create rules", () => {
    expect(updateCollectionSchema.parse({ name: " DevOps ", description: " " })).toEqual({
      name: "DevOps",
      description: null,
    });
    expect(updateCollectionSchema.safeParse({ name: "" }).success).toBe(false);
  });
});

describe("collectionIdSchema", () => {
  it("accepts ids of 1 to 64 characters", () => {
    expect(collectionIdSchema.safeParse("col-1").success).toBe(true);
    expect(collectionIdSchema.safeParse("").success).toBe(false);
    expect(collectionIdSchema.safeParse("a".repeat(65)).success).toBe(false);
  });
});
