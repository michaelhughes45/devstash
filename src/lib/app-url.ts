// Links in emails use the configured base URL, never request headers an attacker can set
export function appUrl(path: string) {
  const base = process.env.APP_URL;
  if (!base) throw new Error("APP_URL is not set");
  return new URL(path, base);
}
