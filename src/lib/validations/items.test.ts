import { describe, expect, it } from "vitest";
import { z } from "zod";

import { createItemSchema, itemIdSchema, updateItemSchema } from "@/lib/validations/items";

function fieldErrors(input: unknown) {
  const result = updateItemSchema.safeParse(input);
  if (result.success) throw new Error("expected validation to fail");
  return z.flattenError(result.error).fieldErrors;
}

describe("updateItemSchema", () => {
  it("trims the title and requires it", () => {
    expect(updateItemSchema.parse({ title: "  Hook  ", tags: [] }).title).toBe("Hook");
    expect(fieldErrors({ title: "   ", tags: [] }).title).toEqual(["Title is required"]);
    expect(fieldErrors({ tags: [] }).title).toEqual(["Title is required"]);
  });

  it("turns blank optional text into null and leaves missing fields undefined", () => {
    const data = updateItemSchema.parse({
      title: "Hook",
      description: "   ",
      language: "",
      url: " ",
      content: "\n  \n",
      tags: [],
    });

    expect(data).toEqual({
      title: "Hook",
      description: null,
      language: null,
      url: null,
      content: null,
      tags: [],
    });
    expect(updateItemSchema.parse({ title: "Hook", tags: [] })).toEqual({
      title: "Hook",
      tags: [],
    });
  });

  it("keeps content whitespace so code indentation survives", () => {
    const content = "  if (x) {\n    run();\n  }\n";
    expect(updateItemSchema.parse({ title: "Hook", content, tags: [] }).content).toBe(
      content,
    );
  });

  it("accepts null for nullable fields", () => {
    const data = updateItemSchema.parse({
      title: "Hook",
      description: null,
      content: null,
      language: null,
      url: null,
      tags: [],
    });
    expect(data.description).toBeNull();
    expect(data.url).toBeNull();
  });

  it("only accepts http and https URLs", () => {
    expect(
      updateItemSchema.parse({ title: "Docs", url: " https://nextjs.org/docs ", tags: [] })
        .url,
    ).toBe("https://nextjs.org/docs");
    expect(fieldErrors({ title: "Docs", url: "not a url", tags: [] }).url).toEqual([
      "Enter a valid http or https URL",
    ]);
    expect(
      fieldErrors({ title: "Docs", url: "javascript:alert(1)", tags: [] }).url,
    ).toBeDefined();
  });

  it("trims tags, removes repeats and rejects empty ones", () => {
    expect(
      updateItemSchema.parse({ title: "Hook", tags: [" react ", "hooks", "react"] }).tags,
    ).toEqual(["react", "hooks"]);
    expect(fieldErrors({ title: "Hook", tags: ["react", "  "] }).tags).toEqual([
      "Tags can't be empty",
    ]);
    expect(fieldErrors({ title: "Hook" }).tags).toBeDefined();
  });
});

