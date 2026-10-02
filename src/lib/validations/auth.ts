import { z } from "zod";

const PASSWORD_MIN_LENGTH = 8;

const email = z.email("Enter a valid email address").trim().toLowerCase();

const newPassword = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(72, "Password must be at most 72 characters");

const passwordsMatch = (data: { password: string; confirmPassword: string }) =>
  data.password === data.confirmPassword;

const PASSWORDS_MISMATCH = {
  message: "Passwords do not match",
  path: ["confirmPassword"],
};

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
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
    currentPassword: z.string().min(1, "Current password is required"),
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
