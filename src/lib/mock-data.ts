// Temporary mock data for the dashboard UI until the database is implemented.

export interface MockUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  isPro: boolean;
}

export interface MockItemType {
  id: string;
  name: string;
  slug: string;
  icon: string; // Lucide icon name
  color: string; // hex
  count: number;
}

export interface MockCollection {
  id: string;
  name: string;
  description: string;
  isFavorite: boolean;
  itemCount: number;
  typeIds: string[];
}

export interface MockItem {
  id: string;
  title: string;
  description: string;
  typeId: string;
  content?: string;
  language?: string;
  url?: string;
  fileName?: string;
  tags: string[];
  collectionIds: string[];
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: string;
  lastUsedAt: string;
}

export const currentUser: MockUser = {
  id: "user_1",
  name: "John Doe",
  email: "demo@devstash.io",
  image: null,
  isPro: true,
};

export const itemTypes: MockItemType[] = [
  { id: "type_snippet", name: "Snippets", slug: "snippets", icon: "Code", color: "#3b82f6", count: 24 },
  { id: "type_prompt", name: "Prompts", slug: "prompts", icon: "Sparkles", color: "#8b5cf6", count: 18 },
  { id: "type_command", name: "Commands", slug: "commands", icon: "Terminal", color: "#f97316", count: 15 },
  { id: "type_note", name: "Notes", slug: "notes", icon: "StickyNote", color: "#fde047", count: 12 },
  { id: "type_file", name: "Files", slug: "files", icon: "File", color: "#6b7280", count: 5 },
  { id: "type_image", name: "Images", slug: "images", icon: "Image", color: "#ec4899", count: 3 },
  { id: "type_url", name: "Links", slug: "links", icon: "Link", color: "#10b981", count: 8 },
];

export const collections: MockCollection[] = [
  {
    id: "col_react",
    name: "React Patterns",
    description: "Common React patterns and hooks",
    isFavorite: true,
    itemCount: 12,
    typeIds: ["type_snippet", "type_note", "type_url"],
  },
  {
    id: "col_python",
    name: "Python Snippets",
    description: "Useful Python code snippets",
    isFavorite: false,
    itemCount: 8,
    typeIds: ["type_snippet", "type_note"],
  },
  {
    id: "col_context",
    name: "Context Files",
    description: "AI context files for projects",
    isFavorite: true,
    itemCount: 5,
    typeIds: ["type_file", "type_note"],
  },
  {
    id: "col_interview",
    name: "Interview Prep",
    description: "Technical interview preparation",
    isFavorite: false,
    itemCount: 24,
    typeIds: ["type_note", "type_snippet", "type_url", "type_prompt"],
  },
  {
    id: "col_git",
    name: "Git Commands",
    description: "Frequently used git commands",
    isFavorite: true,
    itemCount: 15,
    typeIds: ["type_command", "type_note"],
  },
  {
    id: "col_ai",
    name: "AI Prompts",
    description: "Curated AI prompts for coding",
    isFavorite: false,
    itemCount: 18,
    typeIds: ["type_prompt", "type_snippet", "type_note"],
  },
];

export const items: MockItem[] = [
  {
    id: "item_1",
    title: "useAuth Hook",
    description: "Custom authentication hook for React applications",
    typeId: "type_snippet",
    language: "typescript",
    content: `export function useAuth() {
  const { data: session, status } = useSession();
  return { user: session?.user, isLoading: status === "loading" };
}`,
    tags: ["react", "auth", "hooks"],
    collectionIds: ["col_react"],
    isFavorite: true,
    isPinned: true,
    createdAt: "2026-01-15T10:00:00.000Z",
    lastUsedAt: "2026-01-20T09:30:00.000Z",
  },
  {
    id: "item_2",
    title: "API Error Handling Pattern",
    description: "Fetch wrapper with exponential backoff retry logic",
    typeId: "type_snippet",
    language: "typescript",
    content: `async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url);
    if (res.ok) return res;
    await new Promise((r) => setTimeout(r, 2 ** i * 1000));
  }
  throw new Error("Request failed");
}`,
    tags: ["api", "fetch", "error-handling"],
    collectionIds: ["col_react", "col_interview"],
    isFavorite: false,
    isPinned: true,
    createdAt: "2026-01-12T14:00:00.000Z",
    lastUsedAt: "2026-01-19T16:00:00.000Z",
  },
  {
    id: "item_3",
    title: "Code Review Prompt",
    description: "Thorough code review focusing on bugs and security",
    typeId: "type_prompt",
    content:
      "Review the following code for bugs, security issues and performance problems. Suggest concrete fixes.",
    tags: ["ai", "code-review"],
    collectionIds: ["col_ai"],
    isFavorite: true,
    isPinned: false,
    createdAt: "2026-01-10T09:00:00.000Z",
    lastUsedAt: "2026-01-18T11:00:00.000Z",
  },
  {
    id: "item_4",
    title: "Undo Last Commit",
    description: "Undo the last commit but keep the changes staged",
    typeId: "type_command",
    language: "bash",
    content: "git reset --soft HEAD~1",
    tags: ["git"],
    collectionIds: ["col_git"],
    isFavorite: false,
    isPinned: false,
    createdAt: "2026-01-08T12:00:00.000Z",
    lastUsedAt: "2026-01-17T08:45:00.000Z",
  },
  {
    id: "item_5",
    title: "List Comprehension Examples",
    description: "Common Python list comprehension patterns",
    typeId: "type_snippet",
    language: "python",
    content: `squares = [x ** 2 for x in range(10)]
evens = [x for x in nums if x % 2 == 0]`,
    tags: ["python", "lists"],
    collectionIds: ["col_python"],
    isFavorite: false,
    isPinned: false,
    createdAt: "2026-01-06T15:00:00.000Z",
    lastUsedAt: "2026-01-16T13:20:00.000Z",
  },
  {
    id: "item_6",
    title: "System Design Notes",
    description: "Key concepts for system design interviews",
    typeId: "type_note",
    content: "## Scaling\n- Load balancers\n- Caching layers\n- Database sharding",
    tags: ["interview", "system-design"],
    collectionIds: ["col_interview"],
    isFavorite: false,
    isPinned: false,
    createdAt: "2026-01-05T10:00:00.000Z",
    lastUsedAt: "2026-01-15T10:00:00.000Z",
  },
  {
    id: "item_7",
    title: "Project CLAUDE.md",
    description: "Base AI context file for new projects",
    typeId: "type_file",
    fileName: "CLAUDE.md",
    tags: ["ai", "context"],
    collectionIds: ["col_context"],
    isFavorite: false,
    isPinned: false,
    createdAt: "2026-01-04T09:00:00.000Z",
    lastUsedAt: "2026-01-14T17:00:00.000Z",
  },
  {
    id: "item_8",
    title: "React Docs",
    description: "Official React documentation",
    typeId: "type_url",
    url: "https://react.dev",
    tags: ["react", "docs"],
    collectionIds: ["col_react", "col_interview"],
    isFavorite: false,
    isPinned: false,
    createdAt: "2026-01-03T09:00:00.000Z",
    lastUsedAt: "2026-01-13T12:00:00.000Z",
  },
];

export function getItemTypeById(typeId: string): MockItemType | undefined {
  return itemTypes.find((type) => type.id === typeId);
}

// Most recent use of any item in the collection, as a timestamp.
export function getCollectionLastUsedAt(collectionId: string): number {
  return Math.max(
    0,
    ...items
      .filter((item) => item.collectionIds.includes(collectionId))
      .map((item) => Date.parse(item.lastUsedAt)),
  );
}
