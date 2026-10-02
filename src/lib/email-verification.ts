import { prisma } from "@/lib/prisma";
import { EMAIL_FROM, resend } from "@/lib/resend";
import { consumeToken, issueToken, PASSWORD_RESET_PREFIX } from "@/lib/tokens";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

// Verification tokens use the plain email; password reset tokens must never verify an email
const VERIFICATION_IDENTIFIER = { not: { startsWith: PASSWORD_RESET_PREFIX } };

export type VerifyEmailResult = "verified" | "invalid" | "expired";

// On unless explicitly disabled, so a missing or mistyped value never turns it off
export function isEmailVerificationEnabled() {
  return process.env.EMAIL_VERIFICATION_ENABLED !== "false";
}

export async function sendVerificationEmail(email: string, origin: string) {
  const token = await issueToken(email, TOKEN_TTL_MS);
  const url = new URL("/api/auth/verify-email", origin);
  url.searchParams.set("token", token);

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: "Verify your DevStash email",
    html: `
      <p>Welcome to DevStash!</p>
      <p>Confirm your email address to finish setting up your account:</p>
      <p><a href="${url}">Verify email</a></p>
      <p>This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>
    `,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
}

export async function verifyEmailToken(token: string): Promise<VerifyEmailResult> {
  const result = await consumeToken(token, VERIFICATION_IDENTIFIER);
  if (result.status !== "valid") return result.status;

  // Any other outstanding links for this email are no longer needed
  const [{ count: updated }] = await prisma.$transaction([
    prisma.user.updateMany({
      where: { email: result.identifier },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.deleteMany({ where: { identifier: result.identifier } }),
  ]);
  return updated > 0 ? "verified" : "invalid";
}
