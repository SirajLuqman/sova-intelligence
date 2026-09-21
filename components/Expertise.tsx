"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ChevronRight } from "lucide-react";

export interface ExpertisePillar {
  id: string;
  category: string;
  title: string;
  description: string;
  highlights: string[];
}

export interface ExpertiseData {
  sectionTitle?: string | null;
  pillars?: ExpertisePillar[] | null;
}

export default function Expertise({ data }: { data?: ExpertiseData | null }) {
  const [activePillar, setActivePillar] = useState(0);

  const expertise = data ?? {};

  const pillars = Array.isArray(expertise.pillars)
    ? expertise.pillars.filter(Boolean)
    : [];

  if (pillars.length === 0) {
    return null;
  }

  const safeActivePillar = activePillar < pillars.length ? activePillar : 0;

  const activeItem = pillars[safeActivePillar];

  return (
    <section
      id="expertise"
      className="relative w-full overflow-hidden border-b border-stone-300/70 bg-[#F8F6F1] px-8 py-24 text-stone-900 md:px-16"
    >
      {/* =====================================================
          BACKGROUND DECORATION
          CSS ONLY — NO DATA / DB IMPACT
      ===================================================== */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 top-20 h-96 w-96 rounded-full bg-amber-200/20 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 bottom-0 h-80 w-80 rounded-full bg-stone-300/20 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[12%] top-0 h-32 w-px bg-gradient-to-b from-transparent via-amber-700/20 to-transparent"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[8%] bottom-0 h-24 w-px bg-gradient-to-t from-transparent via-amber-700/15 to-transparent"
      />

      <div className="relative mx-auto max-w-7xl space-y-12">
        {/* =====================================================
            SECTION HEADER
        ===================================================== */}

        {expertise.sectionTitle?.trim() && (
          <div className="relative border-b border-stone-300/80 pb-6">
            <h2 className="text-4xl font-normal tracking-tight text-stone-950 sm:text-5xl">
              {expertise.sectionTitle}
            </h2>
          </div>
        )}

        {/* =====================================================
            MAIN CONTENT
        ===================================================== */}

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* ===================================================
              LEFT — PILLARS
          =================================================== */}

          <div className="space-y-3 lg:col-span-5">
            {pillars.map((pillar, index) => {
              const isActive = safeActivePillar === index;

              return (
                <motion.button
                  key={`${pillar.id}-${index}`}
                  type="button"
                  onClick={() => setActivePillar(index)}
                  aria-pressed={isActive}
                  whileHover={{ x: isActive ? 5 : 3 }}
                  transition={{
                    duration: 0.25,
                    ease: "easeOut",
                  }}
                  className={`group relative w-full cursor-pointer overflow-hidden rounded-xl border p-5 text-left transition-all duration-300 sm:p-6 ${
                    isActive
                      ? "border-amber-800/30 bg-gradient-to-r from-[#F1E7D7] via-[#F7F1E7] to-white shadow-md ring-1 ring-amber-800/10"
                      : "border-stone-300/70 bg-white/70 hover:border-stone-400/80 hover:bg-white hover:shadow-sm"
                  }`}
                >
                  {/* Active vertical accent */}

                  <span
                    aria-hidden="true"
                    className={`absolute left-0 top-0 h-full w-1 transition-all duration-300 ${
                      isActive
                        ? "bg-amber-800"
                        : "bg-transparent group-hover:bg-amber-800/30"
                    }`}
                  />

                  {/* Subtle active glow */}

                  {isActive && (
                    <motion.span
                      layoutId="expertise-active-glow"
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-amber-300/20 blur-2xl"
                    />
                  )}

                  <div className="relative flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-4">
                      {/* CSS number */}

                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-[10px] font-medium tracking-wider transition-all duration-300 ${
                          isActive
                            ? "border-amber-800/30 bg-white text-amber-900 shadow-sm"
                            : "border-stone-300 bg-[#FAF9F5] text-stone-500 group-hover:border-amber-800/30 group-hover:text-amber-900"
                        }`}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </div>

                      <div className="min-w-0">
                        <span
                          className={`mb-1 block text-[10px] font-semibold uppercase tracking-[0.2em] transition-colors duration-300 ${
                            isActive ? "text-amber-900" : "text-stone-500"
                          }`}
                        >
                          Pillar {pillar.id}
                        </span>

                        <h3 className="text-lg font-medium leading-tight text-stone-900 sm:text-xl">
                          {pillar.category}
                        </h3>
                      </div>
                    </div>

                    <ChevronRight
                      className={`h-4 w-4 shrink-0 transition-all duration-300 ${
                        isActive
                          ? "translate-x-1 text-amber-800"
                          : "text-stone-400 group-hover:translate-x-1 group-hover:text-amber-800"
                      }`}
                    />
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* ===================================================
              RIGHT — ACTIVE EXPERTISE
          =================================================== */}

          <div className="relative lg:col-span-7">
            {/* Soft background layer */}

            <div
              aria-hidden="true"
              className="absolute -inset-3 rounded-[1.5rem] bg-gradient-to-br from-amber-200/20 via-transparent to-stone-300/20 blur-xl"
            />

            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeItem.id}-${safeActivePillar}`}
                initial={{
                  opacity: 0,
                  x: 20,
                  scale: 0.985,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  x: -20,
                  scale: 0.985,
                }}
                transition={{
                  duration: 0.35,
                  ease: "easeOut",
                }}
                className="relative overflow-hidden rounded-2xl border border-stone-300/80 bg-white shadow-lg shadow-stone-900/[0.04]"
              >
                {/* =================================================
                    TOP ACCENT
                ================================================= */}

                <div
                  aria-hidden="true"
                  className="h-1 w-full bg-gradient-to-r from-amber-800 via-amber-600/70 to-transparent"
                />

                <div className="p-7 sm:p-9">
                  <div className="space-y-6">
                    {/* =================================================
                        TITLE
                    ================================================= */}

                    <div className="relative border-b border-stone-200 pb-5">
                      <div
                        aria-hidden="true"
                        className="mb-4 h-1 w-10 rounded-full bg-amber-800"
                      />

                      <h3 className="text-2xl font-normal leading-tight text-stone-900 sm:text-3xl">
                        {activeItem.title}
                      </h3>
                    </div>

                    {/* =================================================
                        DESCRIPTION
                    ================================================= */}

                    {activeItem.description?.trim() && (
                      <p className="text-sm font-light leading-relaxed text-stone-700 sm:text-base">
                        {activeItem.description}
                      </p>
                    )}

                    {/* =================================================
                        HIGHLIGHTS
                    ================================================= */}

                    {Array.isArray(activeItem.highlights) &&
                      activeItem.highlights.length > 0 && (
                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                          {activeItem.highlights.map((highlight, index) => {
                            const text = highlight?.trim();

                            if (!text) {
                              return null;
                            }

                            return (
                              <motion.div
                                key={`${text}-${index}`}
                                initial={{
                                  opacity: 0,
                                  y: 8,
                                }}
                                animate={{
                                  opacity: 1,
                                  y: 0,
                                }}
                                transition={{
                                  duration: 0.25,
                                  delay: index * 0.035,
                                  ease: "easeOut",
                                }}
                                className="group relative overflow-hidden rounded-lg border border-stone-200 bg-[#FAF9F5] p-3 transition-all duration-300 hover:border-amber-800/25 hover:bg-[#F7F0E5] hover:shadow-sm"
                              >
                                {/* Hover accent */}

                                <span
                                  aria-hidden="true"
                                  className="absolute left-0 top-0 h-full w-0.5 bg-amber-800/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                                />

                                <div className="flex items-start gap-2.5">
                                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-800" />

                                  <span className="text-xs leading-snug text-stone-800 sm:text-sm">
                                    {text}
                                  </span>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                  </div>
                </div>

                {/* =================================================
                    BOTTOM DECORATIVE GRADIENT
                ================================================= */}

                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-0 right-0 h-24 w-48 bg-gradient-to-tl from-amber-100/30 to-transparent"
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
