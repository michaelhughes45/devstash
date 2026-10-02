import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { EMAIL_FROM, resend } from "@/lib/resend";
import {
  checkToken,
  consumeToken,
  issueToken,
  PASSWORD_RESET_PREFIX,
  type TokenStatus,
} from "@/lib/tokens";

const TOKEN_TTL_MS = 60 * 60 * 1000;

const RESET_IDENTIFIER = { startsWith: PASSWORD_RESET_PREFIX };

export type ResetPasswordResult = "reset" | "invalid" | "expired";

export const RESET_LINK_ERRORS: Record<"invalid" | "expired", string> = {
  invalid: "This reset link is invalid or has already been used.",
  expired: "This reset link has expired.",
};

// Silently does nothing for unknown or OAuth-only emails so callers can't tell them apart
export async function sendPasswordResetEmail(email: string, origin: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { password: true },
  });
  if (!user?.password) return;

  const token = await issueToken(`${PASSWORD_RESET_PREFIX}${email}`, TOKEN_TTL_MS);
  const url = new URL("/reset-password", origin);
  url.searchParams.set("token", token);

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: "Reset your DevStash password",
    html: `
      <p>We received a request to reset your DevStash password.</p>
      <p><a href="${url}">Choose a new password</a></p>
      <p>This link expires in 1 hour. If you didn't ask to reset your password, you can ignore this email.</p>
    `,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
}

export function checkPasswordResetToken(token: string): Promise<TokenStatus> {
  return checkToken(token, RESET_IDENTIFIER);
}

export async function resetPassword(
  token: string,
  password: string,
): Promise<ResetPasswordResult> {
  // Hashed up front so the token is used and the password saved back to back
  const passwordHash = await hashPassword(password);

  const result = await consumeToken(token, RESET_IDENTIFIER);
  if (result.status !== "valid") return result.status;

  const email = result.identifier.slice(PASSWORD_RESET_PREFIX.length);
  // Following the emailed link proves the user owns the inbox, so it also verifies it
  const [{ count: updated }] = await prisma.$transaction([
    prisma.user.updateMany({ where: { email }, data: { password: passwordHash } }),
    prisma.user.updateMany({
      where: { email, emailVerified: null },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.deleteMany({
      where: { identifier: { in: [email, result.identifier] } },
    }),
  ]);
  return updated > 0 ? "reset" : "invalid";
}
