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

// System types whose items get a language field and the code editor
const CODE_TYPES = ["snippet", "command"];

export function isCodeType(typeName: string): boolean {
  return CODE_TYPES.includes(typeName);
}

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
    language: item.contentType === "TEXT" && isCodeType(item.type.name),
    url: item.contentType === "URL",
  };
}

// Raw text of the item form's inputs; tags are the comma-separated string
export interface ItemFormValues {
  title: string;
  description: string;
  content: string;
  language: string;
  url: string;
  tags: string;
}

export const EMPTY_ITEM_FORM_VALUES: ItemFormValues = {
  title: "",
  description: "",
  content: "",
  language: "",
  url: "",
  tags: "",
};

// Builds the action input from the form, sending only the fields it shows
export function buildItemInput(values: ItemFormValues, fields: EditableFields) {
  return {
    title: values.title,
    description: values.description,
    tags: parseTags(values.tags),
    ...(fields.content && { content: values.content }),
    ...(fields.language && { language: values.language }),
    ...(fields.url && { url: values.url }),
  };
}

// System types the New Item dialog can create; file and image need uploads
export const CREATABLE_ITEM_TYPES = ["snippet", "prompt", "command", "note", "link"] as const;

export type CreatableItemType = (typeof CREATABLE_ITEM_TYPES)[number];

export function getContentTypeForType(type: CreatableItemType): "TEXT" | "URL" {
  return type === "link" ? "URL" : "TEXT";
}

// Fields the create form shows for a type, matching what the edit form would show
export function getCreateFields(type: CreatableItemType): EditableFields {
  return getEditableFields({ contentType: getContentTypeForType(type), type: { name: type } });
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
