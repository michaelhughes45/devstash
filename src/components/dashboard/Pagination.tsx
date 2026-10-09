import Link from "next/link";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { getPageLinks, pageHref } from "@/lib/pagination";
import { cn } from "@/lib/utils";

interface PaginationProps {
  // The listing's URL without `?page=`, e.g. "/items/snippets"
  basePath: string;
  page: number;
  pageCount: number;
}

interface StepLinkProps {
  href: string | null;
  label: string;
  children: React.ReactNode;
}

// Previous or Next: a link, or greyed-out text when there's no page that way
function StepLink({ href, label, children }: StepLinkProps) {
  const className = cn(buttonVariants({ variant: "ghost" }), "gap-1 px-2 sm:px-2.5");
  if (!href) {
    return (
      <span aria-disabled="true" className={cn(className, "pointer-events-none opacity-50")}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} aria-label={label} className={className}>
      {children}
    </Link>
  );
}

// Page links under a listing; hidden when everything fits on one page
export function Pagination({ basePath, page, pageCount }: PaginationProps) {
  if (pageCount <= 1) return null;

  return (
    <nav aria-label="Pagination" className="flex justify-center">
      <ul className="flex flex-wrap items-center justify-center gap-1">
        <li>
          <StepLink
            href={page > 1 ? pageHref(basePath, page - 1) : null}
            label="Go to previous page"
          >
            <ChevronLeft aria-hidden />
            <span className="hidden sm:inline">Previous</span>
          </StepLink>
        </li>
        {getPageLinks(page, pageCount).map((link, index) =>
          link === "ellipsis" ? (
            <li key={`ellipsis-${index}`} aria-hidden>
              <span className="flex size-8 items-center justify-center text-muted-foreground">
                <MoreHorizontal className="size-4" />
              </span>
            </li>
          ) : (
            <li key={link}>
              <Link
                href={pageHref(basePath, link)}
                aria-label={`Page ${link}`}
                aria-current={link === page ? "page" : undefined}
                className={buttonVariants({
                  variant: link === page ? "outline" : "ghost",
                  size: "icon",
                })}
              >
                {link}
              </Link>
            </li>
          ),
        )}
        <li>
          <StepLink
            href={page < pageCount ? pageHref(basePath, page + 1) : null}
            label="Go to next page"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight aria-hidden />
          </StepLink>
        </li>
      </ul>
    </nav>
  );
}
