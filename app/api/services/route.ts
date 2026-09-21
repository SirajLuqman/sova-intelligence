import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* =========================================================
   GET
========================================================= */

export async function GET() {
  try {
    const settings = await prisma.servicesSettings.findUnique({
      where: {
        id: 1,
      },
    });

    if (!settings) {
      return NextResponse.json({
        sectionTitle: "",
        enterpriseServices: [],
        individualServices: [],
      });
    }

    return NextResponse.json({
      sectionTitle: settings.sectionTitle ?? "",
      enterpriseServices: Array.isArray(settings.enterpriseServices)
        ? settings.enterpriseServices
        : [],
      individualServices: Array.isArray(settings.individualServices)
        ? settings.individualServices
        : [],
    });
  } catch (error) {
    console.error("GET /api/services error:", error);

    return NextResponse.json(
      {
        error: "Failed to load Services settings.",
      },
      {
        status: 500,
      },
    );
  }
}

/* =========================================================
   POST
========================================================= */

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const sectionTitle =
      typeof body.sectionTitle === "string" ? body.sectionTitle.trim() : "";

    const enterpriseServices = Array.isArray(body.enterpriseServices)
      ? body.enterpriseServices
      : [];

    const individualServices = Array.isArray(body.individualServices)
      ? body.individualServices
      : [];

    const settings = await prisma.servicesSettings.upsert({
      where: {
        id: 1,
      },

      update: {
        sectionTitle,
        enterpriseServices,
        individualServices,
      },

      create: {
        id: 1,
        sectionTitle,
        enterpriseServices,
        individualServices,
      },
    });

    revalidatePath("/");
    revalidatePath("/admin");

    return NextResponse.json({
      success: true,
      data: {
        sectionTitle: settings.sectionTitle,
        enterpriseServices: settings.enterpriseServices ?? [],
        individualServices: settings.individualServices ?? [],
      },
    });
  } catch (error) {
    console.error("POST /api/services error:", error);

    return NextResponse.json(
      {
        error: "Failed to save Services settings.",
      },
      {
        status: 500,
      },
    );
  }
}

/* =========================================================
   PUT
========================================================= */

export async function PUT(request: Request) {
  return POST(request);
}
