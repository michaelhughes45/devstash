import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { sendVerificationEmail } from "@/lib/email-verification";
import { registerSchema } from "@/lib/validations/auth";

const BCRYPT_ROUNDS = 12;

interface RegisterResponse {
  success: boolean;
  data?: { id: string; name: string | null; email: string };
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

function respond(body: RegisterResponse, status: number) {
  return NextResponse.json(body, { status });
}

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
        fieldErrors: z.flattenError(parsed.error).fieldErrors,
      },
      400,
    );
  }

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
        password: await bcrypt.hash(password, BCRYPT_ROUNDS),
      },
      select: { id: true, name: true, email: true },
    });

    // The account exists either way; a failed send is logged rather than undoing it
    try {
      await sendVerificationEmail(user.email, new URL(request.url).origin);
    } catch (error) {
      console.error("Failed to send verification email", error);
    }

    return respond({ success: true, data: user }, 201);
  } catch (error) {
    // A concurrent registration can win the race between the lookup and the insert
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return emailTaken();
    }
    console.error("Registration failed", error);
    return respond({ success: false, error: "Registration failed" }, 500);
  }
}
