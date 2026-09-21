import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const EXPERTISE_SETTINGS_ID = 1;

/* =========================================================
   GET
   Fetch Expertise section settings from database.
========================================================= */

export async function GET() {
  try {
    const settings = await prisma.expertiseSettings.findUnique({
      where: {
        id: EXPERTISE_SETTINGS_ID,
      },
    });

    if (!settings) {
      return NextResponse.json({
        sectionTitle: "",
        pillars: [],
      });
    }

    return NextResponse.json({
      sectionTitle: settings.sectionTitle,
      pillars: settings.pillars ?? [],
    });
  } catch (error) {
    console.error("Failed to fetch Expertise settings:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch Expertise settings.",
      },
      {
        status: 500,
      },
    );
  }
}

/* =========================================================
   POST
   Create/update Expertise section settings.
========================================================= */

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const sectionTitle =
      typeof body.sectionTitle === "string" ? body.sectionTitle.trim() : "";

    const pillars = Array.isArray(body.pillars) ? body.pillars : [];

    const updatedSettings = await prisma.expertiseSettings.upsert({
      where: {
        id: EXPERTISE_SETTINGS_ID,
      },

      update: {
        sectionTitle,
        pillars,
      },

      create: {
        id: EXPERTISE_SETTINGS_ID,
        sectionTitle,
        pillars,
      },
    });

    revalidatePath("/");

    return NextResponse.json({
      sectionTitle: updatedSettings.sectionTitle,
      pillars: updatedSettings.pillars ?? [],
    });
  } catch (error) {
    console.error("Error saving Expertise settings:", error);

    return NextResponse.json(
      {
        error: "Failed to save Expertise settings.",
      },
      {
        status: 500,
      },
    );
  }
}

/* =========================================================
   PUT
   Same behavior as POST.
========================================================= */

export async function PUT(request: Request) {
  return POST(request);
}
