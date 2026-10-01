import { NextResponse, type NextRequest } from "next/server";

import { verifyEmailToken } from "@/lib/email-verification";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const signInUrl = new URL("/sign-in", request.nextUrl.origin);

  try {
    const result = token ? await verifyEmailToken(token) : "invalid";
    if (result === "verified") {
      signInUrl.searchParams.set("verified", "1");
    } else {
      signInUrl.searchParams.set("verifyError", result);
    }
  } catch (error) {
    console.error("Email verification failed", error);
    signInUrl.searchParams.set("verifyError", "failed");
  }

  return NextResponse.redirect(signInUrl);
}