describe("createItemSchema", () => {
  function createErrors(input: unknown): Record<string, string[] | undefined> {
    const result = createItemSchema.safeParse(input);
    if (result.success) throw new Error("expected validation to fail");
    return z.flattenError(result.error).fieldErrors;
  }

  it("requires one of the creatable types", () => {
    expect(createErrors({ title: "Hook", tags: [] }).type).toEqual(["Choose an item type"]);
    expect(createErrors({ type: "folder", title: "Hook", tags: [] }).type).toEqual([
      "Choose an item type",
    ]);
  });

  it("applies the shared field rules", () => {
    const errors = createErrors({ type: "note", title: " ", tags: ["  "] });
    expect(errors.title).toEqual(["Title is required"]);
    expect(errors.tags).toEqual(["Tags can't be empty"]);
  });

  it("parses a snippet with content and language, nulling blank fields", () => {
    expect(
      createItemSchema.parse({
        type: "snippet",
        title: " useAuth ",
        description: "",
        content: "  return 1;\n",
        language: " typescript ",
        tags: ["react", "react"],
      }),
    ).toEqual({
      type: "snippet",
      title: "useAuth",
      description: null,
      content: "  return 1;\n",
      language: "typescript",
      url: null,
      fileKey: null,
      tags: ["react"],
      collectionIds: [],
    });
  });

  it("keeps chosen collections without repeats", () => {
    expect(
      createItemSchema.parse({
        type: "note",
        title: "Notes",
        tags: [],
        collectionIds: ["col-1", "col-2", "col-1"],
      }).collectionIds,
    ).toEqual(["col-1", "col-2"]);
  });

  it("requires an upload for file and image items", () => {
    expect(createErrors({ type: "file", title: "Spec", tags: [] }).file).toEqual([
      "Choose a file to upload",
    ]);
    expect(createErrors({ type: "image", title: "Logo", fileKey: " ", tags: [] }).file).toEqual([
      "Choose a file to upload",
    ]);
  });

  it("keeps the upload key only for file and image items", () => {
    const fileKey = "user1/0f8fad5b-d9cb-469f-a165-70867728950e.png";
    expect(
      createItemSchema.parse({ type: "image", title: "Logo", content: "stray", fileKey, tags: [] }),
    ).toMatchObject({ fileKey, content: null, language: null, url: null });
    expect(
      createItemSchema.parse({ type: "note", title: "Note", fileKey, tags: [] }),
    ).toMatchObject({ fileKey: null });
  });

  it("requires a valid URL for links", () => {
    expect(createErrors({ type: "link", title: "Docs", tags: [] }).url).toEqual([
      "URL is required",
    ]);
    expect(createErrors({ type: "link", title: "Docs", url: " ", tags: [] }).url).toEqual([
      "URL is required",
    ]);
    expect(
      createErrors({ type: "link", title: "Docs", url: "javascript:alert(1)", tags: [] }).url,
    ).toEqual(["Enter a valid http or https URL"]);
  });

  it("drops fields the type doesn't use", () => {
    expect(
      createItemSchema.parse({
        type: "link",
        title: "Docs",
        url: "https://nextjs.org/docs",
        content: "stray",
        language: "ts",
        tags: [],
      }),
    ).toMatchObject({ url: "https://nextjs.org/docs", content: null, language: null });

    expect(
      createItemSchema.parse({
        type: "prompt",
        title: "Review",
        content: "Review this code",
        language: "ts",
        url: "https://example.com",
        tags: [],
      }),
    ).toMatchObject({ content: "Review this code", language: null, url: null });
  });
});

describe("collectionIds", () => {
  it("is left undefined when missing, so an update keeps the item's collections", () => {
    expect(updateItemSchema.parse({ title: "Hook", tags: [] }).collectionIds).toBeUndefined();
  });

  it("removes repeats and accepts an empty list", () => {
    expect(
      updateItemSchema.parse({ title: "Hook", tags: [], collectionIds: ["a", "b", "a"] })
        .collectionIds,
    ).toEqual(["a", "b"]);
    expect(
      updateItemSchema.parse({ title: "Hook", tags: [], collectionIds: [] }).collectionIds,
    ).toEqual([]);
  });

  it("rejects invalid ids and too many collections", () => {
    expect(
      updateItemSchema.safeParse({ title: "Hook", tags: [], collectionIds: [""] }).success,
    ).toBe(false);
    expect(
      updateItemSchema.safeParse({ title: "Hook", tags: [], collectionIds: "col-1" }).success,
    ).toBe(false);
    const tooMany = Array.from({ length: 101 }, (_, index) => `col-${index}`);
    expect(fieldErrors({ title: "Hook", tags: [], collectionIds: tooMany }).collectionIds).toEqual([
      "Choose at most 100 collections",
    ]);
  });
});

describe("itemIdSchema", () => {
  it("accepts a cuid-style id", () => {
    expect(itemIdSchema.safeParse("cmuo7njrf000178scxnxjhms3").success).toBe(true);
  });

  it("rejects empty, overly long and non-string ids", () => {
    expect(itemIdSchema.safeParse("").success).toBe(false);
    expect(itemIdSchema.safeParse("a".repeat(65)).success).toBe(false);
    expect(itemIdSchema.safeParse(null).success).toBe(false);
  });
});
