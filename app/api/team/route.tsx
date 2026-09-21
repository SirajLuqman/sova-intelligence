import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/* =========================================================
   TEAM LIMITS
========================================================= */

const MAX_TEAM_MEMBERS = 30;

const MAX_NAME_LENGTH = 60;

const MAX_DESIGNATION_LENGTH = 80;

const MAX_SECTION_TITLE_LENGTH = 80;

const MAX_IMAGE_DATA_URL_LENGTH = 8 * 1024 * 1024;

const DEFAULT_SECTION_TITLE = "The people behind our work.";

/* =========================================================
   TYPES
========================================================= */

export interface TeamMember {
  id: string;
  name: string;
  designation: string;
  imageUrl: string | null;
}

/* =========================================================
   HELPERS
========================================================= */

/**
 * Safely converts an unknown value to a string.
 */
const stringValue = (value: unknown): string => {
  return typeof value === "string" ? value : "";
};

/**
 * Creates a fallback ID when a member does not have one.
 *
 * The ID is only used when normalizing malformed/legacy data.
 * Newly created members from the admin panel already have IDs.
 */
const createMemberId = (index: number): string => {
  return `team-member-${Date.now()}-${index}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
};

/**
 * Converts team members into Prisma-safe JSON.
 */
const toPrismaJson = (members: TeamMember[]): Prisma.InputJsonValue => {
  return members as unknown as Prisma.InputJsonValue;
};

/* =========================================================
   TEAM MEMBER NORMALIZATION
========================================================= */

/**
 * Normalizes one member so the API always returns
 * the same structure to the frontend.
 *
 * Legacy image fields are supported:
 * - imageUrl
 * - imagePath
 * - image
 */
const normalizeTeamMember = (member: unknown, index: number): TeamMember => {
  const item =
    member && typeof member === "object"
      ? (member as Record<string, unknown>)
      : {};

  const imageValue = stringValue(
    item.imageUrl ?? item.imagePath ?? item.image,
  ).trim();

  return {
    id: stringValue(item.id).trim() || createMemberId(index),

    name: stringValue(item.name).trim(),

    designation: stringValue(item.designation).trim(),

    imageUrl: imageValue || null,
  };
};

/* =========================================================
   SECTION TITLE NORMALIZATION
========================================================= */

const normalizeSectionTitle = (value: unknown): string => {
  const title = stringValue(value).trim();

  if (!title) {
    return DEFAULT_SECTION_TITLE;
  }

  return title.slice(0, MAX_SECTION_TITLE_LENGTH);
};

/* =========================================================
   VALIDATION
========================================================= */

const validateMembers = (members: unknown): string | null => {
  if (!Array.isArray(members)) {
    return "Team members must be provided as a list.";
  }

  if (members.length > MAX_TEAM_MEMBERS) {
    return `A maximum of ${MAX_TEAM_MEMBERS} team members is allowed.`;
  }

  for (let index = 0; index < members.length; index++) {
    const member = normalizeTeamMember(members[index], index);

    const memberNumber = index + 1;

    /* -----------------------------------------------------
       NAME
    ----------------------------------------------------- */

    if (!member.name) {
      return `Team member ${memberNumber} name cannot be empty.`;
    }

    if (member.name.length > MAX_NAME_LENGTH) {
      return `Team member ${memberNumber} name cannot exceed ${MAX_NAME_LENGTH} characters.`;
    }

    /* -----------------------------------------------------
       DESIGNATION
    ----------------------------------------------------- */

    if (!member.designation) {
      return `Team member ${memberNumber} designation cannot be empty.`;
    }

    if (member.designation.length > MAX_DESIGNATION_LENGTH) {
      return `Team member ${memberNumber} designation cannot exceed ${MAX_DESIGNATION_LENGTH} characters.`;
    }

    /* -----------------------------------------------------
       IMAGE
    ----------------------------------------------------- */

    if (member.imageUrl && member.imageUrl.length > MAX_IMAGE_DATA_URL_LENGTH) {
      return `Team member ${memberNumber} image data cannot exceed ${MAX_IMAGE_DATA_URL_LENGTH} characters.`;
    }
  }

  return null;
};

/* =========================================================
   GET
   Loads team settings for the public webpage
   or admin panel.
========================================================= */

export async function GET() {
  try {
    const team = await prisma.teamSettings.findUnique({
      where: {
        id: 1,
      },
    });

    /*
     * No TeamSettings record means the website
     * simply has no team members configured yet.
     */
    if (!team) {
      return NextResponse.json({
        sectionTitle: DEFAULT_SECTION_TITLE,
        members: [],
      });
    }

    /*
     * Prisma JSON data is normalized before being
     * returned to the frontend.
     */
    const rawMembers = Array.isArray(team.members) ? team.members : [];

    const members = rawMembers.map((member: unknown, index: number) =>
      normalizeTeamMember(member, index),
    );

    const sectionTitle = normalizeSectionTitle(team.sectionTitle);

    return NextResponse.json({
      sectionTitle,
      members,
    });
  } catch (error) {
    console.error("[Team API] GET error:", error);

    return NextResponse.json(
      {
        error: "Unable to load team settings.",
      },
      {
        status: 500,
      },
    );
  }
}

/* =========================================================
   POST
   Saves the complete team settings.

   IMPORTANT:
   The admin form intentionally sends the complete
   current draft. Therefore this endpoint replaces
   the stored members array and section title with
   the submitted values.
========================================================= */

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const rawMembers = Array.isArray(body?.members) ? body.members : [];

    const sectionTitle = normalizeSectionTitle(body?.sectionTitle);

    /* -----------------------------------------------------
       VALIDATE
    ----------------------------------------------------- */

    const validationError = validateMembers(rawMembers);

    if (validationError) {
      return NextResponse.json(
        {
          error: validationError,
        },
        {
          status: 400,
        },
      );
    }

    /* -----------------------------------------------------
       NORMALIZE
    ----------------------------------------------------- */

    const members = rawMembers.map((member: unknown, index: number) =>
      normalizeTeamMember(member, index),
    );

    /* -----------------------------------------------------
       SAVE
    ----------------------------------------------------- */

    const team = await prisma.teamSettings.upsert({
      where: {
        id: 1,
      },

      update: {
        sectionTitle,
        members: toPrismaJson(members),
      },

      create: {
        id: 1,
        sectionTitle,
        members: toPrismaJson(members),
      },
    });

    /* -----------------------------------------------------
       RESPONSE
    ----------------------------------------------------- */

    return NextResponse.json({
      success: true,
      id: team.id,
      sectionTitle,
      members,
    });
  } catch (error) {
    console.error("[Team API] POST error:", error);

    return NextResponse.json(
      {
        error: "Unable to save team settings.",
      },
      {
        status: 500,
      },
    );
  }
}
