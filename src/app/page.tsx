import type { Metadata } from "next";

import { AiSection } from "@/components/homepage/AiSection";
import { CtaSection } from "@/components/homepage/CtaSection";
import { Features } from "@/components/homepage/Features";
import { Hero } from "@/components/homepage/Hero";
import { HomeFooter } from "@/components/homepage/HomeFooter";
import { HomeNav } from "@/components/homepage/HomeNav";
import { Pricing } from "@/components/homepage/Pricing";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "DevStash — Store Smarter. Build Faster.",
  description:
    "DevStash is one searchable, AI-enhanced hub for your code snippets, AI prompts, commands, notes, files, images and links.",
};

export default async function Home() {
  const session = await getSession();
  const signedIn = Boolean(session?.user);

  return (
    // data-home turns on smooth scrolling for in-page anchors (see the root layout)
    <div id="top" data-home className="flex-1 overflow-x-clip">
      <HomeNav signedIn={signedIn} />
      <main>
        <Hero signedIn={signedIn} />
        <Features />
        <AiSection />
        <Pricing signedIn={signedIn} />
        <CtaSection signedIn={signedIn} />
      </main>
      <HomeFooter signedIn={signedIn} />
    </div>
  );
}
