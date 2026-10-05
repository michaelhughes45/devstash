import { ExternalLink, File } from "lucide-react";

import { formatFileSize, safeExternalUrl } from "@/lib/item-content";
import type { ItemDetailData } from "@/types/items";

interface ItemDrawerContentProps {
  item: ItemDetailData;
}

function EmptyContent() {
  return <p className="text-sm text-muted-foreground">No content.</p>;
}

// Read-only for now; the code and markdown editors replace the text view later
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
    return (
      <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3 text-sm">
        <File className="size-5 shrink-0 text-muted-foreground" aria-hidden />
        <span className="min-w-0 flex-1 truncate">{item.fileName}</span>
        {item.fileSize !== null && (
          <span className="shrink-0 text-muted-foreground">
            {formatFileSize(item.fileSize)}
          </span>
        )}
      </div>
    );
  }

  if (!item.content) return <EmptyContent />;
  return (
    <pre className="max-h-[28rem] overflow-auto rounded-lg border bg-muted/40 p-4 font-mono text-xs leading-relaxed">
      <code>{item.content}</code>
    </pre>
  );
}
