// Longest preview the command palette shows under an item's title
export const SEARCH_PREVIEW_LENGTH = 120;

// Collapses whitespace (so code and Markdown read as one line) and cuts the
// text to `maxLength` characters, adding an ellipsis when it was cut
export function toSearchPreview(
  text: string | null,
  maxLength: number = SEARCH_PREVIEW_LENGTH,
): string {
  const line = (text ?? "").replace(/\s+/g, " ").trim();
  if (line.length <= maxLength) return line;
  return `${line.slice(0, maxLength - 1).trimEnd()}…`;
}
