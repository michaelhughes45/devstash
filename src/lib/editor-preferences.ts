import { z } from "zod";

export const EDITOR_FONT_SIZES = [12, 13, 14, 15, 16, 18, 20] as const;
export const EDITOR_TAB_SIZES = [2, 4, 8] as const;
export const EDITOR_THEMES = ["vs-dark", "monokai", "github-dark"] as const;

export type EditorFontSize = (typeof EDITOR_FONT_SIZES)[number];
export type EditorTabSize = (typeof EDITOR_TAB_SIZES)[number];
export type EditorTheme = (typeof EDITOR_THEMES)[number];

export interface EditorPreferences {
  fontSize: EditorFontSize;
  tabSize: EditorTabSize;
  wordWrap: boolean;
  minimap: boolean;
  theme: EditorTheme;
}

// Font and tab size match the editor before preferences existed
export const DEFAULT_EDITOR_PREFERENCES: EditorPreferences = {
  fontSize: 13,
  tabSize: 2,
  wordWrap: true,
  minimap: false,
  theme: "vs-dark",
};

export const EDITOR_THEME_LABELS: Record<EditorTheme, string> = {
  "vs-dark": "VS Dark",
  monokai: "Monokai",
  "github-dark": "GitHub Dark",
};

const fontSizeSchema = z.literal(EDITOR_FONT_SIZES);
const tabSizeSchema = z.literal(EDITOR_TAB_SIZES);
const themeSchema = z.enum(EDITOR_THEMES);

// What the settings form sends; every field is required so a save is the whole set
export const editorPreferencesSchema = z.object({
  fontSize: fontSizeSchema,
  tabSize: tabSizeSchema,
  wordWrap: z.boolean(),
  minimap: z.boolean(),
  theme: themeSchema,
});

const DEFAULTS = DEFAULT_EDITOR_PREFERENCES;

// Stored JSON isn't trusted: each missing or invalid field falls back to its default
const storedPreferencesSchema = z
  .object({
    fontSize: fontSizeSchema.catch(DEFAULTS.fontSize),
    tabSize: tabSizeSchema.catch(DEFAULTS.tabSize),
    wordWrap: z.boolean().catch(DEFAULTS.wordWrap),
    minimap: z.boolean().catch(DEFAULTS.minimap),
    theme: themeSchema.catch(DEFAULTS.theme),
  })
  .catch(DEFAULTS);

export function parseEditorPreferences(value: unknown): EditorPreferences {
  return storedPreferencesSchema.parse(value ?? {});
}

// Keeps the editor's original 13px/20px ratio as the font size changes
export function editorLineHeight(fontSize: number): number {
  return Math.round(fontSize * 1.5);
}
