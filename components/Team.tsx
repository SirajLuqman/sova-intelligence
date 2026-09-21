"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, UserRound } from "lucide-react";
import Image from "next/image";

/* =========================================================
   TYPES
========================================================= */

export interface TeamMember {
  id: string;
  name: string;
  designation: string;
  imageUrl: string | null;
}

export interface TeamData {
  sectionTitle: string;
  members: TeamMember[];
}

/* =========================================================
   TEAM CARD
========================================================= */

function TeamCard({ member }: { member: TeamMember }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      whileHover={{ y: -6 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-stone-300/80 bg-[#FAF9F5] shadow-sm transition-all duration-300 hover:border-stone-400 hover:shadow-xl"
    >
      {/* =====================================================
          IMAGE
      ===================================================== */}

      <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-200">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-amber-100/30 via-transparent to-stone-300/30"
        />

        {member.imageUrl ? (
          <Image
            src={member.imageUrl}
            alt={member.name || "Team member"}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="relative z-10 object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
          />
        ) : (
          <div className="relative z-10 flex h-full w-full items-center justify-center text-stone-400">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-stone-300 bg-[#FAF9F5]/80">
              <UserRound className="h-8 w-8 stroke-[1.15]" />
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-stone-950/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 right-0 z-30 h-1 bg-gradient-to-r from-amber-800 via-amber-600/70 to-transparent opacity-70 transition-all duration-300 group-hover:h-1.5 group-hover:opacity-100"
        />
      </div>

      {/* =====================================================
          MEMBER INFORMATION
      ===================================================== */}

      <div className="relative flex flex-1 flex-col justify-center border-t border-stone-200 px-6 py-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 right-0 h-20 w-32 bg-gradient-to-tl from-amber-100/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />

        <div className="relative">
          <h3 className="font-serif text-xl font-normal leading-tight tracking-tight text-stone-950 transition-colors duration-300 group-hover:text-stone-800">
            {member.name}
          </h3>

          <div className="mt-3 flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-px w-5 bg-amber-800/70 transition-all duration-300 group-hover:w-8"
            />

            <p className="text-[10px] font-serif font-bold uppercase tracking-[0.18em] text-amber-900">
              {member.designation}
            </p>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

/* =========================================================
   TEAM CARD SKELETON
========================================================= */

function TeamCardSkeleton() {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        ease: "easeOut",
      }}
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-stone-300/80 bg-[#FAF9F5] shadow-sm"
      aria-hidden="true"
    >
      <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-stone-200 p-4">
        <div className="h-full w-full animate-pulse rounded-lg bg-stone-300/70" />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-1 bg-amber-800/20"
        />
      </div>

      <div className="border-t border-stone-200 px-6 py-6">
        <div className="h-6 w-2/3 animate-pulse rounded bg-stone-200/80" />

        <div className="mt-4 flex items-center gap-2">
          <div className="h-px w-5 animate-pulse bg-amber-800/30" />

          <div className="h-3 w-1/3 animate-pulse rounded bg-stone-200/80" />
        </div>
      </div>
    </motion.article>
  );
}

/* =========================================================
   TEAM SECTION
========================================================= */

export default function Team({ data }: { data: TeamData | null }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(3);

  const members = Array.isArray(data?.members) ? data.members : [];
  const sectionTitle =
    typeof data?.sectionTitle === "string" && data.sectionTitle.trim()
      ? data.sectionTitle.trim()
      : "The people behind our work.";

  const isLoading = false;

  /* -------------------------------------------------------
     RESPONSIVE CAROUSEL

     Mobile  → 1 card
     Tablet  → 2 cards
     Desktop → 3 cards
  ------------------------------------------------------- */

  useEffect(() => {
    const updateVisibleCount = () => {
      if (window.innerWidth < 768) {
        setVisibleCount(1);
      } else if (window.innerWidth < 1024) {
        setVisibleCount(2);
      } else {
        setVisibleCount(3);
      }
    };

    updateVisibleCount();

    window.addEventListener("resize", updateVisibleCount);

    return () => {
      window.removeEventListener("resize", updateVisibleCount);
    };
  }, []);

  /* -------------------------------------------------------
     KEEP CAROUSEL INDEX VALID
  ------------------------------------------------------- */

  useEffect(() => {
    const maximumIndex = Math.max(0, members.length - visibleCount);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentIndex((previous) => Math.min(previous, maximumIndex));
  }, [members.length, visibleCount]);

  /* -------------------------------------------------------
     DO NOT RENDER EMPTY SECTION
  ------------------------------------------------------- */

  if (members.length === 0) {
    return null;
  }

  const maximumIndex = Math.max(0, members.length - visibleCount);

  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < maximumIndex;

  /* -------------------------------------------------------
     CAROUSEL CONTROLS
  ------------------------------------------------------- */

  const handlePrevious = () => {
    if (!canGoPrevious) return;

    setCurrentIndex((previous) => Math.max(0, previous - 1));
  };

  const handleNext = () => {
    if (!canGoNext) return;

    setCurrentIndex((previous) => Math.min(maximumIndex, previous + 1));
  };

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  return (
    <section
      id="team"
      className="relative w-full overflow-hidden border-b border-stone-400/70 bg-[#E9E6DE] px-8 py-28 text-stone-900 md:px-16"
    >
      {/* =====================================================
          SUBTLE BACKGROUND DECORATION
      ===================================================== */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 top-20 h-80 w-80 rounded-full bg-amber-200/20 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 bottom-10 h-72 w-72 rounded-full bg-stone-300/20 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[12%] top-0 h-28 w-px bg-gradient-to-b from-transparent via-amber-800/20 to-transparent"
      />

      <div className="relative mx-auto max-w-7xl space-y-14">
        {/* =================================================
            SECTION HEADER
        ================================================= */}

        <div className="flex items-end justify-between gap-6 border-b border-stone-400/80 pb-8">
          <div className="relative">
            <h2 className="font-serif text-4xl font-normal tracking-tight text-stone-950 sm:text-5xl">
              {sectionTitle}
            </h2>
          </div>

          {!isLoading && members.length > visibleCount && (
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={!canGoPrevious}
                aria-label="Previous team members"
                className="group flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-stone-400 bg-[#FAF9F5] text-stone-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-stone-900 hover:bg-stone-900 hover:text-amber-400 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0 disabled:hover:border-stone-400 disabled:hover:bg-[#FAF9F5] disabled:hover:text-stone-700 disabled:hover:shadow-sm"
              >
                <ChevronLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={!canGoNext}
                aria-label="Next team members"
                className="group flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-stone-400 bg-[#FAF9F5] text-stone-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-stone-900 hover:bg-stone-900 hover:text-amber-400 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0 disabled:hover:border-stone-400 disabled:hover:bg-[#FAF9F5] disabled:hover:text-stone-700 disabled:hover:shadow-sm"
              >
                <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
            </div>
          )}
        </div>

        {/* =================================================
            TEAM CARDS
        ================================================= */}

        {isLoading ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <TeamCardSkeleton />
            <TeamCardSkeleton />
            <TeamCardSkeleton />
          </div>
        ) : (
          <div className="relative">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-gradient-to-r from-amber-100/20 via-transparent to-stone-300/20 blur-2xl"
            />

            <div className="relative overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{
                  transform: `translateX(-${
                    currentIndex * (100 / visibleCount)
                  }%)`,
                }}
              >
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="w-full shrink-0 px-3 md:w-1/2 lg:w-1/3"
                  >
                    <TeamCard member={member} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}