import { NextResponse } from "next/server";
// CHANGED: Imported `revalidatePath` from `next/cache`
// REASON: Allows triggering instant cache invalidation for the frontend when settings update
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

// Configured dynamic execution and disabled cache for GET requests
export const dynamic = "force-dynamic";
export const revalidate = 0;

const NAVBAR_SETTINGS_ID = 1;

// REMOVED: Duplicate `export const dynamic = "force-dynamic";` statement that was present here

export async function GET() {
  try {
    const settings = await prisma.navbarSettings.findUnique({
      where: { 
        id: NAVBAR_SETTINGS_ID 
      },
    });
    return NextResponse.json(settings || {});
  } catch (error) {
    console.error("Failed to fetch navbar settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const brandName = body.brandName ?? "SOVA";
    const tagline = body.tagline ?? "";
    const logoUrl = body.logoUrl ?? "";
    const navLinks = body.navLinks ?? [];
    const ctaText = body.ctaText ?? "";
    const ctaHref = body.ctaHref ?? "";

    const updatedSettings = await prisma.navbarSettings.upsert({
      where: { 
        id: NAVBAR_SETTINGS_ID 
      },
      update: {
        brandName,
        tagline,
        logoUrl,
        ...(body.navLinks !== undefined && { navLinks }),
        ...(body.ctaText !== undefined && { ctaText }),
        ...(body.ctaHref !== undefined && { ctaHref }),
      },
      create: {
        id: NAVBAR_SETTINGS_ID,
        brandName,
        tagline,
        logoUrl,
        navLinks,
        ctaText,
        ctaHref,
      },
    });

    // ADDED: Immediate on-demand revalidation for the home route ("/")
    // REASON: Forces Next.js to invalidate cached server/static renders so public visitors see updated navbar settings instantly
    revalidatePath("/");

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error("Error saving navbar settings:", error);
    return NextResponse.json(
      { error: "Failed to save navbar settings" },
      { status: 500 }
    );
  }
}