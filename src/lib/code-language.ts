// Monaco language ids the editor highlights; anything else shows as plain text
const MONACO_LANGUAGES = new Set([
  "c",
  "cpp",
  "csharp",
  "css",
  "dockerfile",
  "go",
  "graphql",
  "html",
  "ini",
  "java",
  "javascript",
  "json",
  "kotlin",
  "less",
  "lua",
  "markdown",
  "php",
  "plaintext",
  "powershell",
  "python",
  "r",
  "ruby",
  "rust",
  "scss",
  "shell",
  "sql",
  "swift",
  "typescript",
  "xml",
  "yaml",
]);

// Common names and file extensions people type for a language
const LANGUAGE_ALIASES: Record<string, string> = {
  bash: "shell",
  sh: "shell",
  zsh: "shell",
  ps1: "powershell",
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  node: "javascript",
  ts: "typescript",
  tsx: "typescript",
  py: "python",
  rb: "ruby",
  rs: "rust",
  golang: "go",
  "c++": "cpp",
  "c#": "csharp",
  cs: "csharp",
  kt: "kotlin",
  yml: "yaml",
  md: "markdown",
  docker: "dockerfile",
  text: "plaintext",
  txt: "plaintext",
  plain: "plaintext",
};

// Maps an item's free-text language (e.g. "TS", "bash") to a Monaco language id
export function toMonacoLanguage(language: string | null | undefined): string {
  const name = language?.trim().toLowerCase();
  if (!name) return "plaintext";
  const id = LANGUAGE_ALIASES[name] ?? name;
  return MONACO_LANGUAGES.has(id) ? id : "plaintext";
}
