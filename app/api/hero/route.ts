import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

/* =========================================================
   ROUTE CONFIG
========================================================= */

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* =========================================================
   DEFAULT HERO DATA
========================================================= */

const DEFAULT_HEADLINE_LINE_1 = "Practice";

const DEFAULT_HEADLINE_LINE_2 = "Made Perfect";

const DEFAULT_DESCRIPTION =
  "Today’s top institutions and organizations trust SOVA to elevate their operational capability and navigate complexity with practical AI.";

const DEFAULT_MEDIA_TYPE: MediaType = "video";

const DEFAULT_VIDEO_URL = "/videos/hero-bg.mp4";

const DEFAULT_IMAGE_URL = "/images/hero-bg.png";

const DEFAULT_MEDIA_OPACITY = "45";

const DEFAULT_CLIENTS = [
  "Acme Global",
  "Apex Enterprise",
  "Vertex Systems",
  "Nexus Legal Group",
  "Horizon Financial",
  "Omni Tech Solutions",
  "Stratum Partners",
];

/* =========================================================
   MEDIA CONFIG
========================================================= */

const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024;

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm"]);

const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

/* =========================================================
   TYPES
========================================================= */

type MediaType = "video" | "image";

interface HeroRequestBody {
  headlineLine1?: unknown;
  headlineLine2?: unknown;
  description?: unknown;
  mediaType?: unknown;
  mediaUrl?: unknown;
  videoUrl?: unknown;
  imageUrl?: unknown;
  mediaOpacity?: unknown;
  clients?: unknown;
}

/* =========================================================
   HELPERS
========================================================= */

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeMediaType(value: unknown): MediaType {
  return value === "image" ? "image" : "video";
}

function normalizeOpacity(value: unknown): string {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return DEFAULT_MEDIA_OPACITY;
  }

  const clampedValue = Math.min(Math.max(numericValue, 0), 100);

  return String(clampedValue);
}

function normalizeClients(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((client): client is string => typeof client === "string")
    .map((client) => client.trim())
    .filter(Boolean)
    .slice(0, 12);
}

/* =========================================================
   MEDIA URL VALIDATION
========================================================= */

function isAllowedMediaUrl(value: string, mediaType: MediaType): boolean {
  if (!value) {
    return false;
  }

  /*
   * Public application files.
   *
   * These are fallback files only when no database
   * media exists.
   */
  if (value.startsWith("/")) {
    return true;
  }

  /*
   * Base64 image.
   *
   * Explicitly support the image formats accepted by
   * the upload handler.
   */
  if (mediaType === "image") {
    if (
      value.startsWith("data:image/png;base64,") ||
      value.startsWith("data:image/jpeg;base64,") ||
      value.startsWith("data:image/webp;base64,")
    ) {
      return true;
    }
  }

  /*
   * Base64 video.
   *
   * Explicitly support the video formats accepted by
   * the upload handler.
   */
  if (mediaType === "video") {
    if (
      value.startsWith("data:video/mp4;base64,") ||
      value.startsWith("data:video/webm;base64,")
    ) {
      return true;
    }
  }

  /*
   * External HTTP/HTTPS URLs.
   */
  try {
    const parsedUrl = new URL(value);

    return parsedUrl.protocol === "https:" || parsedUrl.protocol === "http:";
  } catch {
    return false;
  }
}

/* =========================================================
   FILE → DATA URL
========================================================= */

async function fileToDataUrl(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();

  const buffer = Buffer.from(arrayBuffer);

  return `data:${file.type};base64,${buffer.toString("base64")}`;
}

/* =========================================================
   FILE VALIDATION
========================================================= */

function validateUploadedFile(file: File, mediaType: MediaType): string | null {
  if (!file || typeof file.arrayBuffer !== "function") {
    return "No valid media file was provided.";
  }

  if (file.size <= 0) {
    return "The uploaded file is empty.";
  }

  if (mediaType === "video") {
    if (!ALLOWED_VIDEO_TYPES.has(file.type)) {
      return "Invalid video format. Please upload an MP4 or WebM video.";
    }

    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      return "Video is too large. The maximum allowed size is 100 MB.";
    }
  }

  if (mediaType === "image") {
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return "Invalid image format. Please upload PNG, JPEG, or WebP.";
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return "Image is too large. The maximum allowed size is 5 MB.";
    }
  }

  return null;
}

