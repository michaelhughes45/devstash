import { describe, expect, it } from "vitest";

import {
  changePasswordSchema,
  deleteAccountSchema,
  registerSchema,
  signInSchema,
} from "@/lib/validations/auth";

const validRegistration = {
  name: "Demo User",
  email: "Demo@DevStash.io",
  password: "password123",
  confirmPassword: "password123",
};

describe("registerSchema", () => {
  it("accepts valid input and lowercases the email", () => {
    const result = registerSchema.safeParse(validRegistration);
    expect(result.success).toBe(true);
    expect(result.data?.email).toBe("demo@devstash.io");
  });

  it("rejects mismatched passwords on confirmPassword", () => {
    const result = registerSchema.safeParse({
      ...validRegistration,
      confirmPassword: "different123",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]).toMatchObject({
      path: ["confirmPassword"],
      message: "Passwords do not match",
    });
  });

  it("rejects passwords shorter than 8 characters", () => {
    const result = registerSchema.safeParse({
      ...validRegistration,
      password: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
  });

  it("limits passwords to 72 bytes, not 72 characters", () => {
    // "é" is 2 bytes in UTF-8: 36 of them is 72 bytes, 37 is 74
    const atLimit = "é".repeat(36);
    const overLimit = "é".repeat(37);

    expect(
      registerSchema.safeParse({
        ...validRegistration,
        password: atLimit,
        confirmPassword: atLimit,
      }).success,
    ).toBe(true);

    const result = registerSchema.safeParse({
      ...validRegistration,
      password: overLimit,
      confirmPassword: overLimit,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Password is too long");
  });
});

describe("signInSchema", () => {
  it("allows existing passwords over 72 bytes", () => {
    const result = signInSchema.safeParse({
      email: "demo@devstash.io",
      password: "é".repeat(100),
    });
    expect(result.success).toBe(true);
  });
});

describe("changePasswordSchema", () => {
  it("requires the current password", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "",
      password: "password123",
      confirmPassword: "password123",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Current password is required");
  });
});

describe("deleteAccountSchema", () => {
  it("gives the required message when the field is missing", () => {
    const result = deleteAccountSchema.safeParse({ confirmation: null });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Confirmation is required");
  });

  it("keeps surrounding spaces", () => {
    const result = deleteAccountSchema.safeParse({ confirmation: "  secret  " });
    expect(result.data?.confirmation).toBe("  secret  ");
  });
});
