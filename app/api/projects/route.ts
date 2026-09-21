import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* =========================================================
   CONSTANTS
========================================================= */

const PROJECTS_ID = "projects";

const PROJECT_LIMITS = {
  maxProjects: 50,
  sectionTitleMaxChars: 50,
  badgeMaxChars: 35,
  titleMaxChars: 70,
  descriptionMaxChars: 300,
  targetPartnersMaxChars: 40,
  focusDomainMaxChars: 45,
  deliverableMaxChars: 100,
  maxDeliverables: 3,
  maxImages: 5,
} as const;

/* =========================================================
   TYPES
========================================================= */

interface ProjectData {
  id: string;
  badge: string;
  title: string;
  description: string;
  icon?: string;
  images: string[];
  targetPartners: string;
  focusDomain: string;
  deliverables: string[];
}

interface ProjectsResponse {
  sectionTitle: string;
  projects: ProjectData[];
}

interface ProjectChanges {
  id: string;
  changes?: Partial<ProjectData>;
  isNew?: boolean;
  project?: ProjectData;
}

/* =========================================================
   HELPERS
========================================================= */

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidImage(value: unknown) {
  return (
    typeof value === "string" &&
    (value.startsWith("data:image/") ||
      value.startsWith("/") ||
      value.startsWith("http://") ||
      value.startsWith("https://"))
  );
}

function normalizeProject(value: unknown): ProjectData | null {
  if (!isPlainObject(value)) {
    return null;
  }

  if (typeof value.id !== "string") {
    return null;
  }

  const deliverables = Array.isArray(value.deliverables)
    ? value.deliverables.filter(
        (item): item is string => typeof item === "string",
      )
    : [];

  const images = Array.isArray(value.images)
    ? value.images.filter(isValidImage)
    : [];

  return {
    id: value.id,
    badge: typeof value.badge === "string" ? value.badge : "",
    title: typeof value.title === "string" ? value.title : "",
    description: typeof value.description === "string" ? value.description : "",
    icon: typeof value.icon === "string" ? value.icon : "globe",
    images,
    targetPartners:
      typeof value.targetPartners === "string" ? value.targetPartners : "",
    focusDomain: typeof value.focusDomain === "string" ? value.focusDomain : "",
    deliverables,
  };
}

function normalizeProjects(value: unknown): ProjectData[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizeProject)
    .filter((project): project is ProjectData => project !== null);
}

function cleanProject(project: ProjectData): ProjectData {
  return {
    id: project.id.trim(),
    badge: project.badge.trim(),
    title: project.title.trim(),
    description: project.description.trim(),
    icon: project.icon || "globe",
    images: project.images.filter(Boolean),
    targetPartners: project.targetPartners.trim(),
    focusDomain: project.focusDomain.trim(),
    deliverables: project.deliverables
      .map((item) => item.trim())
      .filter(Boolean),
  };
}

/* =========================================================
   DATABASE → API FORMAT
========================================================= */

function mapDatabaseProject(project: {
  id: string;
  badge: string;
  title: string;
  description: string;
  icon: string | null;
  targetPartners: string;
  focusDomain: string;
  deliverables: unknown;
  images: {
    imageData: string;
    displayOrder: number;
  }[];
}): ProjectData {
  const deliverables = Array.isArray(project.deliverables)
    ? project.deliverables.filter(
        (item): item is string => typeof item === "string",
      )
    : [];

  return {
    id: project.id,
    badge: project.badge,
    title: project.title,
    description: project.description,
    icon: project.icon || "globe",
    images: [...project.images]
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((image) => image.imageData),
    targetPartners: project.targetPartners,
    focusDomain: project.focusDomain,
    deliverables,
  };
}

/* =========================================================
   VALIDATION
========================================================= */