/* =========================================================
   GET
   FETCH HERO SETTINGS
========================================================= */

export async function GET() {
  try {
    const heroSettings = await prisma.heroSettings.findFirst();

    /*
     * No database record yet.
     *
     * Use public files as the initial defaults.
     */
    if (!heroSettings) {
      return NextResponse.json({
        headlineLine1: DEFAULT_HEADLINE_LINE_1,
        headlineLine2: DEFAULT_HEADLINE_LINE_2,
        description: DEFAULT_DESCRIPTION,

        mediaType: DEFAULT_MEDIA_TYPE,

        mediaUrl: DEFAULT_VIDEO_URL,

        videoUrl: DEFAULT_VIDEO_URL,

        imageUrl: DEFAULT_IMAGE_URL,

        mediaOpacity: DEFAULT_MEDIA_OPACITY,

        clients: DEFAULT_CLIENTS,
      });
    }

    const mediaType: MediaType =
      heroSettings.mediaType === "image" ? "image" : "video";

    const storedCurrentMedia =
      typeof heroSettings.mediaUrl === "string"
        ? heroSettings.mediaUrl.trim()
        : "";

    const storedVideoUrl =
      typeof heroSettings.videoUrl === "string"
        ? heroSettings.videoUrl.trim()
        : "";

    const storedImageUrl =
      typeof heroSettings.imageUrl === "string"
        ? heroSettings.imageUrl.trim()
        : "";

    /*
     * Resolve the stored video.
     *
     * Priority:
     *
     * 1. videoUrl from database
     * 2. old mediaUrl if currently selected as video
     * 3. public default video
     */
    const videoUrl = isAllowedMediaUrl(storedVideoUrl, "video")
      ? storedVideoUrl
      : mediaType === "video" && isAllowedMediaUrl(storedCurrentMedia, "video")
        ? storedCurrentMedia
        : DEFAULT_VIDEO_URL;

    /*
     * Resolve the stored image.
     *
     * Priority:
     *
     * 1. imageUrl from database
     * 2. old mediaUrl if currently selected as image
     * 3. public default image
     */
    const imageUrl = isAllowedMediaUrl(storedImageUrl, "image")
      ? storedImageUrl
      : mediaType === "image" && isAllowedMediaUrl(storedCurrentMedia, "image")
        ? storedCurrentMedia
        : DEFAULT_IMAGE_URL;

    /*
     * Select the active media according to the
     * current media type.
     */
    const mediaUrl = mediaType === "video" ? videoUrl : imageUrl;

    return NextResponse.json({
      id: heroSettings.id,

      headlineLine1: heroSettings.headlineLine1 ?? DEFAULT_HEADLINE_LINE_1,

      headlineLine2: heroSettings.headlineLine2 ?? DEFAULT_HEADLINE_LINE_2,

      description: heroSettings.description ?? DEFAULT_DESCRIPTION,

      mediaType,

      mediaUrl,

      videoUrl,

      imageUrl,

      mediaOpacity: heroSettings.mediaOpacity ?? DEFAULT_MEDIA_OPACITY,

      clients: normalizeClients(heroSettings.clients),
    });
  } catch (error) {
    console.error("Error fetching hero settings:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch hero settings.",
      },
      {
        status: 500,
      },
    );
  }
}

/* =========================================================
   POST
   SAVE SETTINGS OR UPLOAD MEDIA
========================================================= */

