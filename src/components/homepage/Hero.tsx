import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { ChaosIcons } from "./ChaosIcons";
import { START_HREF, resolveHref } from "./content";
import { MiniDashboard } from "./MiniDashboard";
import { GradientText, SectionEyebrow } from "./SectionHeader";

interface HeroProps {
  signedIn: boolean;
}

function Panel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <figure className="w-full rounded-xl border bg-card p-4 shadow-[0_20px_60px_-20px_rgb(0_0_0/0.6)]">
      <figcaption className="mb-3 font-mono text-xs text-muted-foreground">{label}</figcaption>
      {children}
    </figure>
  );
}

export function Hero({ signedIn }: HeroProps) {
  return (
    <section className="relative overflow-hidden pt-28 pb-18 md:pt-34 md:pb-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-50 left-1/2 h-150 w-225 -translate-x-1/2 bg-[radial-gradient(closest-side,rgb(99_102_241/0.22),transparent)]"
      />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <SectionEyebrow>Store Smarter. Build Faster.</SectionEyebrow>
          <h1 className="text-[clamp(2.4rem,6vw,4rem)] leading-[1.15] font-extrabold tracking-tight text-balance">
            Stop Losing Your
            <br />
            <GradientText>Developer Knowledge</GradientText>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-pretty text-muted-foreground">
            Your snippets live in VS Code, your prompts are buried in chat history, your commands
            are in a <code className="font-mono text-[0.9em]">.txt</code> file somewhere. DevStash
            brings all of it into one fast, searchable, AI-enhanced hub.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href={resolveHref(START_HREF, signedIn)}
              className={cn(buttonVariants({ size: "lg" }), "h-11 w-full px-6 text-base min-[421px]:w-auto")}
            >
              {signedIn ? "Go to Dashboard" : "Get Started Free"}
            </Link>
            <Link
              href="#features"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-11 w-full px-6 text-base min-[421px]:w-auto",
              )}
            >
              See Features
            </Link>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 items-center justify-items-center gap-4 md:mt-16 md:grid-cols-[1fr_auto_1fr] md:gap-6">
          <Panel label="Your knowledge today...">
            <ChaosIcons />
          </Panel>
          <div
            aria-hidden="true"
            className="grid size-14 place-items-center rounded-full bg-linear-to-r from-blue-500 to-violet-600 text-white motion-safe:animate-pulse-arrow"
          >
            <ArrowRight className="size-6.5 rotate-90 md:rotate-0" strokeWidth={2.4} />
          </div>
          <Panel label="...with DevStash">
            <MiniDashboard />
          </Panel>
        </div>
      </div>
    </section>
  );
}
