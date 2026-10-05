interface CopyableItem {
  contentType: "TEXT" | "FILE" | "URL";
  content: string | null;
  url: string | null;
  fileUrl: string | null;
}

// Only http(s) links are rendered, so a stored "javascript:" URL can't run on click
export function safeExternalUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

// What the drawer's Copy button puts on the clipboard, or null if there's nothing
export function getItemCopyText(item: CopyableItem): string | null {
  const text =
    item.contentType === "URL"
      ? item.url
      : item.contentType === "FILE"
        ? item.fileUrl
        : item.content;
  return text?.trim() ? text : null;
}

// Splits the edit form's comma-separated tags input, dropping blanks and repeats
export function parseTags(input: string): string[] {
  const tags = input
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  return [...new Set(tags)];
}

// System types whose items get a language field for syntax highlighting
const LANGUAGE_TYPES = ["snippet", "command"];

export interface EditableFields {
  content: boolean;
  language: boolean;
  url: boolean;
}

// Type-specific fields the edit form shows; title, description and tags always show
export function getEditableFields(item: {
  contentType: "TEXT" | "FILE" | "URL";
  type: { name: string };
}): EditableFields {
  return {
    content: item.contentType === "TEXT",
    language: item.contentType === "TEXT" && LANGUAGE_TYPES.includes(item.type.name),
    url: item.contentType === "URL",
  };
}

const SIZE_UNITS =["B", "KB", "MB", "GB"];

export function formatFileSize(bytes: number): string {
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < SIZE_UNITS.length - 1) {
    size /= 1024;
    unit++;
  }
  const rounded = unit === 0 ? size : Math.round(size * 10) / 10;
  return `${rounded} ${SIZE_UNITS[unit]}`;
}
