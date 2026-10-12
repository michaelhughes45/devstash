import Link from "next/link";

import { Logo } from "@/components/Logo";

import { FOOTER_COLUMNS } from "./content";

interface HomeFooterProps {
  signedIn: boolean;
}

export function HomeFooter({ signedIn }: HomeFooterProps) {
  const session = signedIn ? "signedIn" : "signedOut";

  return (
    <footer className="border-t pt-16 pb-8">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 sm:grid-cols-[2fr_1fr_1fr] sm:px-6">
        <div className="col-span-full sm:col-span-1">
          <Logo href="#top" />
          <p className="mt-3 text-sm text-muted-foreground">Store Smarter. Build Faster.</p>
        </div>
        {FOOTER_COLUMNS.map((column) => (
          <nav key={column.title} aria-label={column.title} className="flex flex-col gap-2.5 text-sm">
            <h2 className="mb-1 text-xs font-semibold tracking-[0.08em] uppercase">{column.title}</h2>
            {column.links
              .filter((link) => !link.when || link.when === session)
              .map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="w-fit text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
          </nav>
        ))}
      </div>
      <div className="mx-auto mt-12 max-w-6xl px-4 sm:px-6">
        <p className="border-t pt-6 text-sm text-muted-foreground/70">
          &copy; {new Date().getFullYear()} DevStash. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
