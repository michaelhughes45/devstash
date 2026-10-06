import { Download, ExternalLink, File } from "lucide-react";

import { CodeEditor } from "@/components/items/CodeEditor";
import { MarkdownEditor } from "@/components/items/MarkdownEditor";
import { buttonVariants } from "@/components/ui/button";
import {
  formatFileSize,
  isCodeType,
  isMarkdownType,
  safeExternalUrl,
} from "@/lib/item-content";
import type { ItemDetailData } from "@/types/items";

interface ItemDrawerContentProps {
  item: ItemDetailData;
}

function EmptyContent() {
  return <p className="text-sm text-muted-foreground">No content.</p>;
}

// Image preview (images only), then the file's name and size with a download link
function FileContent({ item }: ItemDrawerContentProps) {
  const imageUrl = item.type.name === "image" ? safeExternalUrl(item.fileUrl) : null;

  return (
    <div className="flex flex-col gap-3">
      {imageUrl && (
        <a
          href={imageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block overflow-hidden rounded-lg border bg-muted/40"
        >
          {/* Served from R2's public URL; next/image would need it as a remote pattern */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={item.fileName ?? item.title}
            className="mx-auto max-h-[28rem] w-auto object-contain"
          />
        </a>
      )}
      <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3 text-sm">
        <File className="size-5 shrink-0 text-muted-foreground" aria-hidden />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate">{item.fileName}</span>
          {item.fileSize !== null && (
            <span className="text-xs text-muted-foreground">
              {formatFileSize(item.fileSize)}
            </span>
          )}
        </div>
        {item.fileUrl && (
          <a
            href={`/api/items/${encodeURIComponent(item.id)}/download`}
            download
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Download />
            Download
          </a>
        )}
      </div>
    </div>
  );
}

// Read-only view; snippets and commands use the code editor, notes and prompts the markdown editor
export function ItemDrawerContent({ item }: ItemDrawerContentProps) {
  if (item.contentType === "URL") {
    if (!item.url) return <EmptyContent />;
    const href = safeExternalUrl(item.url);
    return href ? (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm break-all text-primary underline-offset-4 hover:underline"
      >
        {item.url}
        <ExternalLink className="size-3.5 shrink-0" aria-hidden />
      </a>
    ) : (
      <p className="text-sm break-all">{item.url}</p>
    );
  }

  if (item.contentType === "FILE") {
    if (!item.fileName) return <EmptyContent />;
    return <FileContent item={item} />;
  }

  if (!item.content) return <EmptyContent />;
  if (isCodeType(item.type.name)) {
    return (
      <CodeEditor value={item.content} language={item.language} readOnly ariaLabel="Content" />
    );
  }
  if (isMarkdownType(item.type.name)) {
    return <MarkdownEditor value={item.content} readOnly ariaLabel="Content" />;
  }
  return (
    <pre className="max-h-[28rem] overflow-auto rounded-lg border bg-muted/40 p-4 font-mono text-xs leading-relaxed">
      <code>{item.content}</code>
    </pre>
  );
}
