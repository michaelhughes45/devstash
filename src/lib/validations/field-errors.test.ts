import { describe, expect, it } from "vitest";
import { z } from "zod";

import { fieldErrorsOf } from "@/lib/validations/field-errors";

describe("fieldErrorsOf", () => {
  it("returns the messages for each invalid field", () => {
    const schema = z.object({ title: z.string().min(1, "Title is required"), url: z.url("Bad URL") });
    const parsed = schema.safeParse({ title: "", url: "nope" });

    expect(parsed.success).toBe(false);
    expect(fieldErrorsOf(parsed.error!)).toEqual({
      title: ["Title is required"],
      url: ["Bad URL"],
    });
  });
});
