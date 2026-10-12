"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { AI_TAGS } from "./content";

const FIRST_TAG_DELAY_MS = 600;
const TAG_INTERVAL_MS = 180;

// The tags pop in one at a time once the list is half in view. With reduced
// motion the hiding classes don't apply, so every tag shows straight away
export function AiTags() {
  const listRef = useRef<HTMLUListElement>(null);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const list = listRef.current;
    if (!list || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timers: number[] = [];
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        AI_TAGS.forEach((_, i) => {
          timers.push(
            window.setTimeout(() => setShown(i + 1), FIRST_TAG_DELAY_MS + i * TAG_INTERVAL_MS),
          );
        });
      },
      { threshold: 0.5 },
    );
    observer.observe(list);

    return () => {
      observer.disconnect();
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  return (
    <ul ref={listRef} className="flex flex-wrap gap-2">
      {AI_TAGS.map((tag, i) => (
        <li
          key={tag}
          className={cn(
            "rounded-full border border-indigo-500/35 bg-indigo-500/12 px-2.5 py-1 font-mono text-xs text-indigo-300",
            i < shown ? "motion-safe:animate-tag-pop" : "motion-safe:opacity-0",
          )}
        >
          {tag}
        </li>
      ))}
    </ul>
  );
}
