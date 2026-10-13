"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Logo } from "@/components/Logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { NAV_LINKS, START_HREF, resolveHref } from "./content";

interface HomeNavProps {
  signedIn: boolean;
  /** Prefix for the in-page anchors: "" on the homepage, "/" on other pages so they lead back to it */
  anchorBase?: "" | "/";
}

export function HomeNav({ signedIn, anchorBase = "" }: HomeNavProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 16);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b backdrop-blur-md transition-colors duration-300",
        scrolled ? "border-border bg-background/90" : "border-transparent bg-background/35",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:gap-8 sm:px-6">
        {/* Icon only below 360px, so Sign in and Get Started both fit */}
        <Logo href={`${anchorBase}#top`} className="max-[359px]:[&>span:last-child]:hidden" />
        <nav aria-label="Primary" className="hidden gap-6 text-sm text-muted-foreground sm:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={`${anchorBase}${link.href}`} className="inline-flex min-h-11 items-center transition-colors hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1 min-[421px]:gap-2">
          {!signedIn && (
            <Link
              href="/sign-in"
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "px-2 text-muted-foreground min-[421px]:px-2.5",
              )}
            >
              Sign in
            </Link>
          )}
          <Link
            href={resolveHref(START_HREF, signedIn)}
            className={buttonVariants()}
          >
            {signedIn ? "Dashboard" : "Get Started"}
          </Link>
        </div>
      </div>
    </header>
  );
}
