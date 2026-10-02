import { createHash, randomBytes } from "node:crypto";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

// Reset tokens share the VerificationToken table, so their identifier is namespaced
export const PASSWORD_RESET_PREFIX = "password-reset:";

type IdentifierFilter = Prisma.VerificationTokenWhereInput["identifier"];

export type TokenStatus = "valid" | "invalid" | "expired";

// Only the hash is stored, so a leaked database row can't be used as a link
function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

// Replaces any earlier token for the identifier and returns the raw token for the link
export async function issueToken(identifier: string, ttlMs: number) {
  const token = randomBytes(32).toString("hex");

  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { identifier } }),
    prisma.verificationToken.create({
      data: {
        identifier,
        token: hashToken(token),
        expires: new Date(Date.now() + ttlMs),
      },
    }),
  ]);

  return token;
}

function findToken(token: string, identifier: IdentifierFilter) {
  return prisma.verificationToken.findFirst({
    where: { token: hashToken(token), identifier },
  });
}

// Read-only check, so loading a page with the link doesn't use it up
export async function checkToken(
  token: string,
  identifier: IdentifierFilter,
): Promise<TokenStatus> {
  const record = await findToken(token, identifier);
  if (!record) return "invalid";
  return record.expires < new Date() ? "expired" : "valid";
}

export async function consumeToken(
  token: string,
  identifier: IdentifierFilter,
): Promise<{ status: "valid"; identifier: string } | { status: "invalid" | "expired" }> {
  const record = await findToken(token, identifier);
  if (!record) return { status: "invalid" };

  // Deleting first makes the token single-use even if two requests race
  const { count } = await prisma.verificationToken.deleteMany({
    where: { identifier: record.identifier, token: record.token },
  });
  if (count === 0) return { status: "invalid" };
  if (record.expires < new Date()) return { status: "expired" };

  return { status: "valid", identifier: record.identifier };
}
