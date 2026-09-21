import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ABOUT_SETTINGS_ID = 1;

// Default About section data
const defaultAboutData = {
  sectionTitle: "About Us",

  tabData: {
    mission: {
      tag: "Our Purpose",
      title: "Practical AI for real-world impact.",
      description:
        "SOVA helps schools, businesses, and communities in Malaysia and beyond apply AI in practical ways. Through targeted training, intelligent automation, and smart data solutions, we empower organizations to make confident, data-driven decisions.",
      highlight: "Decision Intelligence & Automation",
    },

    program: {
      tag: "Flagship Initiative",
      title: "SOVA Rise™ Empowerment Program",
      description:
        "Our flagship program, SOVA Rise™, is built to bridge the AI skills gap. We collaborate with institutions to foster practical digital literacy, build capability from within, and cultivate a sustainable technical talent ecosystem.",
      highlight: "Ecosystem Building & Upskilling",
    },

    impact: {
      tag: "Sustained Value",
      title: "Fostering inclusive digital growth.",
      description:
        "We believe technology should elevate human potential. By focusing on ethics, practical workflows, and tailored implementation, SOVA enables organizations to scale efficiency without complexity.",
      highlight: "Measurable Operational Growth",
    },
  },

  imagePath: "/images/about_Image.png",

  overlayLabel: "Impact Metric",
  overlayTitle: "100+ Organizations Empowered",
  overlayBadge: "AI",
};

// GET: Fetch About section settings
export async function GET() {
  try {
    const settings = await prisma.aboutSettings.findUnique({
      where: {
        id: ABOUT_SETTINGS_ID,
      },
    });

    return NextResponse.json(settings || defaultAboutData);
  } catch (error) {
    console.error("Failed to fetch about settings:", error);

    return NextResponse.json(
      { error: "Failed to fetch about settings" },
      { status: 500 },
    );
  }
}

// POST: Create or update About section settings
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const sectionTitle =
      typeof body.sectionTitle === "string" && body.sectionTitle.trim()
        ? body.sectionTitle.trim()
        : defaultAboutData.sectionTitle;

    const tabData = body.tabData ?? defaultAboutData.tabData;

    const imagePath =
      typeof body.imagePath === "string" && body.imagePath.trim()
        ? body.imagePath.trim()
        : defaultAboutData.imagePath;

    const overlayLabel =
      typeof body.overlayLabel === "string"
        ? body.overlayLabel.trim()
        : defaultAboutData.overlayLabel;

    const overlayTitle =
      typeof body.overlayTitle === "string"
        ? body.overlayTitle.trim()
        : defaultAboutData.overlayTitle;

    const overlayBadge =
      typeof body.overlayBadge === "string"
        ? body.overlayBadge.trim()
        : defaultAboutData.overlayBadge;

    const updatedSettings = await prisma.aboutSettings.upsert({
      where: {
        id: ABOUT_SETTINGS_ID,
      },

      update: {
        sectionTitle,
        tabData,
        imagePath,
        overlayLabel,
        overlayTitle,
        overlayBadge,
      },

      create: {
        id: ABOUT_SETTINGS_ID,
        sectionTitle,
        tabData,
        imagePath,
        overlayLabel,
        overlayTitle,
        overlayBadge,
      },
    });

    // Revalidate the home page so changes appear immediately.
    revalidatePath("/");

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error("Error saving about settings:", error);

    return NextResponse.json(
      { error: "Failed to save about settings" },
      { status: 500 },
    );
  }
}

// PUT: Update About section settings
export async function PUT(request: Request) {
  return POST(request);
}
