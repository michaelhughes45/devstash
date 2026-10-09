import type { editor } from "monaco-editor";

import type { EditorTheme } from "@/lib/editor-preferences";

// Prefixed so they never clash with Monaco's built-in theme names
export const MONACO_THEME_IDS: Record<EditorTheme, string> = {
  "vs-dark": "devstash-vs-dark",
  monokai: "devstash-monokai",
  "github-dark": "devstash-github-dark",
};

const SCROLLBAR_COLORS = {
  "scrollbar.shadow": "#00000000",
  "scrollbarSlider.background": "#ffffff1f",
  "scrollbarSlider.hoverBackground": "#ffffff33",
  "scrollbarSlider.activeBackground": "#ffffff4d",
};

// Monaco needs hex colors
export const MONACO_THEMES: Record<EditorTheme, editor.IStandaloneThemeData> = {
  // vs-dark on #171717, the dark theme's --card, so the editor blends into the page
  "vs-dark": {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#171717",
      "editor.lineHighlightBackground": "#ffffff0a",
      "editorLineNumber.foreground": "#525252",
      "editorLineNumber.activeForeground": "#a3a3a3",
      "editorGutter.background": "#171717",
      ...SCROLLBAR_COLORS,
    },
  },
  monokai: {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "", foreground: "f8f8f2" },
      { token: "comment", foreground: "75715e", fontStyle: "italic" },
      { token: "keyword", foreground: "f92672" },
      { token: "operator", foreground: "f92672" },
      { token: "string", foreground: "e6db74" },
      { token: "number", foreground: "ae81ff" },
      { token: "constant", foreground: "ae81ff" },
      { token: "regexp", foreground: "e6db74" },
      { token: "type", foreground: "66d9ef", fontStyle: "italic" },
      { token: "function", foreground: "a6e22e" },
      { token: "variable", foreground: "fd971f" },
      { token: "tag", foreground: "f92672" },
      { token: "attribute.name", foreground: "a6e22e" },
      { token: "attribute.value", foreground: "e6db74" },
      { token: "delimiter", foreground: "f8f8f2" },
    ],
    colors: {
      "editor.background": "#272822",
      "editor.foreground": "#f8f8f2",
      "editor.lineHighlightBackground": "#3e3d32",
      "editor.selectionBackground": "#49483e",
      "editorCursor.foreground": "#f8f8f0",
      "editorLineNumber.foreground": "#90908a",
      "editorLineNumber.activeForeground": "#c2c2bf",
      "editorGutter.background": "#272822",
      ...SCROLLBAR_COLORS,
    },
  },
  "github-dark": {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "", foreground: "e6edf3" },
      { token: "comment", foreground: "8b949e", fontStyle: "italic" },
      { token: "keyword", foreground: "ff7b72" },
      { token: "operator", foreground: "ff7b72" },
      { token: "string", foreground: "a5d6ff" },
      { token: "number", foreground: "79c0ff" },
      { token: "constant", foreground: "79c0ff" },
      { token: "regexp", foreground: "7ee787" },
      { token: "type", foreground: "ffa657" },
      { token: "function", foreground: "d2a8ff" },
      { token: "variable", foreground: "ffa657" },
      { token: "tag", foreground: "7ee787" },
      { token: "attribute.name", foreground: "79c0ff" },
      { token: "attribute.value", foreground: "a5d6ff" },
      { token: "delimiter", foreground: "e6edf3" },
    ],
    colors: {
      "editor.background": "#0d1117",
      "editor.foreground": "#e6edf3",
      "editor.lineHighlightBackground": "#6e76811a",
      "editor.selectionBackground": "#264f78",
      "editorCursor.foreground": "#e6edf3",
      "editorLineNumber.foreground": "#6e7681",
      "editorLineNumber.activeForeground": "#e6edf3",
      "editorGutter.background": "#0d1117",
      ...SCROLLBAR_COLORS,
    },
  },
};
