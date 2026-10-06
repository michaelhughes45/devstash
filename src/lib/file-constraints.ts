// Upload rules shared by the FileUpload component, the upload route and createItem

export const FILE_ITEM_TYPES = ["file", "image"] as const;

export type FileItemType = (typeof FILE_ITEM_TYPES)[number];

export function isFileItemType(type: string): type is FileItemType {
  return (FILE_ITEM_TYPES as readonly string[]).includes(type);
}

const MB = 1024 * 1024;

interface FileConstraint {
  maxSize: number;
  // Extension (lowercase, with the dot) to the Content-Type it's stored and served as
  extensions: Record<string, string>;
  // MIME types a browser may report for these extensions
  mimeTypes: readonly string[];
}

export const FILE_CONSTRAINTS: Record<FileItemType, FileConstraint> = {
  image: {
    maxSize: 5 * MB,
    extensions: {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".svg": "image/svg+xml",
    },
    mimeTypes: ["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"],
  },
  file: {
    maxSize: 10 * MB,
    extensions: {
      ".pdf": "application/pdf",
      ".txt": "text/plain",
      ".md": "text/markdown",
      ".json": "application/json",
      ".yaml": "application/x-yaml",
      ".yml": "application/x-yaml",
      ".xml": "application/xml",
      ".csv": "text/csv",
      ".toml": "application/toml",
      ".ini": "text/plain",
    },
    mimeTypes: [
      "application/pdf",
      "text/plain",
      "text/markdown",
      "application/json",
      "application/x-yaml",
      "text/yaml",
      "application/xml",
      "text/xml",
      "text/csv",
      "application/toml",
    ],
  },
};

// Browsers report no type, or a generic one, for extensions the OS doesn't know
// (e.g. .md, .toml or .yaml on Windows), so those fall back to the extension
const GENERIC_MIME_TYPES = ["", "application/octet-stream"];

const MAX_FILE_NAME_LENGTH = 255;

// Lowercase extension with the dot, or "" if the name has none
export function getFileExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot > 0 ? fileName.slice(dot).toLowerCase() : "";
}

// Content-Type to store and serve the file as, from its extension; null if not allowed
export function getStoredContentType(type: FileItemType, fileName: string): string | null {
  return FILE_CONSTRAINTS[type].extensions[getFileExtension(fileName)] ?? null;
}

export function getAcceptAttribute(type: FileItemType): string {
  return Object.keys(FILE_CONSTRAINTS[type].extensions).join(",");
}

export function formatMaxSize(type: FileItemType): string {
  return `${FILE_CONSTRAINTS[type].maxSize / MB} MB`;
}

interface UploadCandidate {
  name: string;
  size: number;
  // The browser-reported MIME type (File.type)
  type: string;
}

// Returns a user-facing error, or null if the file can be uploaded as `type`
export function validateUploadFile(type: FileItemType, file: UploadCandidate): string | null {
  const constraint = FILE_CONSTRAINTS[type];
  const noun = type === "image" ? "Image" : "File";

  if (file.name.length > MAX_FILE_NAME_LENGTH) return "File name is too long.";
  if (!getStoredContentType(type, file.name)) {
    const allowed = Object.keys(constraint.extensions).join(", ");
    return `${noun} type not allowed. Use ${allowed}.`;
  }
  const mimeType = file.type.toLowerCase();
  if (!GENERIC_MIME_TYPES.includes(mimeType) && !constraint.mimeTypes.includes(mimeType)) {
    return `${noun} type not allowed.`;
  }
  if (file.size === 0) return `${noun} is empty.`;
  if (file.size > constraint.maxSize) {
    return `${noun} is too large. The limit is ${formatMaxSize(type)}.`;
  }
  return null;
}
