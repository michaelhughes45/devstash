import { describe, expect, it } from "vitest";
import { z } from "zod";

import { updateItemSchema } from "@/lib/validations/items";

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
