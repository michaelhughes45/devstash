import {
  Code,
  FileText,
  Folder,
  Search,
  Sparkles,
  Terminal,
  type LucideIcon,
} from "lucide-react";

// The app's seeded item type colors, so the homepage matches the sidebar and cards
export const TYPE_COLORS = {
  snippet: "#3b82f6",
  prompt: "#8b5cf6",
  command: "#f97316",
  note: "#fde047",
  file: "#6b7280",
  image: "#ec4899",
  link: "#10b981",
} as const;

// A link that points somewhere different once the visitor is signed in
export interface SessionHref {
  signedOut: string;
  signedIn: string;
}

export const START_HREF: SessionHref = { signedOut: "/register", signedIn: "/dashboard" };

export function resolveHref(href: string | SessionHref, signedIn: boolean): string {
  if (typeof href === "string") return href;
  return signedIn ? href.signedIn : href.signedOut;
}

export interface ChaosIconContent {
  icon: "notion" | "github" | "slack" | "vscode" | "browser" | "terminal" | "text-file" | "bookmark";
  label: string;
  color: string;
}

export const CHAOS_ICONS: ChaosIconContent[] = [
  { icon: "notion", label: "Notion", color: "#ffffff" },
  { icon: "github", label: "GitHub", color: "#e6edf3" },
  { icon: "slack", label: "Slack", color: "#e01e5a" },
  { icon: "vscode", label: "VS Code", color: "#3ea6f2" },
  { icon: "browser", label: "Browser tabs", color: "#f59e0b" },
  { icon: "terminal", label: "Terminal", color: "#22c55e" },
  { icon: "text-file", label: "Text file", color: "#94a3b8" },
  { icon: "bookmark", label: "Bookmark", color: "#6366f1" },
];

export interface MiniDashboardType {
  label: string;
  color: string;
}

export const MINI_DASHBOARD_TYPES: MiniDashboardType[] = [
  { label: "Snippets", color: TYPE_COLORS.snippet },
  { label: "Prompts", color: TYPE_COLORS.prompt },
  { label: "Commands", color: TYPE_COLORS.command },
  { label: "Notes", color: TYPE_COLORS.note },
  { label: "Links", color: TYPE_COLORS.link },
  { label: "Images", color: TYPE_COLORS.image },
  { label: "Files", color: TYPE_COLORS.file },
];

export const MINI_DASHBOARD_CARD_COLORS: string[] = [
  TYPE_COLORS.snippet,
  TYPE_COLORS.prompt,
  TYPE_COLORS.command,
  TYPE_COLORS.note,
  TYPE_COLORS.image,
  TYPE_COLORS.link,
];

export interface Feature {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

export const FEATURES: Feature[] = [
  {
    title: "Code Snippets",
    description:
      "Save reusable code with syntax highlighting in a VS Code-quality editor and copy it in one click.",
    icon: Code,
    color: TYPE_COLORS.snippet,
  },
  {
    title: "AI Prompts",
    description: "Keep your best prompts and context files out of chat history and ready to reuse.",
    icon: Sparkles,
    color: TYPE_COLORS.prompt,
  },
  {
    title: "Instant Search",
    description: "Find anything by title, content, tag or type from a ⌘K command palette.",
    icon: Search,
    color: TYPE_COLORS.link,
  },
  {
    title: "Commands",
    description:
      "Stop digging through bash history. Store the commands you always forget, with notes.",
    icon: Terminal,
    color: TYPE_COLORS.command,
  },
  {
    title: "Files & Docs",
    description: "With Pro, upload docs, configs and images, then preview or download them anywhere.",
    icon: FileText,
    color: TYPE_COLORS.file,
  },
  {
    title: "Collections",
    description: "Group mixed items into collections like “React Patterns” or “Interview Prep”.",
    icon: Folder,
    color: TYPE_COLORS.note,
  },
];

export interface AiFeature {
  title: string;
  description: string;
}

export const AI_FEATURES: AiFeature[] = [
  { title: "Auto-tagging", description: "Relevant tags suggested from your item's content" },
  { title: "AI summaries", description: "Short summaries for long notes and docs" },
  { title: "Explain code", description: "Plain-English explanations of any snippet" },
  { title: "Prompt optimizer", description: "Rewrites prompts to be clearer and more effective" },
];

export const AI_TAGS = ["react", "hooks", "typescript", "debounce", "performance"];

export const CODE_SAMPLE_FILE_NAME = "useDebounce.ts";

export type CodeTokenKind = "keyword" | "string" | "function" | "number";

// Plain text, or a highlighted token
export type CodeToken = string | { kind: CodeTokenKind; text: string };

const k = (text: string): CodeToken => ({ kind: "keyword", text });
const s = (text: string): CodeToken => ({ kind: "string", text });
const f = (text: string): CodeToken => ({ kind: "function", text });
const n = (text: string): CodeToken => ({ kind: "number", text });

export const CODE_SAMPLE: CodeToken[][] = [
  [k("import"), " { useEffect, useState } ", k("from"), " ", s('"react"'), ";"],
  [],
  [k("export function"), " ", f("useDebounce"), "<T>(value: T, delay = ", n("300"), ") {"],
  ["  ", k("const"), " [debounced, setDebounced] = ", f("useState"), "(value);"],
  [],
  ["  ", f("useEffect"), "(() => {"],
  ["    ", k("const"), " id = ", f("setTimeout"), "(() => ", f("setDebounced"), "(value), delay);"],
  ["    ", k("return"), " () => ", f("clearTimeout"), "(id);"],
  ["  }, [value, delay]);"],
  [],
  ["  ", k("return"), " debounced;"],
  ["}"],
];

export type BillingPeriod = "monthly" | "yearly";

export interface PlanPrice {
  amount: string;
  period: string;
  note?: string;
}

export interface Plan {
  name: string;
  description: string;
  prices: Record<BillingPeriod, PlanPrice>;
  features: string[];
  cta: { label: string; signedInLabel?: string; href: SessionHref };
  highlight?: string;
}

const FREE_PRICE: PlanPrice = { amount: "$0", period: "/forever" };

export const PLANS: Plan[] = [
  {
    name: "Free",
    description: "For getting your knowledge in one place.",
    prices: { monthly: FREE_PRICE, yearly: FREE_PRICE },
    features: [
      "50 items",
      "3 collections",
      "Snippets, prompts, commands, notes and links",
      "Basic search",
    ],
    cta: { label: "Get Started", signedInLabel: "Go to Dashboard", href: START_HREF },
  },
  {
    name: "Pro",
    description: "For developers who live in their stash.",
    prices: {
      monthly: { amount: "$8", period: "/month", note: "or $72 billed yearly" },
      yearly: { amount: "$72", period: "/year", note: "$6/month, billed yearly" },
    },
    features: [
      "Unlimited items and collections",
      "File and image uploads",
      "Custom item types",
      "AI auto-tagging, summaries, explain code and prompt optimizer",
      "Export to JSON / ZIP",
      "Priority support",
    ],
    cta: {
      label: "Upgrade to Pro",
      href: { signedOut: "/register", signedIn: "/upgrade" },
    },
    highlight: "Most Popular",
  },
];

export interface FooterLink {
  label: string;
  href: string;
  // Only shown when the visitor is (or isn't) signed in
  when?: "signedIn" | "signedOut";
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "AI", href: "#ai" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign In", href: "/sign-in", when: "signedOut" },
      { label: "Register", href: "/register", when: "signedOut" },
      { label: "Dashboard", href: "/dashboard", when: "signedIn" },
    ],
  },
];

export const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
];
