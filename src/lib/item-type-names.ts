// Sidebar order for system types; custom types follow alphabetically
const SYSTEM_TYPE_ORDER = ["snippet", "prompt", "command", "note", "file", "image", "link"];

// System types shown with a PRO badge in the sidebar
const PRO_SYSTEM_TYPES = ["file", "image"];

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function toPlural(name: string): string {
  return name.endsWith("s") ? name : `${name}s`;
}

// Display name in the sidebar and page headers, e.g. "snippet" → "Snippets"
export function getTypeDisplayName(name: string): string {
  return capitalize(toPlural(name));
}

// URL segment for /items/[slug], e.g. "snippet" → "snippets"
export function getTypeSlug(name: string): string {
  return encodeURIComponent(toPlural(name).toLowerCase());
}

export function isProSystemType(name: string, isSystem: boolean): boolean {
  return isSystem && PRO_SYSTEM_TYPES.includes(name);
}

interface RankedType {
  name: string;
  isSystem: boolean;
}

function getTypeRank({ name, isSystem }: RankedType): number {
  const index = SYSTEM_TYPE_ORDER.indexOf(name);
  return isSystem && index !== -1 ? index : SYSTEM_TYPE_ORDER.length;
}

// Sort comparator: system types in sidebar order, then the rest alphabetically
export function compareItemTypes(a: RankedType, b: RankedType): number {
  return getTypeRank(a) - getTypeRank(b) || a.name.localeCompare(b.name);
}
