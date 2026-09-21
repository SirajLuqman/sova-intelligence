import { NextResponse } from "next/server";

import bcrypt from "bcrypt";

import { prisma } from "@/lib/prisma";

import { getAdminSession } from "@/lib/auth";

const MAX_NAME_LENGTH = 60;
const MAX_EMAIL_LENGTH = 50;
const MAX_PASSWORD_LENGTH = 50;
const MIN_PASSWORD_LENGTH = 8;

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/* =========================================================
   GET — LOAD ADMIN + EDITOR ACCOUNTS
========================================================= */

export async function GET() {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        {
          error: "Authentication required.",
        },
        {
          status: 401,
        },
      );
    }

    if (session.role !== "OWNER") {
      return NextResponse.json(
        {
          error: "Admin access required.",
        },
        {
          status: 403,
        },
      );
    }

    const accounts = await prisma.adminUser.findMany({
      where: {
        role: {
          in: ["OWNER", "EDITOR"],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      accounts,
    });
  } catch (error) {
    console.error("GET /api/auth/accounts error:", error);

    return NextResponse.json(
      {
        error: "Unable to load accounts.",
      },
      {
        status: 500,
      },
    );
  }
}

/* =========================================================
   PUT — UPDATE ADMIN OR EDITOR ACCOUNT
========================================================= */

export async function PUT(request: Request) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        {
          error: "Authentication required.",
        },
        {
          status: 401,
        },
      );
    }

    if (session.role !== "OWNER") {
      return NextResponse.json(
        {
          error: "Admin access required.",
        },
        {
          status: 403,
        },
      );
    }

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

    const { id, name, email, password } = body as {
      id?: unknown;
      name?: unknown;
      email?: unknown;
      password?: unknown;
    };

    /* =====================================================
       BASIC VALIDATION
    ===================================================== */

    if (typeof id !== "number" || !Number.isInteger(id)) {
      return NextResponse.json(
        {
          error: "Invalid account.",
        },
        {
          status: 400,
        },
      );
    }

    if (typeof name !== "string") {
      return NextResponse.json(
        {
          error: "Name is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (typeof email !== "string") {
      return NextResponse.json(
        {
          error: "Email is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (typeof password !== "string") {
      return NextResponse.json(
        {
          error: "Invalid password.",
        },
        {
          status: 400,
        },
      );
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedName || normalizedName.length > MAX_NAME_LENGTH) {
      return NextResponse.json(
        {
          error: "Invalid name.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !normalizedEmail ||
      normalizedEmail.length > MAX_EMAIL_LENGTH ||
      !isValidEmail(normalizedEmail)
    ) {
      return NextResponse.json(
        {
          error: "Invalid email address.",
        },
        {
          status: 400,
        },
      );
    }

    if (password.length > MAX_PASSWORD_LENGTH) {
      return NextResponse.json(
        {
          error: "Password cannot exceed 50 characters.",
        },
        {
          status: 400,
        },
      );
    }

    if (password.length > 0 && password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        {
          error: "Password must be at least 8 characters.",
        },
        {
          status: 400,
        },
      );
    }

    /* =====================================================
       FIND ACCOUNT
    ===================================================== */

    const existingAccount = await prisma.adminUser.findUnique({
      where: {
        id,
      },
    });

    if (!existingAccount) {
      return NextResponse.json(
        {
          error: "Account not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (existingAccount.role !== "OWNER" && existingAccount.role !== "EDITOR") {
      return NextResponse.json(
        {
          error: "Invalid account configuration.",
        },
        {
          status: 400,
        },
      );
    }

    /* =====================================================
       CHECK EMAIL
    ===================================================== */

    const emailOwner = await prisma.adminUser.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (emailOwner && emailOwner.id !== id) {
      return NextResponse.json(
        {
          error: "That email address is already in use.",
        },
        {
          status: 409,
        },
      );
    }

    /* =====================================================
       PREPARE UPDATE
    ===================================================== */

    const updateData: {
      name: string;
      email: string;
      passwordHash?: string;
    } = {
      name: normalizedName,
      email: normalizedEmail,
    };

    /*
     * Blank password = keep the existing password.
     */

    if (password.length > 0) {
      updateData.passwordHash = await bcrypt.hash(password, 12);
    }

    /* =====================================================
       UPDATE DATABASE
    ===================================================== */

    const updatedAccount = await prisma.adminUser.update({
      where: {
        id,
      },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json({
      success: true,
      account: updatedAccount,
    });
  } catch (error) {
    console.error("PUT /api/auth/accounts error:", error);

    return NextResponse.json(
      {
        error: "Unable to update account.",
      },
      {
        status: 500,
      },
    );
  }
}
