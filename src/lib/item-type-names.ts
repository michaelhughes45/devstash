// Sidebar order for system types; custom types follow alphabetically
const SYSTEM_TYPE_ORDER = ["snippet", "prompt", "command", "note", "file", "image", "link"];

// Item types only Pro users can create; also badged PRO in the sidebar.
// Kept here, not in usage-limits.ts, because client components import this file and that one uses Prisma
export const PRO_ONLY_ITEM_TYPES = ["file", "image"] as const;

export function isProOnlyItemType(type: string): boolean {
  return (PRO_ONLY_ITEM_TYPES as readonly string[]).includes(type);
}

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
  return isSystem && isProOnlyItemType(name);
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