function validateProject(project: ProjectData): string | null {
  if (!project.id.trim()) {
    return "Project ID is required.";
  }

  if (project.badge.length > PROJECT_LIMITS.badgeMaxChars) {
    return "Project category is too long.";
  }

  if (project.title.length > PROJECT_LIMITS.titleMaxChars) {
    return "Project title is too long.";
  }

  if (project.description.length > PROJECT_LIMITS.descriptionMaxChars) {
    return "Project description is too long.";
  }

  if (project.targetPartners.length > PROJECT_LIMITS.targetPartnersMaxChars) {
    return "Target Partners is too long.";
  }

  if (project.focusDomain.length > PROJECT_LIMITS.focusDomainMaxChars) {
    return "Focus Domain is too long.";
  }

  if (project.deliverables.length > PROJECT_LIMITS.maxDeliverables) {
    return "A project can have a maximum of 3 deliverables.";
  }

  for (const deliverable of project.deliverables) {
    if (deliverable.length > PROJECT_LIMITS.deliverableMaxChars) {
      return "A deliverable is too long.";
    }
  }

  if (project.images.length > PROJECT_LIMITS.maxImages) {
    return "A project can have a maximum of 5 images.";
  }

  for (const image of project.images) {
    if (!isValidImage(image)) {
      return "One or more project images are invalid.";
    }
  }

  return null;
}

/* =========================================================
   PARTIAL CHANGE VALIDATION
========================================================= */

function validateProjectChanges(changes: Partial<ProjectData>): string | null {
  if (
    changes.badge !== undefined &&
    changes.badge.length > PROJECT_LIMITS.badgeMaxChars
  ) {
    return "Project category is too long.";
  }

  if (
    changes.title !== undefined &&
    changes.title.length > PROJECT_LIMITS.titleMaxChars
  ) {
    return "Project title is too long.";
  }

  if (
    changes.description !== undefined &&
    changes.description.length > PROJECT_LIMITS.descriptionMaxChars
  ) {
    return "Project description is too long.";
  }

  if (
    changes.targetPartners !== undefined &&
    changes.targetPartners.length > PROJECT_LIMITS.targetPartnersMaxChars
  ) {
    return "Target Partners is too long.";
  }

  if (
    changes.focusDomain !== undefined &&
    changes.focusDomain.length > PROJECT_LIMITS.focusDomainMaxChars
  ) {
    return "Focus Domain is too long.";
  }

  if (changes.deliverables !== undefined) {
    if (changes.deliverables.length > PROJECT_LIMITS.maxDeliverables) {
      return "A project can have a maximum of 3 deliverables.";
    }

    for (const deliverable of changes.deliverables) {
      if (deliverable.length > PROJECT_LIMITS.deliverableMaxChars) {
        return "A deliverable is too long.";
      }
    }
  }

  if (changes.images !== undefined) {
    if (changes.images.length > PROJECT_LIMITS.maxImages) {
      return "A project can have a maximum of 5 images.";
    }

    for (const image of changes.images) {
      if (!isValidImage(image)) {
        return "One or more project images are invalid.";
      }
    }
  }

  return null;
}

/* =========================================================
   GET
========================================================= */

