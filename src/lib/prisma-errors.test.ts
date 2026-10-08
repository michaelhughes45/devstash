import { describe, expect, it } from "vitest";

import { Prisma } from "@/generated/prisma/client";
import { isRecordNotFound, isUniqueViolation } from "@/lib/prisma-errors";

const error = (code: string) =>
  new Prisma.PrismaClientKnownRequestError("failed", { code, clientVersion: "test" });

describe("isUniqueViolation", () => {
  it("is true only for Prisma's unique constraint error", () => {
    expect(isUniqueViolation(error("P2002"))).toBe(true);
    expect(isUniqueViolation(error("P2025"))).toBe(false);
    expect(isUniqueViolation(new Error("P2002"))).toBe(false);
  });
});

describe("isRecordNotFound", () => {
  it("is true only for Prisma's record not found error", () => {
    expect(isRecordNotFound(error("P2025"))).toBe(true);
    expect(isRecordNotFound(error("P2002"))).toBe(false);
    expect(isRecordNotFound(new Error("P2025"))).toBe(false);
  });
});
