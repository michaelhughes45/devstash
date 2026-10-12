"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { AppWindow, Bookmark, FileText, Terminal } from "lucide-react";

import {
  clampIcon,
  createIcons,
  iconTransform,
  stepIcon,
  type ChaosBounds,
  type ChaosPoint,
} from "@/lib/chaos-physics";

import { CHAOS_ICONS, type ChaosIconContent } from "./content";

// Brand icons aren't in lucide-react, so these keep the prototype's SVGs
function NotionIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="3" width="17" height="18" rx="2.5" />
      <path d="M8.5 16.5V8l7 8.5V7.5" strokeLinejoin="round" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.6 9.6 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.93.36.31.68.92.68 1.85v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2z" />
    </svg>
  );
}

function SlackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="3" strokeLinecap="round">
      <path stroke="#36c5f0" d="M9.5 3.5v7M3.5 9.5h6" />
      <path stroke="#2eb67d" d="M14.5 3.5v6M14.5 9.5h6" />
      <path stroke="#ecb22e" d="M14.5 14.5h6M14.5 14.5v6" />
      <path stroke="#e01e5a" d="M3.5 14.5h6M9.5 14.5v6" />
    </svg>
  );
}

function VsCodeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.2 2.2 9.3 9.4 4.6 5.8 2.8 6.7v10.6l1.8.9 4.7-3.6 7.9 7.2 4-1.9V4.1l-4-1.9zM4.9 14.7V9.3l2.7 2.7-2.7 2.7zm12.2 1.6-5-4.3 5-4.3v8.6z" />
    </svg>
  );
}

const ICONS: Record<ChaosIconContent["icon"], () => ReactNode> = {
  notion: NotionIcon,
  github: GitHubIcon,
  slack: SlackIcon,
  vscode: VsCodeIcon,
  browser: () => <AppWindow />,
  terminal: () => <Terminal />,
  "text-file": () => <FileText />,
  bookmark: () => <Bookmark />,
};

function measure(area: HTMLElement): ChaosBounds {
  return { width: area.clientWidth, height: area.clientHeight };
}

export function ChaosIcons() {
  const areaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const area = areaRef.current;
    if (!area) return;

    const elements = Array.from(area.querySelectorAll<HTMLElement>("[data-chaos-icon]"));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let bounds = measure(area);
    let icons = createIcons(elements.length, bounds);
    let pointer: ChaosPoint | null = null;
    let frame: number | null = null;
    let onScreen = true;

    const render = (time: number) => {
      elements.forEach((element, i) => {
        element.style.transform = iconTransform(icons[i], time);
      });
    };

    const tick = (time: number) => {
      icons = icons.map((icon) => stepIcon(icon, bounds, pointer));
      render(time);
      frame = requestAnimationFrame(tick);
    };

    const stop = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
    };

    const start = () => {
      if (frame === null && onScreen && !reducedMotion.matches) {
        frame = requestAnimationFrame(tick);
      }
    };

    const onReducedMotionChange = () => (reducedMotion.matches ? stop() : start());

    const onPointerMove = (event: PointerEvent) => {
      const rect = area.getBoundingClientRect();
      pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    const onPointerLeave = () => {
      pointer = null;
    };

    const resizeObserver = new ResizeObserver(() => {
      bounds = measure(area);
      icons = icons.map((icon) => clampIcon(icon, bounds));
      render(performance.now());
    });

    // Pause while the area is off screen
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen) start();
      else stop();
    });

    area.addEventListener("pointermove", onPointerMove);
    area.addEventListener("pointerleave", onPointerLeave);
    reducedMotion.addEventListener("change", onReducedMotionChange);
    resizeObserver.observe(area);
    visibilityObserver.observe(area);

    render(0);
    area.dataset.ready = "";
    start();

    return () => {
      stop();
      area.removeEventListener("pointermove", onPointerMove);
      area.removeEventListener("pointerleave", onPointerLeave);
      reducedMotion.removeEventListener("change", onReducedMotionChange);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
    };
  }, []);

  return (
    <div
      ref={areaRef}
      className="group/chaos relative h-65 overflow-hidden rounded-lg border border-dashed bg-background bg-[radial-gradient(circle_at_1px_1px,rgb(255_255_255/0.05)_1px,transparent_0)] bg-size-[20px_20px] md:h-75"
    >
      {CHAOS_ICONS.map((item) => {
        const Icon = ICONS[item.icon];
        return (
          <div
            key={item.icon}
            data-chaos-icon
            role="img"
            aria-label={item.label}
            title={item.label}
            style={{ "--type-color": item.color } as CSSProperties}
            // Hidden until the first positions are written, so they don't flash stacked in a corner
            className="absolute top-0 left-0 grid size-13 place-items-center rounded-xl border bg-muted text-(--type-color) opacity-0 shadow-[0_6px_18px_-6px_rgb(0_0_0/0.7)] transition-opacity will-change-transform group-data-[ready]/chaos:opacity-100 [&_svg]:size-6.5"
          >
            <Icon />
          </div>
        );
      })}
    </div>
  );
}
