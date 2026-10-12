import { Check, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { AiTags } from "./AiTags";
import { AI_FEATURES, CODE_SAMPLE, CODE_SAMPLE_FILE_NAME, type CodeTokenKind } from "./content";
import { Reveal } from "./Reveal";
import { GradientText, SectionLead, SectionTitle } from "./SectionHeader";

const TOKEN_CLASSES: Record<CodeTokenKind, string> = {
  keyword: "text-[#c678dd]",
  string: "text-[#98c379]",
  function: "text-[#61afef]",
  number: "text-[#d19a66]",
};

const WINDOW_DOTS = ["bg-window-close", "bg-window-minimize", "bg-window-maximize"];

function CodeSample() {
  return (
    <pre className="overflow-x-auto p-5 font-mono text-[0.82rem] leading-[1.7] text-[#c9d1d9]">
      <code>
        {CODE_SAMPLE.map((line, lineIndex) => (
          <span key={lineIndex} className="block min-h-[1.7em]">
            {line.map((token, tokenIndex) =>
              typeof token === "string" ? (
                token
              ) : (
                <span key={tokenIndex} className={TOKEN_CLASSES[token.kind]}>
                  {token.text}
                </span>
              ),
            )}
          </span>
        ))}
      </code>
    </pre>
  );
}

export function AiSection() {
  return (
    <section id="ai" className="scroll-mt-16 border-y bg-card/40 py-20 md:py-28">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <Reveal>
          <Badge className="mb-4 h-auto border-amber-500/40 bg-amber-500/12 px-3 py-1 font-semibold tracking-[0.06em] text-amber-500 uppercase">
            Pro Feature
          </Badge>
          <SectionTitle>
            Let AI do the <GradientText>busywork</GradientText>
          </SectionTitle>
          <SectionLead>DevStash reads what you save and helps you organize and understand it.</SectionLead>
          <ul className="mt-8 grid gap-4">
            {AI_FEATURES.map((feature) => (
              <li key={feature.title} className="flex gap-3.5">
                <span className="mt-0.5 grid size-5.5 shrink-0 place-items-center rounded-full bg-green-500/14 text-green-500">
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
                <div className="grid">
                  <strong className="font-semibold">{feature.title}</strong>
                  <span className="text-[0.95rem] text-muted-foreground">{feature.description}</span>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal className="min-w-0">
          <div
            role="figure"
            aria-label="Code editor showing AI generated tags"
            className="overflow-hidden rounded-xl border bg-card shadow-[0_30px_80px_-30px_rgb(0_0_0/0.8)]"
          >
            <div className="flex items-center gap-2 border-b bg-muted px-4 py-3">
              {WINDOW_DOTS.map((color) => (
                <span key={color} className={`size-3 rounded-full ${color}`} />
              ))}
              <span className="ml-2 font-mono text-xs text-muted-foreground">
                {CODE_SAMPLE_FILE_NAME}
              </span>
            </div>
            <CodeSample />
            <div className="border-t px-5 pt-4 pb-5">
              <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-amber-500">
                <Sparkles className="size-3.5" aria-hidden="true" />
                AI Generated Tags
              </p>
              <AiTags />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
