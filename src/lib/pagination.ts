export const ITEMS_PER_PAGE = 21;
export const COLLECTIONS_PER_PAGE = 21;

export const DASHBOARD_COLLECTIONS_LIMIT = 6;
export const DASHBOARD_RECENT_ITEMS_LIMIT = 10;

// One page of a listing plus the total, so the page can show page links
export interface Page<T> {
  rows: T[];
  total: number;
}

export interface PageRange {
  skip: number;
  take: number;
}

// The `?page=` search param as a page number; anything that isn't a whole
// number from 1 up is page 1
export function parsePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !/^\d+$/.test(raw)) return 1;
  const page = Number(raw);
  return Number.isSafeInteger(page) && page >= 1 ? page : 1;
}

export function pageRange(page: number, perPage: number): PageRange {
  return { skip: (page - 1) * perPage, take: perPage };
}

// At least 1, so an empty listing still has a (blank) first page
export function getPageCount(total: number, perPage: number): number {
  return Math.max(1, Math.ceil(total / perPage));
}

export type PageLink = number | "ellipsis";

// The page numbers to link to: the first and last pages and the current page
// with its neighbours, with gaps of more than one page collapsed to an ellipsis
export function getPageLinks(current: number, pageCount: number): PageLink[] {
  const pages = new Set([1, pageCount]);
  // Near either end, show enough pages that the link count stays steady
  const start = Math.max(1, Math.min(current - 1, pageCount - 4));
  const end = Math.min(pageCount, Math.max(current + 1, 5));
  for (let page = start; page <= end; page++) pages.add(page);

  const links: PageLink[] = [];
  let previous = 0;
  for (const page of [...pages].sort((a, b) => a - b)) {
    if (page - previous === 2) links.push(previous + 1);
    else if (page - previous > 2) links.push("ellipsis");
    links.push(page);
    previous = page;
  }
  return links;
}

// The listing's URL for a page; page 1 has no `?page=` so it matches the plain URL
export function pageHref(basePath: string, page: number): string {
  return page > 1 ? `${basePath}?page=${page}` : basePath;
}
