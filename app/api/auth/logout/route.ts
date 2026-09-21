import { NextResponse } from "next/server";
import { clearAdminSessionCookie } from "@/lib/auth";

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
    });

    clearAdminSessionCookie(response);

    return response;
  } catch (error) {
    console.error("POST /api/auth/logout error:", error);

    return NextResponse.json(
      { error: "Unable to sign out." },
      { status: 500 },
    );
  }
}