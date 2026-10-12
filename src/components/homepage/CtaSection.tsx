import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { START_HREF, resolveHref } from "./content";
import { Reveal } from "./Reveal";
import { SectionLead, SectionTitle } from "./SectionHeader";

interface CtaSectionProps {
  signedIn: boolean;
}

export function CtaSection({ signedIn }: CtaSectionProps) {
  return (
    <section className="pt-8 pb-20 md:pb-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="rounded-[20px] border bg-card bg-[radial-gradient(circle_at_50%_0%,rgb(99_102_241/0.25),transparent_65%)] px-5 py-14 text-center sm:px-6 md:py-18">
          <SectionTitle>Ready to Organize Your Knowledge?</SectionTitle>
          <SectionLead className="mx-auto mb-8 max-w-lg">
            Join developers who stopped losing their best work to scattered tabs and files.
          </SectionLead>
          <Link
            href={resolveHref(START_HREF, signedIn)}
            className={cn(buttonVariants({ size: "lg" }), "h-11 px-6 text-base")}
          >
            {signedIn ? "Go to Dashboard" : "Get Started Free"}
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
