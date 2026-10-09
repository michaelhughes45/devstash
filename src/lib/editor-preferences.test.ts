import { describe, expect, it } from "vitest";

import {
  DEFAULT_EDITOR_PREFERENCES,
  editorLineHeight,
  editorPreferencesSchema,
  parseEditorPreferences,
} from "@/lib/editor-preferences";

const custom = {
  fontSize: 16,
  tabSize: 4,
  wordWrap: false,
  minimap: true,
  theme: "monokai",
} as const;

describe("editorPreferencesSchema", () => {
  it("accepts a full set of valid preferences", () => {
    expect(editorPreferencesSchema.parse(custom)).toEqual(custom);
  });

  it.each([
    ["a font size not offered", { fontSize: 17 }],
    ["a tab size not offered", { tabSize: 3 }],
    ["an unknown theme", { theme: "solarized" }],
    ["a non-boolean toggle", { wordWrap: "yes" }],
  ])("rejects %s", (_, override) => {
    expect(editorPreferencesSchema.safeParse({ ...custom, ...override }).success).toBe(false);
  });

  it("rejects a partial set", () => {
    expect(editorPreferencesSchema.safeParse({ fontSize: 14 }).success).toBe(false);
  });
});

describe("parseEditorPreferences", () => {
  it.each([null, undefined, "vs-dark", 42, []])("returns the defaults for %j", (value) => {
    expect(parseEditorPreferences(value)).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });

  it("keeps valid stored values", () => {
    expect(parseEditorPreferences(custom)).toEqual(custom);
  });

  it("falls back per field for missing or invalid values and drops unknown keys", () => {
    expect(
      parseEditorPreferences({ fontSize: 99, minimap: true, theme: "light", extra: 1 }),
    ).toEqual({ ...DEFAULT_EDITOR_PREFERENCES, minimap: true });
  });

  it("defaults to word wrap on, minimap off and vs-dark", () => {
    expect(DEFAULT_EDITOR_PREFERENCES).toMatchObject({
      wordWrap: true,
      minimap: false,
      theme: "vs-dark",
    });
  });
});

describe("editorLineHeight", () => {
  it("keeps the 13px font on a 20px line", () => {
    expect(editorLineHeight(13)).toBe(20);
  });

  it("scales with the font size", () => {
    expect(editorLineHeight(16)).toBe(24);
    expect(editorLineHeight(20)).toBe(30);
  });
});
