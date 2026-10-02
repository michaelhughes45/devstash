import { z } from "zod";

const PASSWORD_MIN_LENGTH = 8;
// bcrypt ignores everything past 72 bytes, and multi-byte characters count more than once
const PASSWORD_MAX_BYTES = 72;
// Existing passwords skip the byte rule so older, longer ones still work, but stay bounded
const EXISTING_PASSWORD_MAX_LENGTH = 256;

const email = z.email("Enter a valid email address").trim().toLowerCase();

const newPassword = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .refine(
    (value) => new TextEncoder().encode(value).length <= PASSWORD_MAX_BYTES,
    "Password is too long",
  );

const existingPassword = (requiredMessage: string) =>
  z.string().min(1, requiredMessage).max(EXISTING_PASSWORD_MAX_LENGTH, "Password is too long");

const passwordsMatch = (data: { password: string; confirmPassword: string }) =>
  data.password === data.confirmPassword;

const PASSWORDS_MISMATCH = {
  message: "Passwords do not match",
  path: ["confirmPassword"],
};

export const signInSchema = z.object({
  email,
  password: existingPassword("Password is required"),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(100),
    email,
    password: newPassword,
    confirmPassword: z.string(),
  })
  .refine(passwordsMatch, PASSWORDS_MISMATCH);

export const forgotPasswordSchema = z.object({ email });

export const changePasswordSchema = z
  .object({
    currentPassword: existingPassword("Current password is required"),
    password: newPassword,
    confirmPassword: z.string(),
  })
  .refine(passwordsMatch, PASSWORDS_MISMATCH);

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset link is invalid"),
    password: newPassword,
    confirmPassword: z.string(),
  })
  .refine(passwordsMatch, PASSWORDS_MISMATCH);
