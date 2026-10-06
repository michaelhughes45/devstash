import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const RATE_LIMITS = {
  signIn: { limit: 5, window: "15 m" },
  register: { limit: 3, window: "1 h" },
  forgotPassword: { limit: 3, window: "1 h" },
  resetPassword: { limit: 5, window: "15 m" },
  resendVerification: { limit: 3, window: "15 m" },
  // Per user; keeps one account from filling the R2 bucket
  upload: { limit: 20, window: "1 h" },
} satisfies Record<string, { limit: number; window: Duration }>;

export type RateLimitName = keyof typeof RATE_LIMITS;

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  // Unix time in milliseconds when the window resets
  reset: number;
}

// Give up on Upstash quickly and allow the request, so an outage doesn't stall sign-in
const UPSTASH_TIMEOUT_MS = 1000;

const ALLOWED: RateLimitResult = { success: true, remaining: 0, reset: 0 };

function createLimiters() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    console.warn("Upstash is not configured; rate limiting is disabled");
    return null;
  }

  const redis = new Redis({ url, token });
  const entries = Object.entries(RATE_LIMITS).map(([name, { limit, window }]) => [
    name,
    new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, window),
      prefix: `ratelimit:${name}`,
      timeout: UPSTASH_TIMEOUT_MS,
    }),
  ]);
  return Object.fromEntries(entries) as Record<RateLimitName, Ratelimit>;
}

// Created on first use; null (not undefined) once Upstash is known to be unconfigured
let limiters: ReturnType<typeof createLimiters> | undefined;

// Fails open: allows the request if Upstash isn't configured or can't be reached
export async function checkRateLimit(
  name: RateLimitName,
  identifier: string,
): Promise<RateLimitResult> {
  if (limiters === undefined) limiters = createLimiters();
  if (!limiters) return ALLOWED;

  try {
    const { success, remaining, reset } = await limiters[name].limit(identifier);
    return { success, remaining, reset };
  } catch (error) {
    console.error(`Rate limit check failed (${name})`, error);
    return ALLOWED;
  }
}

// Vercel sets x-forwarded-for to the client IP first; fall back for other hosts and local dev
function getClientIp(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}

export function rateLimitKey(headers: Headers, email?: string) {
  const ip = getClientIp(headers);
  return email ? `${ip}:${email.toLowerCase()}` : ip;
}

export function retryAfterSeconds(reset: number) {
  return Math.max(1, Math.ceil((reset - Date.now()) / 1000));
}

export function rateLimitMessage(reset: number) {
  const minutes = Math.ceil(retryAfterSeconds(reset) / 60);
  return `Too many attempts. Please try again in ${minutes} ${minutes === 1 ? "minute" : "minutes"}.`;
}