export async function POST(req: Request) {
  const requestStartedAt = Date.now();

  try {
    const contentTypeStartedAt = Date.now();

    const contentType = req.headers.get("content-type") || "";

    console.log(
      `[Hero POST] content-type: ${Date.now() - contentTypeStartedAt}ms`,
    );

    /* =====================================================
       MULTIPART FORM DATA
    ===================================================== */

    if (contentType.includes("multipart/form-data")) {
      const formDataStartedAt = Date.now();

      const formData = await req.formData();

      console.log(
        `[Hero POST] formData(): ${Date.now() - formDataStartedAt}ms`,
      );

      const fileEntry = formData.get("file");

      const requestedMediaType = normalizeMediaType(formData.get("mediaType"));

      if (!(fileEntry instanceof File)) {
        return NextResponse.json(
          {
            success: false,
            error: "No media file was provided.",
          },
          {
            status: 400,
          },
        );
      }

      const file = fileEntry;

      const validationStartedAt = Date.now();

      const fileValidationError = validateUploadedFile(
        file,
        requestedMediaType,
      );

      console.log(
        `[Hero POST] file validation: ${Date.now() - validationStartedAt}ms`,
      );

      if (fileValidationError) {
        return NextResponse.json(
          {
            success: false,
            error: fileValidationError,
          },
          {
            status: 400,
          },
        );
      }

      /*
       * Convert the uploaded file to Base64.
       *
       * Nothing is written to /public.
       */
      const conversionStartedAt = Date.now();

      const mediaDataUrl = await fileToDataUrl(file);

      console.log(
        `[Hero POST] fileToDataUrl(): ${Date.now() - conversionStartedAt}ms`,
      );

      const existingStartedAt = Date.now();

      const existing = await prisma.heroSettings.findFirst();

      console.log(
        `[Hero POST] upload findFirst(): ${Date.now() - existingStartedAt}ms`,
      );

      let updatedSettings;

      if (existing) {
        /*
         * Replace only the media belonging to the
         * uploaded type.
         *
         * The other media type remains untouched.
         */
        const updateStartedAt = Date.now();

        updatedSettings = await prisma.heroSettings.update({
          where: {
            id: existing.id,
          },

          data:
            requestedMediaType === "video"
              ? {
                  mediaType: "video",

                  mediaUrl: mediaDataUrl,

                  videoUrl: mediaDataUrl,
                }
              : {
                  mediaType: "image",

                  mediaUrl: mediaDataUrl,

                  imageUrl: mediaDataUrl,
                },
        });

        console.log(
          `[Hero POST] upload update(): ${Date.now() - updateStartedAt}ms`,
        );
      } else {
        /*
         * First Hero record.
         */
        const createStartedAt = Date.now();

        updatedSettings = await prisma.heroSettings.create({
          data: {
            id: "hero-singleton-id",

            headlineLine1: DEFAULT_HEADLINE_LINE_1,

            headlineLine2: DEFAULT_HEADLINE_LINE_2,

            description: DEFAULT_DESCRIPTION,

            mediaType: requestedMediaType,

            mediaUrl: mediaDataUrl,

            videoUrl:
              requestedMediaType === "video" ? mediaDataUrl : DEFAULT_VIDEO_URL,

            imageUrl:
              requestedMediaType === "image" ? mediaDataUrl : DEFAULT_IMAGE_URL,

            mediaOpacity: DEFAULT_MEDIA_OPACITY,

            clients: DEFAULT_CLIENTS,
          },
        });

        console.log(
          `[Hero POST] upload create(): ${Date.now() - createStartedAt}ms`,
        );
      }

      const revalidateStartedAt = Date.now();

      revalidatePath("/");

      console.log(
        `[Hero POST] upload revalidatePath(): ${
          Date.now() - revalidateStartedAt
        }ms`,
      );

      console.log(
        `[Hero POST] upload total: ${Date.now() - requestStartedAt}ms`,
      );

      return NextResponse.json({
        success: true,

        message: "Hero media uploaded successfully.",

        url: mediaDataUrl,

        fileName: file.name,

        fileSize: file.size,

        mediaType: requestedMediaType,

        data: updatedSettings,
      });
    }

    /* =====================================================
       JSON
    ===================================================== */

    if (contentType.includes("application/json")) {
      const jsonStartedAt = Date.now();

      const body = (await req.json()) as HeroRequestBody;

      console.log(
        `[Hero POST] request.json(): ${Date.now() - jsonStartedAt}ms`,
      );

      const normalizationStartedAt = Date.now();

      const headlineLine1 = normalizeString(body.headlineLine1);

      const headlineLine2 = normalizeString(body.headlineLine2);

      const description = normalizeString(body.description);

      const mediaType = normalizeMediaType(body.mediaType);

      const mediaUrl = normalizeString(body.mediaUrl);

      const videoUrl = normalizeString(body.videoUrl);

      const imageUrl = normalizeString(body.imageUrl);

      const mediaOpacity = normalizeOpacity(body.mediaOpacity);

      const clients = normalizeClients(body.clients);

      console.log(
        `[Hero POST] normalization: ${Date.now() - normalizationStartedAt}ms`,
      );

      /* ---------------------------------------------------
         VALIDATION
      --------------------------------------------------- */

      const validationStartedAt = Date.now();

      if (!headlineLine1) {
        return NextResponse.json(
          {
            error: "Headline Line 1 cannot be empty.",
          },
          {
            status: 400,
          },
        );
      }

      if (!headlineLine2) {
        return NextResponse.json(
          {
            error: "Headline Line 2 cannot be empty.",
          },
          {
            status: 400,
          },
        );
      }

      if (!description) {
        return NextResponse.json(
          {
            error: "Description cannot be empty.",
          },
          {
            status: 400,
          },
        );
      }

      if (!mediaUrl || !isAllowedMediaUrl(mediaUrl, mediaType)) {
        return NextResponse.json(
          {
            error: "Invalid active background media.",
          },
          {
            status: 400,
          },
        );
      }

      /*
       * Validate the stored video only when
       * one is provided.
       */
      if (videoUrl && !isAllowedMediaUrl(videoUrl, "video")) {
        return NextResponse.json(
          {
            error: "Invalid stored video media.",
          },
          {
            status: 400,
          },
        );
      }

      /*
       * Validate the stored image only when
       * one is provided.
       */
      if (imageUrl && !isAllowedMediaUrl(imageUrl, "image")) {
        return NextResponse.json(
          {
            error: "Invalid stored image media.",
          },
          {
            status: 400,
          },
        );
      }

      console.log(
        `[Hero POST] validation: ${Date.now() - validationStartedAt}ms`,
      );

      /* ---------------------------------------------------
         DATABASE UPDATE
      --------------------------------------------------- */

      /*
       * The Hero record is a singleton.
       *
       * The normal JSON save must not rewrite the potentially
       * very large Base64 video/image values. The admin form
       * already has a separate multipart upload flow for
       * changing media.
       *
       * GET resolves the active media from mediaType + the
       * stored videoUrl/imageUrl, so mediaUrl does not need
       * to be rewritten during a normal settings save.
       */
      const upsertStartedAt = Date.now();

      const updatedSettings = await prisma.heroSettings.upsert({
        where: {
          id: "hero-singleton-id",
        },

        update: {
          headlineLine1,

          headlineLine2,

          description,

          mediaType,

          mediaOpacity,

          clients,
        },

        create: {
          id: "hero-singleton-id",

          headlineLine1,

          headlineLine2,

          description,

          mediaType,

          mediaUrl:
            mediaType === "video" ? DEFAULT_VIDEO_URL : DEFAULT_IMAGE_URL,

          videoUrl: DEFAULT_VIDEO_URL,

          imageUrl: DEFAULT_IMAGE_URL,

          mediaOpacity,

          clients,
        },
      });

      console.log(`[Hero POST] upsert(): ${Date.now() - upsertStartedAt}ms`);

      const revalidateStartedAt = Date.now();

      revalidatePath("/");

      console.log(
        `[Hero POST] revalidatePath(): ${Date.now() - revalidateStartedAt}ms`,
      );

      console.log(`[Hero POST] total: ${Date.now() - requestStartedAt}ms`);

      return NextResponse.json({
        success: true,

        message: "Hero settings saved successfully.",

        data: updatedSettings,
      });
    }

    /* =====================================================
       UNSUPPORTED CONTENT TYPE
    ===================================================== */

    return NextResponse.json(
      {
        success: false,

        error: "Unsupported request type. Use JSON or multipart/form-data.",
      },
      {
        status: 415,
      },
    );
  } catch (error) {
    console.error("Error updating Hero settings:", error);

    console.log(`[Hero POST] failed after: ${Date.now() - requestStartedAt}ms`);

    return NextResponse.json(
      {
        success: false,

        error: "Failed to update Hero settings.",
      },
      {
        status: 500,
      },
    );
  }
}
