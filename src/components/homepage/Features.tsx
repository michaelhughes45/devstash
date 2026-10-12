import type { CSSProperties } from "react";

import { Card } from "@/components/ui/card";

import { FEATURES } from "./content";
import { Reveal } from "./Reveal";
import { SectionHeader } from "./SectionHeader";

export function Features() {
  return (
    <section id="features" className="scroll-mt-16 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader
          eyebrow="Features"
          title="Everything you reach for, in one place"
          lead="Every kind of developer knowledge gets a home, a color and a keyboard shortcut away."
        />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ title, description, icon: Icon, color }) => (
            <Reveal key={title}>
              <Card
                style={{ "--type-color": color } as CSSProperties}
                className="relative h-full gap-0 p-7 ring-border transition-[translate,box-shadow] duration-300 before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-(--type-color) hover:-translate-y-0.75 hover:ring-[color-mix(in_oklch,var(--type-color)_55%,var(--border))]"
              >
                <div className="mb-5 grid size-11 place-items-center rounded-[10px] bg-[color-mix(in_oklch,var(--type-color)_15%,transparent)] text-(--type-color)">
                  <Icon className="size-5.5" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{title}</h3>
                <p className="text-[0.95rem] leading-relaxed text-muted-foreground">{description}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
