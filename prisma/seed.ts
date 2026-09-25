import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { ContentType } from "../src/generated/prisma/client";

const DEMO_USER = {
  email: "demo@devstash.io",
  name: "Demo User",
  password: "12345678",
};

const SYSTEM_TYPES = [
  { name: "snippet", icon: "Code", color: "#3b82f6" },
  { name: "prompt", icon: "Sparkles", color: "#8b5cf6" },
  { name: "command", icon: "Terminal", color: "#f97316" },
  { name: "note", icon: "StickyNote", color: "#fde047" },
  { name: "file", icon: "File", color: "#6b7280" },
  { name: "image", icon: "Image", color: "#ec4899" },
  { name: "link", icon: "Link", color: "#10b981" },
] as const;

type SystemTypeName = (typeof SYSTEM_TYPES)[number]["name"];

interface SeedItem {
  type: SystemTypeName;
  title: string;
  description: string;
  content?: string;
  language?: string;
  url?: string;
}

interface SeedCollection {
  name: string;
  description: string;
  items: SeedItem[];
}

const COLLECTIONS: SeedCollection[] = [
  {
    name: "React Patterns",
    description: "Reusable React patterns and hooks",
    items: [
      {
        type: "snippet",
        title: "useDebounce and useLocalStorage hooks",
        description: "Debounce a changing value and persist state to localStorage",
        language: "typescript",
        content: `import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : initialValue;
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}`,
      },
      {
        type: "snippet",
        title: "Context provider and compound components",
        description: "Typed context with a guard hook, used by a compound Tabs component",
        language: "typescript",
        content: `import { createContext, useContext, useState, type ReactNode } from "react";

interface TabsContextValue {
  active: string;
  setActive: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs() {
  const context = useContext(TabsContext);
  if (!context) throw new Error("Tabs components must be used inside <Tabs>");
  return context;
}

export function Tabs({ defaultValue, children }: { defaultValue: string; children: ReactNode }) {
  const [active, setActive] = useState(defaultValue);
  return <TabsContext.Provider value={{ active, setActive }}>{children}</TabsContext.Provider>;
}

Tabs.Trigger = function TabsTrigger({ value, children }: { value: string; children: ReactNode }) {
  const { active, setActive } = useTabs();
  return (
    <button aria-selected={active === value} onClick={() => setActive(value)}>
      {children}
    </button>
  );
};

Tabs.Panel = function TabsPanel({ value, children }: { value: string; children: ReactNode }) {
  const { active } = useTabs();
  return active === value ? <div>{children}</div> : null;
};`,
      },
      {
        type: "snippet",
        title: "cn and formatting utilities",
        description: "Class name merging plus date and byte formatting helpers",
        language: "typescript",
        content: `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatBytes(bytes: number) {
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return \`\${(bytes / 1024 ** index).toFixed(1)} \${units[index]}\`;
}`,
      },
    ],
  },
  {
    name: "AI Workflows",
    description: "AI prompts and workflow automations",
    items: [
      {
        type: "prompt",
        title: "Code review",
        description: "Thorough review focused on bugs, security and readability",
        content: `Review the following code as a senior engineer.

Focus on, in order:
1. Bugs and logic errors, including edge cases
2. Security issues (input validation, auth checks, injection)
3. Performance problems
4. Readability and naming

For each issue, give the line or snippet, explain why it matters, and suggest a fix.
Skip style nitpicks a linter would catch.

\`\`\`
{{code}}
\`\`\``,
      },
      {
        type: "prompt",
        title: "Generate documentation",
        description: "Write JSDoc comments and a README section for a module",
        content: `Write documentation for the module below.

- Add JSDoc comments to every exported function, type and component
- Describe parameters, return values and thrown errors
- Include one short usage example per export
- Then write a README section with a summary, installation steps and examples

Keep the wording plain and concise. Don't document private helpers.

\`\`\`
{{code}}
\`\`\``,
      },
      {
        type: "prompt",
        title: "Refactoring assistant",
        description: "Refactor code for clarity without changing behavior",
        content: `Refactor the code below to make it easier to read and maintain.

Rules:
- Keep the behavior and public API exactly the same
- Break up long functions and remove duplication
- Use clear names and remove dead code
- Match the existing style and conventions

First list the changes you plan to make and why, then show the refactored code.

\`\`\`
{{code}}
\`\`\``,
      },
    ],
  },
  {
    name: "DevOps",
    description: "Infrastructure and deployment resources",
    items: [
      {
        type: "snippet",
        title: "Next.js multi-stage Dockerfile",
        description: "Small production image using Next.js standalone output",
        language: "dockerfile",
        content: `FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]`,
      },
      {
        type: "command",
        title: "Deploy with migrations",
        description: "Apply pending Prisma migrations, then deploy to Vercel production",
        language: "bash",
        content: `npx prisma migrate deploy && vercel deploy --prod`,
      },
      {
        type: "link",
        title: "Docker documentation",
        description: "Official Docker docs: guides, manuals and reference",
        url: "https://docs.docker.com/",
      },
      {
        type: "link",
        title: "GitHub Actions documentation",
        description: "Workflows, syntax reference and CI/CD guides",
        url: "https://docs.github.com/en/actions",
      },
    ],
  },
  {
    name: "Terminal Commands",
    description: "Useful shell commands for everyday development",
    items: [
      {
        type: "command",
        title: "Undo last commit, keep changes",
        description: "Move HEAD back one commit and leave the changes staged",
        language: "bash",
        content: `git reset --soft HEAD~1`,
      },
      {
        type: "command",
        title: "Clean up Docker",
        description: "Remove stopped containers, unused images, networks and build cache",
        language: "bash",
        content: `docker system prune -a --volumes`,
      },
      {
        type: "command",
        title: "Kill process on a port",
        description: "Find and stop whatever is listening on port 3000",
        language: "bash",
        content: `lsof -ti :3000 | xargs kill -9`,
      },
      {
        type: "command",
        title: "Check for outdated packages",
        description: "List outdated dependencies, then update within semver ranges",
        language: "bash",
        content: `npm outdated && npm update`,
      },
    ],
  },
  {
    name: "Design Resources",
    description: "UI/UX resources and references",
    items: [
      {
        type: "link",
        title: "Tailwind CSS documentation",
        description: "Utility class reference and configuration for Tailwind CSS",
        url: "https://tailwindcss.com/docs",
      },
      {
        type: "link",
        title: "shadcn/ui",
        description: "Accessible components built on Radix UI and Tailwind",
        url: "https://ui.shadcn.com/",
      },
      {
        type: "link",
        title: "Material Design 3",
        description: "Google's design system: guidelines, components and tokens",
        url: "https://m3.material.io/",
      },
      {
        type: "link",
        title: "Lucide icons",
        description: "Open-source icon library used by shadcn/ui",
        url: "https://lucide.dev/icons/",
      },
    ],
  },
];

