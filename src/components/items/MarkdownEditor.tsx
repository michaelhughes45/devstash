"use client";

import { useId, useState, type ComponentProps } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { copyToClipboard } from "@/lib/clipboard";
import { cn } from "@/lib/utils";

type Tab = "write" | "preview";

const REMARK_PLUGINS = [remarkGfm];

// Links leave the app in a new tab; react-markdown blanks unsafe URLs like javascript:,
// so those render as plain text instead of a link back to the current page
const COMPONENTS: Components = {
  a: ({ href, title, children }) =>
    href ? (
      <a href={href} title={title} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ) : (
      <span>{children}</span>
    ),
};

interface TabButtonProps extends ComponentProps<"button"> {
  selected: boolean;
}

function TabButton({ selected, className, ...props }: TabButtonProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      tabIndex={selected ? 0 : -1}
      className={cn(
        "rounded-md px-2 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        selected && "bg-muted text-foreground",
        className,
      )}
      {...props}
    />
  );
}

interface MarkdownEditorProps {
  value: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  // Id for the Write textarea, so a form label can point at it
  id?: string;
  ariaLabel?: string;
  // Id of the error message describing the field
  ariaDescribedBy?: string;
  invalid?: boolean;
}

export function MarkdownEditor({
  value,
  readOnly = false,
  onChange,
  id,
  ariaLabel = "Markdown",
  ariaDescribedBy,
  invalid = false,
}: MarkdownEditorProps) {
  const [tab, setTab] = useState<Tab>(readOnly ? "preview" : "write");
  const tabsId = useId();
  const tabId = (name: Tab) => `${tabsId}-${name}-tab`;
  const panelId = `${tabsId}-panel`;
  const showWrite = !readOnly && tab === "write";

  const selectTab = (next: Tab) => {
    setTab(next);
    document.getElementById(tabId(next))?.focus();
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border bg-card",
        showWrite && "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
        invalid && "border-destructive",
      )}
    >
      <div className="flex items-center gap-3 border-b bg-muted/40 px-3 py-1.5">
        <div
          role="tablist"
          aria-label={`${ariaLabel} view`}
          className="flex gap-1"
          onKeyDown={(event) => {
            if (readOnly) return;
            if (event.key === "ArrowLeft") selectTab("write");
            if (event.key === "ArrowRight") selectTab("preview");
          }}
        >
          {!readOnly && (
            <TabButton
              id={tabId("write")}
              aria-controls={panelId}
              selected={tab === "write"}
              onClick={() => setTab("write")}
            >
              Write
            </TabButton>
          )}
          <TabButton
            id={tabId("preview")}
            aria-controls={panelId}
            selected={tab === "preview"}
            onClick={() => setTab("preview")}
          >
            Preview
          </TabButton>
        </div>
        <span className="ml-auto font-mono text-xs text-muted-foreground">markdown</span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={!value.trim()}
          onClick={() => void copyToClipboard(value)}
          aria-label="Copy content"
        >
          <Copy />
        </Button>
      </div>

      <div id={panelId} role="tabpanel" aria-labelledby={tabId(tab)}>
        {showWrite ? (
          <textarea
            id={id}
            value={value}
            onChange={(event) => onChange?.(event.target.value)}
            aria-label={id ? undefined : ariaLabel}
            aria-invalid={invalid || undefined}
            aria-describedby={ariaDescribedBy}
            spellCheck={false}
            placeholder="Write in Markdown…"
            className="block field-sizing-content max-h-100 min-h-40 w-full resize-none bg-transparent px-3 py-3 font-mono text-xs leading-relaxed outline-none placeholder:text-muted-foreground"
          />
        ) : (
          <div
            className={cn(
              "markdown-preview max-h-100 overflow-auto px-4 py-3",
              !readOnly && "min-h-40",
            )}
          >
            {value.trim() ? (
              <ReactMarkdown remarkPlugins={REMARK_PLUGINS} components={COMPONENTS}>
                {value}
              </ReactMarkdown>
            ) : (
              <p className="text-muted-foreground">Nothing to preview.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
