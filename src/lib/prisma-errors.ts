import { Prisma } from "@/generated/prisma/client";

// True for a unique constraint failure, e.g. createItem with a fileUrl another
// item already has, or two registrations racing for one email
export function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

// True when an update or delete matched no row, e.g. a missing or someone else's item
export function isRecordNotFound(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
}
