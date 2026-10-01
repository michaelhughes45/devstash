const DEFAULT_REDIRECT = "/dashboard";

// Only allow same-origin relative paths so a crafted link can't redirect off-site
export function safeCallbackUrl(value: unknown): string {
  if (typeof value !== "string") return DEFAULT_REDIRECT;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return DEFAULT_REDIRECT;
  }
  return value;
}