export async function GET() {
  const requestStart = performance.now();

  try {
    /* =====================================================
       SETTINGS
    ===================================================== */

    const settingsStart = performance.now();

    let settings = await prisma.projectsSettings.findUnique({
      where: {
        id: PROJECTS_ID,
      },
      select: {
        id: true,
        sectionTitle: true,
      },
    });

    if (!settings) {
      settings = await prisma.projectsSettings.create({
        data: {
          id: PROJECTS_ID,
          sectionTitle: "Our Projects",
          projects: [],
        },
        select: {
          id: true,
          sectionTitle: true,
        },
      });
    }

    console.log(
      `[Projects GET] settings: ${(performance.now() - settingsStart).toFixed(
        0,
      )}ms`,
    );

    /* =====================================================
       PROJECTS + IMAGES
    ===================================================== */

    const projectsStart = performance.now();

    const projects = await prisma.project.findMany({
      where: {
        projectsSettingsId: PROJECTS_ID,
      },
      orderBy: {
        displayOrder: "asc",
      },
      select: {
        id: true,
        badge: true,
        title: true,
        description: true,
        icon: true,
        targetPartners: true,
        focusDomain: true,
        deliverables: true,
        images: {
          orderBy: {
            displayOrder: "asc",
          },
          select: {
            imageData: true,
            displayOrder: true,
          },
        },
      },
    });

    console.log(
      `[Projects GET] projects + images: ${(
        performance.now() - projectsStart
      ).toFixed(0)}ms`,
    );

    /* =====================================================
       RESPONSE MAPPING
    ===================================================== */

    const mappingStart = performance.now();

    const mappedProjects = projects.map(mapDatabaseProject);

    console.log(
      `[Projects GET] mapping: ${(performance.now() - mappingStart).toFixed(
        0,
      )}ms`,
    );

    console.log(
      `[Projects GET] total: ${(performance.now() - requestStart).toFixed(
        0,
      )}ms`,
    );

    return NextResponse.json<ProjectsResponse>({
      sectionTitle: settings.sectionTitle,
      projects: mappedProjects,
    });
  } catch (error) {
    console.error("GET /api/projects error:", error);

    console.log(
      `[Projects GET] failed after: ${(
        performance.now() - requestStart
      ).toFixed(0)}ms`,
    );

    return NextResponse.json(
      {
        error: "Failed to load Projects settings.",
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
  const requestStart = performance.now();

  try {
    /* =====================================================
       READ REQUEST
    ===================================================== */

    const jsonStart = performance.now();

    const body: unknown = await request.json();

    console.log(
      `[Projects PUT] request.json(): ${(performance.now() - jsonStart).toFixed(
        0,
      )}ms`,
    );

    if (!isPlainObject(body)) {
      return NextResponse.json(
        {
          error: "Request body must be a JSON object.",
        },
        { status: 400 },
      );
    }

    /* =====================================================
       LEGACY FULL-SAVE SUPPORT
    ===================================================== */

    if (Array.isArray(body.projects)) {
      const incomingProjects = normalizeProjects(body.projects);

      if (incomingProjects.length > PROJECT_LIMITS.maxProjects) {
        return NextResponse.json(
          {
            error: `Maximum ${PROJECT_LIMITS.maxProjects} projects are allowed.`,
          },
          { status: 400 },
        );
      }

      for (const project of incomingProjects) {
        const error = validateProject(project);

        if (error) {
          return NextResponse.json(
            {
              error,
            },
            { status: 400 },
          );
        }
      }

      const incomingSectionTitle =
        typeof body.sectionTitle === "string"
          ? body.sectionTitle.trim()
          : "Our Projects";

      if (incomingSectionTitle.length > PROJECT_LIMITS.sectionTitleMaxChars) {
        return NextResponse.json(
          {
            error: "Section title is too long.",
          },
          { status: 400 },
        );
      }

      const cleanedProjects = incomingProjects.map(cleanProject);

      const legacyStart = performance.now();

      await prisma.$transaction(
        async (tx) => {
          await tx.projectsSettings.upsert({
            where: {
              id: PROJECTS_ID,
            },
            create: {
              id: PROJECTS_ID,
              sectionTitle: incomingSectionTitle,
              projects: [],
            },
            update: {
              sectionTitle: incomingSectionTitle,
            },
          });

          await tx.project.deleteMany({
            where: {
              projectsSettingsId: PROJECTS_ID,
            },
          });

          for (
            let projectIndex = 0;
            projectIndex < cleanedProjects.length;
            projectIndex++
          ) {
            const project = cleanedProjects[projectIndex];

            await tx.project.create({
              data: {
                id: project.id,
                badge: project.badge,
                title: project.title,
                description: project.description,
                icon: project.icon || "globe",
                targetPartners: project.targetPartners,
                focusDomain: project.focusDomain,
                deliverables: project.deliverables,
                displayOrder: projectIndex,
                projectsSettingsId: PROJECTS_ID,
              },
            });

            if (project.images.length > 0) {
              await tx.projectImage.createMany({
                data: project.images.map((imageData, imageIndex) => ({
                  imageData,
                  displayOrder: imageIndex,
                  projectId: project.id,
                })),
              });
            }
          }
        },
        {
          timeout: 15000,
        },
      );

      console.log(
        `[Projects PUT] relational full save: ${(
          performance.now() - legacyStart
        ).toFixed(0)}ms`,
      );

      console.log(
        `[Projects PUT] total: ${(performance.now() - requestStart).toFixed(
          0,
        )}ms`,
      );

      return NextResponse.json<ProjectsResponse>({
        sectionTitle: incomingSectionTitle,
        projects: cleanedProjects,
      });
    }

    /* =====================================================
       OPTIMIZED PARTIAL SAVE
    ===================================================== */

    const changedProjects: ProjectChanges[] = Array.isArray(
      body.changedProjects,
    )
      ? body.changedProjects.filter(isPlainObject).map((item) => ({
          id: typeof item.id === "string" ? item.id : "",
          changes: isPlainObject(item.changes)
            ? (item.changes as Partial<ProjectData>)
            : undefined,
          isNew: item.isNew === true,
          project: normalizeProject(item.project) ?? undefined,
        }))
      : [];

    const deletedProjectIds = Array.isArray(body.deletedProjectIds)
      ? [
          ...new Set(
            body.deletedProjectIds.filter(
              (id): id is string => typeof id === "string" && id.trim() !== "",
            ),
          ),
        ]
      : [];

    let sectionTitleChanged = false;
    let sectionTitle: string | undefined;

    if (typeof body.sectionTitle === "string") {
      sectionTitle = body.sectionTitle.trim();
      sectionTitleChanged = true;

      if (sectionTitle.length > PROJECT_LIMITS.sectionTitleMaxChars) {
        return NextResponse.json(
          {
            error: "Section title is too long.",
          },
          { status: 400 },
        );
      }
    }

    if (
      changedProjects.length === 0 &&
      deletedProjectIds.length === 0 &&
      !sectionTitleChanged
    ) {
      console.log("[Projects PUT] No database changes required.");

      return NextResponse.json({
        sectionTitle: undefined,
        projects: undefined,
      });
    }

    /* =====================================================
       VALIDATE REQUEST
    ===================================================== */

    const validationStart = performance.now();

    for (const change of changedProjects) {
      if (!change.id.trim()) {
        return NextResponse.json(
          {
            error: "Project ID is required.",
          },
          { status: 400 },
        );
      }

      if (change.isNew === true) {
        const project = change.project;

        if (!project) {
          return NextResponse.json(
            {
              error: "Invalid new project data.",
            },
            { status: 400 },
          );
        }

        if (project.id !== change.id) {
          return NextResponse.json(
            {
              error: "Project ID mismatch.",
            },
            { status: 400 },
          );
        }

        const validationError = validateProject(project);

        if (validationError) {
          return NextResponse.json(
            {
              error: validationError,
            },
            { status: 400 },
          );
        }

        continue;
      }

      if (!isPlainObject(change.changes)) {
        continue;
      }

      const validationError = validateProjectChanges(change.changes);

      if (validationError) {
        return NextResponse.json(
          {
            error: validationError,
          },
          { status: 400 },
        );
      }
    }

    console.log(
      `[Projects PUT] validation: ${(
        performance.now() - validationStart
      ).toFixed(0)}ms`,
    );

    /* =====================================================
       DATABASE TRANSACTION
    ===================================================== */

    const databaseStart = performance.now();

    await prisma.$transaction(
      async (tx) => {
        /* ===================================================
           ENSURE SETTINGS ROW EXISTS
        =================================================== */

        if (sectionTitleChanged) {
          await tx.projectsSettings.upsert({
            where: {
              id: PROJECTS_ID,
            },
            create: {
              id: PROJECTS_ID,
              sectionTitle: sectionTitle ?? "Our Projects",
              projects: [],
            },
            update: {
              sectionTitle: sectionTitle ?? "Our Projects",
            },
          });
        } else {
          const settingsExists = await tx.projectsSettings.findUnique({
            where: {
              id: PROJECTS_ID,
            },
            select: {
              id: true,
            },
          });

          if (!settingsExists) {
            await tx.projectsSettings.create({
              data: {
                id: PROJECTS_ID,
                sectionTitle: "Our Projects",
                projects: [],
              },
            });
          }
        }

        /* ===================================================
           DELETE PROJECTS
        =================================================== */

        if (deletedProjectIds.length > 0) {
          await tx.project.deleteMany({
            where: {
              id: {
                in: deletedProjectIds,
              },
              projectsSettingsId: PROJECTS_ID,
            },
          });
        }

        /* ===================================================
           EXISTING PROJECT UPDATES
        =================================================== */

        for (const change of changedProjects) {
          if (change.isNew === true) {
            continue;
          }

          if (!change.changes || Object.keys(change.changes).length === 0) {
            continue;
          }

          const changes = change.changes;

          const updateData: {
            badge?: string;
            title?: string;
            description?: string;
            icon?: string | null;
            targetPartners?: string;
            focusDomain?: string;
            deliverables?: string[];
          } = {};

          if (changes.badge !== undefined) {
            updateData.badge = changes.badge.trim();
          }

          if (changes.title !== undefined) {
            updateData.title = changes.title.trim();
          }

          if (changes.description !== undefined) {
            updateData.description = changes.description.trim();
          }

          if (changes.icon !== undefined) {
            updateData.icon = changes.icon || null;
          }

          if (changes.targetPartners !== undefined) {
            updateData.targetPartners = changes.targetPartners.trim();
          }

          if (changes.focusDomain !== undefined) {
            updateData.focusDomain = changes.focusDomain.trim();
          }

          if (changes.deliverables !== undefined) {
            updateData.deliverables = changes.deliverables
              .map((item) => item.trim())
              .filter(Boolean);
          }

          if (Object.keys(updateData).length > 0) {
            await tx.project.update({
              where: {
                id: change.id,
              },
              data: updateData,
            });
          }

          /* ===============================================
             REPLACE IMAGES ONLY WHEN IMAGES CHANGED
          =============================================== */

          if (changes.images !== undefined) {
            const images = changes.images.filter(Boolean);

            await tx.projectImage.deleteMany({
              where: {
                projectId: change.id,
              },
            });

            if (images.length > 0) {
              await tx.projectImage.createMany({
                data: images.map((imageData, imageIndex) => ({
                  imageData,
                  displayOrder: imageIndex,
                  projectId: change.id,
                })),
              });
            }
          }
        }

        /* ===================================================
           NEW PROJECTS
        =================================================== */

        const newProjects = changedProjects.filter(
          (change) => change.isNew === true && change.project,
        );

        if (newProjects.length > 0) {
          /*
           * One count query for all new projects instead of
           * running count() once for every new project.
           */
          const existingProjectCount = await tx.project.count({
            where: {
              projectsSettingsId: PROJECTS_ID,
            },
          });

          if (
            existingProjectCount + newProjects.length >
            PROJECT_LIMITS.maxProjects
          ) {
            throw new Error(
              `Maximum ${PROJECT_LIMITS.maxProjects} projects are allowed.`,
            );
          }

          for (let index = 0; index < newProjects.length; index++) {
            const change = newProjects[index];

            if (!change.project) {
              continue;
            }

            const project = cleanProject(change.project);

            await tx.project.create({
              data: {
                id: project.id,
                badge: project.badge,
                title: project.title,
                description: project.description,
                icon: project.icon || "globe",
                targetPartners: project.targetPartners,
                focusDomain: project.focusDomain,
                deliverables: project.deliverables,
                displayOrder: existingProjectCount + index,
                projectsSettingsId: PROJECTS_ID,
              },
            });

            if (project.images.length > 0) {
              await tx.projectImage.createMany({
                data: project.images.map((imageData, imageIndex) => ({
                  imageData,
                  displayOrder: imageIndex,
                  projectId: project.id,
                })),
              });
            }
          }
        }

        /*
         * IMPORTANT:
         *
         * We intentionally do NOT normalize every project's
         * displayOrder on every save.
         *
         * Existing project edits do not change order.
         * New projects are appended using the next order value.
         * Deleted projects do not require immediate renumbering.
         *
         * This avoids N additional UPDATE queries on every save.
         */
      },
      {
        timeout: 15000,
      },
    );

    console.log(
      `[Projects PUT] relational database update: ${(
        performance.now() - databaseStart
      ).toFixed(0)}ms`,
    );

    console.log(
      `[Projects PUT] total: ${(performance.now() - requestStart).toFixed(
        0,
      )}ms`,
    );

    /*
     * Do not return all projects/images.
     *
     * ProjectsAdminForm already keeps its local draft and
     * uses it when projects are not returned by the API.
     */
    return NextResponse.json({
      sectionTitle,
      projects: undefined,
    });
  } catch (error) {
    console.error("PUT /api/projects error:", error);

    console.log(
      `[Projects PUT] failed after: ${(
        performance.now() - requestStart
      ).toFixed(0)}ms`,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error && error.message
            ? error.message
            : "Failed to save Projects settings.",
      },
      {
        status: 500,
      },
    );
  }
}
