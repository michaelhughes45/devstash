import { createHash, randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";
import { EMAIL_FROM, resend } from "@/lib/resend";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export type VerifyEmailResult = "verified" | "invalid" | "expired";

// On unless explicitly disabled, so a missing or mistyped value never turns it off
export function isEmailVerificationEnabled() {
  return process.env.EMAIL_VERIFICATION_ENABLED !== "false";
}

// Only the hash is stored, so a leaked database row can't be used as a link
function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function createVerificationToken(email: string) {
  const token = randomBytes(32).toString("hex");

  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { identifier: email } }),
    prisma.verificationToken.create({
      data: {
        identifier: email,
        token: hashToken(token),
        expires: new Date(Date.now() + TOKEN_TTL_MS),
      },
    }),
  ]);

  return token;
}

export async function sendVerificationEmail(email: string, origin: string) {
  const token = await createVerificationToken(email);
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
  const record = await prisma.verificationToken.findFirst({
    where: { token: hashToken(token) },
  });
  if (!record) return "invalid";

  // Deleting first makes the token single-use even if two requests race
  const { count } = await prisma.verificationToken.deleteMany({
    where: { identifier: record.identifier, token: record.token },
  });
  if (count === 0) return "invalid";
  if (record.expires < new Date()) return "expired";

  // Any other outstanding links for this email are no longer needed
  const [{ count: updated }] = await prisma.$transaction([
    prisma.user.updateMany({
      where: { email: record.identifier },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.deleteMany({ where: { identifier: record.identifier } }),
  ]);
  return updated > 0 ? "verified" : "invalid";
}
