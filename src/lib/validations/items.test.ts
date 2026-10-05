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
  function createErrors(input: unknown) {
    const result = createItemSchema.safeParse(input);
    if (result.success) throw new Error("expected validation to fail");
    return z.flattenError(result.error).fieldErrors;
  }

  it("requires one of the creatable types", () => {
    expect(createErrors({ title: "Hook", tags: [] }).type).toEqual(["Choose an item type"]);
    expect(createErrors({ type: "file", title: "Hook", tags: [] }).type).toEqual([
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
      tags: ["react"],
    });
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
