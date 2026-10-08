import { NextResponse } from "next/server";

import { rateLimitMessage, retryAfterSeconds } from "@/lib/rate-limit";

// JSON body with a status; the type parameter keeps each route's response shape checked
export function jsonResponse<T>(body: T, status: number) {
  return NextResponse.json(body, { status });
}

// 429 with the shared rate-limit message and a Retry-After header
export function rateLimitedResponse(reset: number) {
  return NextResponse.json(
    { success: false, error: rateLimitMessage(reset) },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds(reset)) } },
  );
}
