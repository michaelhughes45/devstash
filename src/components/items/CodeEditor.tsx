"use client";

import { useState } from "react";
import Editor, { type BeforeMount, type OnMount } from "@monaco-editor/react";
import { Copy } from "lucide-react";

import { useEditorPreferences } from "@/components/settings/EditorPreferencesContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { copyToClipboard } from "@/lib/clipboard";
import { toMonacoLanguage } from "@/lib/code-language";
import { EDITOR_THEMES, editorLineHeight } from "@/lib/editor-preferences";
import { MONACO_THEME_IDS, MONACO_THEMES } from "@/lib/monaco-themes";
import { cn } from "@/lib/utils";

const PADDING = 12;
const MAX_HEIGHT = 400;
// Edit mode keeps room to type even when the content is short
const MIN_EDIT_HEIGHT = 160;

// Stored snippets are fragments, so type and syntax errors would only be noise
const NO_DIAGNOSTICS = { noSemanticValidation: true, noSyntaxValidation: true };

const setupMonaco: BeforeMount = (monaco) => {
  monaco.typescript.typescriptDefaults.setDiagnosticsOptions(NO_DIAGNOSTICS);
  monaco.typescript.javascriptDefaults.setDiagnosticsOptions(NO_DIAGNOSTICS);

  for (const theme of EDITOR_THEMES) {
    monaco.editor.defineTheme(MONACO_THEME_IDS[theme], MONACO_THEMES[theme]);
  }
};

function clampHeight(contentHeight: number, minHeight: number): number {
  return Math.min(Math.max(contentHeight, minHeight), MAX_HEIGHT);
}

interface CodeEditorProps {
  value: string;
  // The item's language as typed, shown in the header and mapped for highlighting
  language: string | null;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  ariaLabel?: string;
  invalid?: boolean;
}

export function CodeEditor({
  value,
  language,
  readOnly = false,
  onChange,
  ariaLabel = "Code",
  invalid = false,
}: CodeEditorProps) {
  const { preferences } = useEditorPreferences();
  const lineHeight = editorLineHeight(preferences.fontSize);
  const minHeight = readOnly ? 0 : MIN_EDIT_HEIGHT;
  // Estimate from the line count so the first paint doesn't jump once Monaco measures
  const [height, setHeight] = useState(() =>
    clampHeight(value.split("\n").length * lineHeight + PADDING * 2, minHeight),
  );
  const languageLabel = language?.trim() || "plain text";

  const handleMount: OnMount = (editor) => {
    const resize = () => setHeight(clampHeight(editor.getContentHeight(), minHeight));
    editor.onDidContentSizeChange(resize);
    resize();
  };

  return (
    <div
      className={cn(
        "code-editor overflow-hidden rounded-lg border bg-card",
        invalid && "border-destructive",
      )}
    >
      <div className="flex items-center gap-3 border-b bg-muted/40 px-3 py-1.5">
        <div className="flex gap-1.5" aria-hidden>
          <span className="size-3 rounded-full bg-window-close" />
          <span className="size-3 rounded-full bg-window-minimize" />
          <span className="size-3 rounded-full bg-window-maximize" />
        </div>
        <span className="ml-auto font-mono text-xs text-muted-foreground">
          {languageLabel}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={!value.trim()}
          onClick={() => void copyToClipboard(value)}
          aria-label="Copy code"
        >
          <Copy />
        </Button>
      </div>
      <Editor
        height={height}
        value={value}
        language={toMonacoLanguage(language)}
        theme={MONACO_THEME_IDS[preferences.theme]}
        beforeMount={setupMonaco}
        onMount={handleMount}
        onChange={(next) => onChange?.(next ?? "")}
        loading={<Skeleton className="size-full rounded-none" />}
        options={{
          readOnly,
          domReadOnly: readOnly,
          ariaLabel,
          fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
          fontSize: preferences.fontSize,
          lineHeight,
          padding: { top: PADDING, bottom: PADDING },
          minimap: { enabled: preferences.minimap },
          wordWrap: preferences.wordWrap ? "on" : "off",
          scrollBeyondLastLine: false,
          renderLineHighlight: readOnly ? "none" : "line",
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          automaticLayout: true,
          tabSize: preferences.tabSize,
          // Otherwise Monaco guesses the tab size from the content and ignores the setting
          detectIndentation: false,
          contextmenu: !readOnly,
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
            useShadows: false,
            // Lets the drawer scroll once the editor reaches its top or bottom
            alwaysConsumeMouseWheel: false,
          },
        }}
      />
    </div>
  );
}