async function seedUser() {
  const password = await bcrypt.hash(DEMO_USER.password, 12);
  const data = { name: DEMO_USER.name, password, isPro: false, emailVerified: new Date() };

  return prisma.user.upsert({
    where: { email: DEMO_USER.email },
    update: data,
    create: { email: DEMO_USER.email, ...data },
  });
}

// System types have userId = null, which the [userId, name] unique key can't match on, so no upsert
async function seedSystemTypes() {
  const typeIds = {} as Record<SystemTypeName, string>;

  for (const { name, icon, color } of SYSTEM_TYPES) {
    const existing = await prisma.itemType.findFirst({
      where: { name, userId: null, isSystem: true },
    });
    const type = existing
      ? await prisma.itemType.update({ where: { id: existing.id }, data: { icon, color } })
      : await prisma.itemType.create({ data: { name, icon, color, isSystem: true } });
    typeIds[name] = type.id;
  }

  return typeIds;
}

async function seedCollections(userId: string, typeIds: Record<SystemTypeName, string>) {
  await prisma.item.deleteMany({ where: { userId } });
  await prisma.collection.deleteMany({ where: { userId } });

  for (const { name, description, items } of COLLECTIONS) {
    const collection = await prisma.collection.create({ data: { name, description, userId } });

    for (const { type, url, ...item } of items) {
      await prisma.item.create({
        data: {
          ...item,
          url,
          contentType: url ? ContentType.URL : ContentType.TEXT,
          userId,
          typeId: typeIds[type],
          collections: { create: { collectionId: collection.id } },
        },
      });
    }

    console.log(`✔ Collection "${name}" with ${items.length} items`);
  }
}

async function main() {
  const user = await seedUser();
  console.log(`✔ Demo user ${user.email}`);

  const typeIds = await seedSystemTypes();
  console.log(`✔ ${SYSTEM_TYPES.length} system item types`);

  await seedCollections(user.id, typeIds);
  console.log("\nSeed complete");
}

main()
  .catch((error) => {
    console.error("✘ Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
