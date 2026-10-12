import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Reveal } from "./Reveal";

export function GradientText({ children }: { children: ReactNode }) {
  return (
    <span className="bg-linear-to-r from-blue-500 to-violet-600 bg-clip-text text-transparent">
      {children}
    </span>
  );
}

export function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 text-xs font-semibold tracking-[0.12em] text-blue-500 uppercase">
      {children}
    </p>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[clamp(1.9rem,4vw,2.6rem)] leading-[1.15] font-bold tracking-tight">
      {children}
    </h2>
  );
}

export function SectionLead({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("mt-4 text-[1.05rem] text-muted-foreground", className)}>{children}</p>;
}

interface SectionHeaderProps {
  eyebrow: string;
  title: ReactNode;
  lead: string;
}

export function SectionHeader({ eyebrow, title, lead }: SectionHeaderProps) {
  return (
    <Reveal className="mx-auto mb-14 max-w-2xl text-center">
      <SectionEyebrow>{eyebrow}</SectionEyebrow>
      <SectionTitle>{title}</SectionTitle>
      <SectionLead>{lead}</SectionLead>
    </Reveal>
  );
}
