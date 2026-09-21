import { NextResponse } from "next/server";

import bcrypt from "bcrypt";

import { prisma } from "@/lib/prisma";

import { setAdminSessionCookie } from "@/lib/auth";

const MAX_EMAIL_LENGTH = 50;

const MAX_PASSWORD_LENGTH = 50;

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json(
        {
          error: "Invalid request.",
        },
        {
          status: 400,
        },
      );
    }

    const { email, password } = body as {
      email?: unknown;
      password?: unknown;
    };

    /*
     * Email and password are required for all logins.
     */

    if (typeof password !== "string") {
      return NextResponse.json(
        {
          error: "Password is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!password || password.length > MAX_PASSWORD_LENGTH) {
      return NextResponse.json(
        {
          error: "Invalid email or password.",
        },
        {
          status: 401,
        },
      );
    }

    /*
     * =========================================================
     * NORMAL EMAIL + PASSWORD LOGIN
     * =========================================================
     */

    if (typeof email !== "string") {
      return NextResponse.json(
        {
          error: "Email and password are required.",
        },
        {
          status: 400,
        },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (
      !normalizedEmail ||
      normalizedEmail.length > MAX_EMAIL_LENGTH ||
      !isValidEmail(normalizedEmail)
    ) {
      return NextResponse.json(
        {
          error: "Invalid email or password.",
        },
        {
          status: 401,
        },
      );
    }

    const user = await prisma.adminUser.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        {
          error: "Invalid email or password.",
        },
        {
          status: 401,
        },
      );
    }

    if (user.role !== "OWNER" && user.role !== "EDITOR") {
      return NextResponse.json(
        {
          error: "Invalid account configuration.",
        },
        {
          status: 403,
        },
      );
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return NextResponse.json(
        {
          error: "Invalid email or password.",
        },
        {
          status: 401,
        },
      );
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    setAdminSessionCookie(response, {
      id: user.id,
      email: user.email,
      role: user.role as "OWNER" | "EDITOR",
    });

    return response;
  } catch (error) {
    console.error("POST /api/auth/login error:", error);

    return NextResponse.json(
      {
        error: "Unable to sign in.",
      },
      {
        status: 500,
      },
    );
  }
}
