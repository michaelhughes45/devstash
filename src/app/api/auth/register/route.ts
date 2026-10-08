import { jsonResponse, rateLimitedResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { isUniqueViolation } from "@/lib/prisma-errors";
import {
  isEmailVerificationEnabled,
  sendVerificationEmail,
} from "@/lib/email-verification";
import { hashPassword } from "@/lib/password";
import { checkRateLimit, rateLimitKey } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validations/auth";
import { fieldErrorsOf } from "@/lib/validations/field-errors";
import type { FieldErrors } from "@/types/forms";

interface RegisterResponse {
  success: boolean;
  data?: { id: string; name: string | null; email: string };
  error?: string;
  fieldErrors?: FieldErrors;
}

const respond = jsonResponse<RegisterResponse>;

function emailTaken() {
  return respond(
    { success: false, error: "An account with this email already exists" },
    409,
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return respond({ success: false, error: "Invalid JSON body" }, 400);
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return respond(
      {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
        fieldErrors: fieldErrorsOf(parsed.error),
      },
      400,
    );
  }

  const limit = await checkRateLimit("register", rateLimitKey(request.headers));
  if (!limit.success) return rateLimitedResponse(limit.reset);

  const { name, email, password } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) return emailTaken();

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: await hashPassword(password),
      },
      select: { id: true, name: true, email: true },
    });

    // The account exists either way; a failed send is logged rather than undoing it
    if (isEmailVerificationEnabled()) {
      try {
        await sendVerificationEmail(user.email);
      } catch (error) {
        console.error("Failed to send verification email", error);
      }
    }

    return respond({ success: true, data: user }, 201);
  } catch (error) {
    // A concurrent registration can win the race between the lookup and the insert
    if (isUniqueViolation(error)) return emailTaken();
    console.error("Registration failed", error);
    return respond({ success: false, error: "Registration failed" }, 500);
  }
}
