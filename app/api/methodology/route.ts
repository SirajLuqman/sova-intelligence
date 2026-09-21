import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TOTAL_STEPS = 3;
const MAX_DELIVERABLES = 3;

export async function GET() {
  try {
    const methodology = await prisma.methodologySettings.findUnique({
      where: {
        id: 1,
      },
    });

    /*
     * No record yet.
     * Return null rather than creating database content
     * automatically during a GET request.
     */
    if (!methodology) {
      return NextResponse.json(null);
    }

    const steps = Array.isArray(methodology.steps) ? methodology.steps : [];

    return NextResponse.json({
      id: methodology.id,
      sectionBadge: methodology.sectionBadge,
      sectionTitle: methodology.sectionTitle,
      sectionDescription: methodology.sectionDescription,
      steps,
      updatedAt: methodology.updatedAt,
    });
  } catch (error) {
    console.error("GET /api/methodology error:", error);

    return NextResponse.json(
      {
        error: "Failed to load methodology settings.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { sectionBadge, sectionTitle, sectionDescription, steps } = body;

    /*
     * Basic validation
     */
    if (
      typeof sectionBadge !== "string" ||
      typeof sectionTitle !== "string" ||
      typeof sectionDescription !== "string"
    ) {
      return NextResponse.json(
        {
          error: "Invalid section header data.",
        },
        {
          status: 400,
        },
      );
    }

    if (!Array.isArray(steps)) {
      return NextResponse.json(
        {
          error: "Methodology steps must be an array.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Keep the methodology layout fixed to 3 steps.
     */
    if (steps.length !== TOTAL_STEPS) {
      return NextResponse.json(
        {
          error: `Methodology must contain exactly ${TOTAL_STEPS} steps.`,
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Sanitize and validate each step before saving.
     *
     * step and phase are intentionally NOT stored.
     * They are generated from the step's position by Methodology.tsx.
     */
    const sanitizedSteps = steps.map((step: unknown, index: number) => {
      if (
        !step ||
        typeof step !== "object" ||
        typeof (step as { id?: unknown }).id !== "string" ||
        typeof (step as { title?: unknown }).title !== "string" ||
        typeof (step as { tagline?: unknown }).tagline !== "string" ||
        typeof (step as { iconName?: unknown }).iconName !== "string" ||
        typeof (step as { description?: unknown }).description !== "string" ||
        typeof (step as { timeline?: unknown }).timeline !== "string"
      ) {
        throw new Error(`Invalid data for methodology step ${index + 1}.`);
      }

      const stepData = step as {
        id: string;
        title: string;
        tagline: string;
        iconName: string;
        description: string;
        timeline: string;
        deliverables?: unknown;
      };

      const deliverables = Array.isArray(stepData.deliverables)
        ? stepData.deliverables
            .filter((item: unknown): item is string => typeof item === "string")
            .map((item: string) => item.trim())
            .filter(Boolean)
            .slice(0, MAX_DELIVERABLES)
        : [];

      return {
        id: stepData.id,
        title: stepData.title.trim(),
        tagline: stepData.tagline.trim(),
        iconName: stepData.iconName.trim(),
        description: stepData.description.trim(),
        deliverables,
        timeline: stepData.timeline.trim(),
      };
    });

    /*
     * Upsert guarantees that the single methodology record
     * is created if it doesn't exist and updated if it does.
     */
    const methodology = await prisma.methodologySettings.upsert({
      where: {
        id: 1,
      },

      create: {
        id: 1,
        sectionBadge: sectionBadge.trim(),
        sectionTitle: sectionTitle.trim(),
        sectionDescription: sectionDescription.trim(),
        steps: sanitizedSteps,
      },

      update: {
        sectionBadge: sectionBadge.trim(),
        sectionTitle: sectionTitle.trim(),
        sectionDescription: sectionDescription.trim(),
        steps: sanitizedSteps,
      },
    });

    return NextResponse.json({
      id: methodology.id,
      sectionBadge: methodology.sectionBadge,
      sectionTitle: methodology.sectionTitle,
      sectionDescription: methodology.sectionDescription,
      steps: methodology.steps,
      updatedAt: methodology.updatedAt,
    });
  } catch (error) {
    console.error("POST /api/methodology error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to save methodology settings.",
      },
      {
        status: 500,
      },
    );
  }
}
