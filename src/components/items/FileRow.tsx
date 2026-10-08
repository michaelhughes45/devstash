import {
  Download,
  File,
  FileBraces,
  FileCode,
  FileCog,
  FileSpreadsheet,
  FileText,
  Pin,
  Star,
  type LucideIcon,
} from "lucide-react";

import { ItemCardTrigger } from "@/components/items/ItemCardTrigger";
import { buttonVariants } from "@/components/ui/button";
import type { ItemWithType } from "@/lib/db/items";
import { formatFileSize, getFileIconName, type FileIconName } from "@/lib/item-content";

const FILE_ICONS: Record<FileIconName, LucideIcon> = {
  File,
  FileText,
  FileBraces,
  FileCode,
  FileCog,
  FileSpreadsheet,
};

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

interface FileRowProps {
  item: ItemWithType;
}

// One row of the file list. The download link sits beside the drawer trigger, not inside it,
// since a link can't be nested in a button; clicking it never opens the drawer.
export function FileRow({ item }: FileRowProps) {
  const { type } = item;
  const Icon = FILE_ICONS[getFileIconName(item.fileName)];
  const size = item.fileSize !== null ? formatFileSize(item.fileSize) : null;
  const date = (
    <time dateTime={item.createdAt.toISOString()}>{DATE_FORMAT.format(item.createdAt)}</time>
  );

  return (
    <li className="flex items-center gap-2 pr-3 transition-colors hover:bg-muted/40">
      <div className="min-w-0 flex-1">
        <ItemCardTrigger
          preview={{ id: item.id, title: item.title, type }}
          // Inset so the list's rounded, overflow-hidden border doesn't clip the focus ring
          className="focus-visible:ring-inset"
        >
          <div className="flex items-center gap-3 py-3 pr-2 pl-4">
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted"
              style={{ color: type.color }}
            >
              <Icon className="size-5" aria-hidden />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium">{item.title}</span>
                {item.isPinned && <Pin className="size-3.5 shrink-0 text-muted-foreground" />}
                {item.isFavorite && (
                  <Star className="size-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
                )}
              </div>
              {item.fileName && (
                <span className="truncate text-xs text-muted-foreground">{item.fileName}</span>
              )}
              <span className="text-xs text-muted-foreground sm:hidden">
                {size && <>{size} · </>}
                {date}
              </span>
            </div>
            <span className="hidden w-20 shrink-0 text-right text-sm text-muted-foreground sm:block">
              {size}
            </span>
            <span className="hidden w-28 shrink-0 text-right text-sm text-muted-foreground sm:block">
              {date}
            </span>
          </div>
        </ItemCardTrigger>
      </div>
      {item.fileUrl && (
        <a
          href={`/api/items/${encodeURIComponent(item.id)}/download`}
          download
          aria-label={`Download ${item.title}`}
          title="Download"
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <Download />
        </a>
      )}
    </li>
  );
}
