import Link from "next/link";
import { Layers } from "lucide-react";

import { cn } from "@/lib/utils";

interface LogoProps {
  href: string;
  className?: string;
}

export function Logo({ href, className }: LogoProps) {
  return (
    <Link
      href={href}
      aria-label="DevStash home"
      className={cn("flex w-fit items-center gap-2", className)}
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-violet-600 text-white">
        <Layers className="size-4" />
      </span>
      <span className="text-lg font-semibold">DevStash</span>
    </Link>
  );
}
