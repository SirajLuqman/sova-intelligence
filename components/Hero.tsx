import { prisma } from "@/lib/prisma";
import Image from "next/image";

export interface HeroData {
  headlineLine1?: string;
  headlineLine2?: string;
  description?: string;

  mediaType?: "video" | "image";

  mediaUrl?: string;
  videoUrl?: string;
  imageUrl?: string;

  mediaOpacity?: string | number;
  clients?: string[];
}

const DEFAULT_HEADLINE_LINE_1 = "Practice";
const DEFAULT_HEADLINE_LINE_2 = "Made Perfect";

const DEFAULT_DESCRIPTION =
  "Today’s top institutions and organizations trust SOVA to elevate their operational capability and navigate complexity with practical AI.";

const DEFAULT_MEDIA_TYPE: "video" | "image" = "video";
const DEFAULT_VIDEO_URL = "/videos/hero-bg.mp4";
const DEFAULT_IMAGE_URL = "/images/hero-bg.png";
const DEFAULT_MEDIA_OPACITY = 45;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/* =========================================================
   COMPONENT
========================================================= */

export default async function Hero() {
  const data = await prisma.heroSettings.findFirst();

  /* -------------------------------------------------------
     TEXT CONTENT
  ------------------------------------------------------- */

  const line1 = data?.headlineLine1?.trim() || DEFAULT_HEADLINE_LINE_1;

  const line2 = data?.headlineLine2?.trim() || DEFAULT_HEADLINE_LINE_2;

  const descriptionText = data?.description?.trim() || DEFAULT_DESCRIPTION;

  /* -------------------------------------------------------
     MEDIA TYPE
  ------------------------------------------------------- */

  const bgMediaType =
    data?.mediaType === "image" ? "image" : DEFAULT_MEDIA_TYPE;

  const storedVideoUrl = data?.videoUrl?.trim() || "";

  const storedImageUrl = data?.imageUrl?.trim() || "";

  const storedMediaUrl = data?.mediaUrl?.trim() || "";

  const bgMediaUrl =
    bgMediaType === "video"
      ? storedVideoUrl ||
        (storedMediaUrl.startsWith("data:video/")
          ? storedMediaUrl
          : DEFAULT_VIDEO_URL)
      : storedImageUrl ||
        (storedMediaUrl.startsWith("data:image/")
          ? storedMediaUrl
          : DEFAULT_IMAGE_URL);

  /* -------------------------------------------------------
     MEDIA OPACITY
  ------------------------------------------------------- */

  const parsedOpacity = Number(data?.mediaOpacity ?? DEFAULT_MEDIA_OPACITY);

  const bgOpacity =
    clamp(
      Number.isFinite(parsedOpacity) ? parsedOpacity : DEFAULT_MEDIA_OPACITY,
      0,
      100,
    ) / 100;

  /* -------------------------------------------------------
     CLIENTS
  ------------------------------------------------------- */

  const rawClients = Array.isArray(data?.clients)
    ? data.clients.filter(
        (client): client is string =>
          typeof client === "string" && client.trim().length > 0,
      )
    : [];

  const clientList = rawClients;

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  return (
    <section className="relative flex min-h-[85vh] w-full flex-col justify-between overflow-hidden border-b border-neutral-900 bg-neutral-950 pt-28 pb-10 font-sans text-white sm:pt-32 sm:pb-12">
      {/* =====================================================
          BACKGROUND MEDIA
      ===================================================== */}

      <div
        className="absolute inset-0 z-0 overflow-hidden bg-neutral-950"
        aria-hidden="true"
      >
        {bgMediaType === "image" ? (
          <Image
            src={bgMediaUrl}
            alt=""
            aria-hidden="true"
            fill
            priority
            sizes="100vw"
            style={{
              opacity: bgOpacity,
            }}
            className="object-cover object-center transition-opacity duration-300"
          />
        ) : (
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            src={bgMediaUrl}
            aria-hidden="true"
            style={{
              opacity: bgOpacity,
            }}
            className="h-full w-full object-cover object-center transition-opacity duration-300"
          />
        )}

        {/* Left-to-right content readability overlay */}
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-neutral-950 via-neutral-950/80 to-transparent" />

        {/* Top-to-bottom depth overlay */}
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-neutral-950 via-transparent to-neutral-950/40" />
      </div>

      {/* =====================================================
          MAIN HERO CONTENT
      ===================================================== */}

      <div className="relative z-20 my-auto w-full max-w-3xl px-8 md:px-16">
        <div className="max-w-[720px] space-y-7 sm:space-y-8">
          {/* Editorial Headline */}

          <h1 className="font-serif text-5xl font-normal leading-[1.02] tracking-tight text-stone-100 sm:text-6xl lg:text-7xl">
            <span className="block lg:whitespace-nowrap">{line1}</span>

            {line2 && (
              <span className="mt-1 block text-3xl sm:text-4xl lg:text-5xl lg:whitespace-nowrap">
                {line2}
              </span>
            )}
          </h1>

          {/* Supporting Description */}

          {descriptionText && (
            <p className="max-w-lg text-base font-light leading-relaxed text-stone-300 sm:text-lg">
              {descriptionText}
            </p>
          )}
        </div>
      </div>

      {/* =====================================================
          CLIENT TICKER
      ===================================================== */}

      <div className="relative z-20 mt-12 flex items-center justify-between gap-6 overflow-hidden border-t border-white/15 pt-8 sm:mt-16 sm:pt-10">
        {/* Scrolling Clients */}

        <div className="relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="flex w-max items-center gap-10 whitespace-nowrap font-serif text-xs uppercase tracking-[0.2em] text-stone-400 animate-marquee">
            {[...clientList, ...clientList].map((client, index) => (
              <div
                key={`${client}-${index}`}
                className="flex items-center gap-10"
              >
                <span className="transition-colors hover:text-stone-200">
                  {client}
                </span>

                <span className="text-[8px] text-stone-600" aria-hidden="true">
                  ◆
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Our Clients Label */}

        <div className="z-30 shrink-0 bg-neutral-950/50 pl-4 pr-8 backdrop-blur-sm md:pr-16">
          <button
            type="button"
            aria-label="Our Clients"
            className="cursor-default rounded border border-stone-700 px-4 py-2 font-sans text-xs text-stone-300"
          >
            Our Clients
          </button>
        </div>
      </div>
    </section>
  );
}
