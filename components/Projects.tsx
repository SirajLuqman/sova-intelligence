"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Globe,
  ShieldCheck,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

export interface ProjectData {
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

/* =========================================================
   CONSTANTS
========================================================= */

const IMAGE_INTERVAL_MS = 4500;
const FALLBACK_IMAGE = "/images/project-placeholder.png";

function ProjectIcon({
  icon,
  ...props
}: {
  icon?: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  if (icon === "shieldCheck") {
    return <ShieldCheck {...props} />;
  }

  if (icon === "building2") {
    return <Building2 {...props} />;
  }

  return <Globe {...props} />;
}

function getValidImages(images?: string[]) {
  if (!Array.isArray(images)) {
    return [];
  }

  return images.filter(
    (image): image is string =>
      typeof image === "string" && image.trim().length > 0,
  );
}

/* =========================================================
   COMPONENT
========================================================= */

interface ProjectsProps {
  data?: ProjectData[];
  sectionTitle?: string;
}

export default function Projects({
  data = [],
  sectionTitle = "Our Projects",
}: ProjectsProps) {
  const shouldReduceMotion = useReducedMotion();

  const projects = Array.isArray(data) ? data : [];

  const [activeIndex, setActiveIndex] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);

  const safeActiveIndex =
    projects.length > 0 ? Math.min(activeIndex, projects.length - 1) : 0;

  const activeProject = projects[safeActiveIndex];

  const activeImages = useMemo(
    () => getValidImages(activeProject?.images),
    [activeProject],
  );

  const safeImageIndex =
    activeImages.length > 0 ? Math.min(imageIndex, activeImages.length - 1) : 0;

  /* =========================================================
     PROJECT NAVIGATION
  ========================================================= */

  const goToProject = useCallback(
    (direction: "next" | "previous") => {
      if (projects.length <= 1) {
        return;
      }

      setActiveIndex((current) => {
        if (direction === "next") {
          return (current + 1) % projects.length;
        }

        return (current - 1 + projects.length) % projects.length;
      });

      setImageIndex(0);
    },
    [projects.length],
  );

  /* =========================================================
     IMAGE ROTATION
  ========================================================= */

  useEffect(() => {
    if (shouldReduceMotion || activeImages.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setImageIndex((current) => (current + 1) % activeImages.length);
    }, IMAGE_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [activeImages.length, shouldReduceMotion]);

  /* =========================================================
     KEYBOARD NAVIGATION
  ========================================================= */

  useEffect(() => {
    if (projects.length <= 1) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        goToProject("previous");
      }

      if (event.key === "ArrowRight") {
        goToProject("next");
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [goToProject, projects.length]);

  /* =========================================================
     EMPTY STATE
  ========================================================= */

  if (!projects.length || !activeProject) {
    return null;
  }

  /* =========================================================
     DISPLAY VALUES
  ========================================================= */

  const currentProjectNumber = String(safeActiveIndex + 1).padStart(2, "0");

  const totalProjectNumber = String(projects.length).padStart(2, "0");

  const currentImageNumber = String(safeImageIndex + 1).padStart(2, "0");

  const totalImageNumber = String(activeImages.length).padStart(2, "0");

  const currentImage = activeImages[safeImageIndex] || FALLBACK_IMAGE;

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <section
      id="projects"
      className="relative w-full border-b border-stone-300/70 bg-[#EDEBE5] px-8 py-24 text-stone-900 md:px-16"
    >
      <div className="mx-auto max-w-7xl space-y-12">
        {/* ===================================================
            SECTION HEADING
        =================================================== */}

        <div className="border-b border-stone-400/70 pb-6">
          <h2 className="text-4xl font-normal tracking-tight text-stone-950 sm:text-5xl">
            {sectionTitle}
          </h2>
        </div>

        {/* ===================================================
            PROJECT CONTENT
        =================================================== */}

        <motion.div
          initial={
            shouldReduceMotion
              ? false
              : {
                  opacity: 0,
                  y: 20,
                }
          }
          whileInView={
            shouldReduceMotion
              ? undefined
              : {
                  opacity: 1,
                  y: 0,
                }
          }
          viewport={{
            once: true,
            amount: 0.2,
          }}
          transition={{
            duration: 0.6,
            ease: "easeOut",
          }}
          className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14"
        >
          {/* =================================================
              PROJECT INFORMATION
          ================================================= */}

          <div className="flex min-h-[500px] flex-col lg:col-span-6">
            {/* Project identity */}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D9D5CD] bg-[#F8F5EE] shadow-sm transition-all duration-300 hover:border-amber-700/50 hover:bg-[#F5EFE3]">
                  <ProjectIcon
                    icon={activeProject.icon}
                    size={17}
                    strokeWidth={1.6}
                    className="text-amber-800"
                  />
                </div>

                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-900">
                  {activeProject.badge}
                </span>
              </div>

              <span className="font-mono text-xs tracking-[0.18em] text-stone-500">
                {currentProjectNumber} / {totalProjectNumber}
              </span>
            </div>

            {/* Project information */}

            <div className="mt-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeProject.id}
                  initial={
                    shouldReduceMotion
                      ? false
                      : {
                          opacity: 0,
                          x: 16,
                        }
                  }
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  exit={
                    shouldReduceMotion
                      ? undefined
                      : {
                          opacity: 0,
                          x: -16,
                        }
                  }
                  transition={{
                    duration: 0.35,
                    ease: "easeOut",
                  }}
                >
                  <div>
                    <h3 className="max-w-2xl text-3xl font-normal leading-tight tracking-tight text-stone-950 sm:text-4xl">
                      {activeProject.title}
                    </h3>
                  </div>

                  <p className="mt-6 max-w-xl text-sm font-light leading-relaxed text-stone-700 sm:text-base">
                    {activeProject.description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Project metadata */}

            <div className="mt-9 grid grid-cols-1 overflow-hidden rounded-lg border border-[#CFC8BA] bg-[#FAF8F3] sm:grid-cols-2">
              <div className="py-5 sm:border-r sm:border-[#CFC8BA] sm:pr-7 sm:pl-5">
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-stone-500">
                  Target Partners
                </p>

                <p className="mt-2 text-sm leading-6 text-stone-800">
                  {activeProject.targetPartners}
                </p>
              </div>

              <div className="border-t border-[#D9D5CD] py-5 sm:border-t-0 sm:pl-7 sm:pr-5">
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-stone-500">
                  Focus Domain
                </p>

                <p className="mt-2 text-sm leading-6 text-stone-800">
                  {activeProject.focusDomain}
                </p>
              </div>
            </div>

            {/* Deliverables */}

            <div className="mt-8">
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-stone-500">
                Key Deliverables
              </p>

              <div className="mt-3 space-y-2.5">
                {activeProject.deliverables.map((deliverable, index) => (
                  <div
                    key={`${activeProject.id}-${index}`}
                    className="group flex items-start gap-3"
                  >
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-800 transition-transform duration-200 group-hover:scale-125" />

                    <p className="text-sm leading-6 text-stone-700 transition-colors duration-200 group-hover:text-stone-900">
                      {deliverable}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Project navigation */}

            <div className="mt-auto flex items-center gap-2 pt-8">
              <button
                type="button"
                onClick={() => goToProject("previous")}
                disabled={projects.length <= 1}
                aria-label="Previous project"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D9D5CD] bg-[#F8F5EE] text-stone-700 shadow-sm transition-all duration-200 hover:border-amber-700/60 hover:bg-[#F5EFE3] hover:text-amber-900 disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronLeft size={17} strokeWidth={1.7} />
              </button>

              <button
                type="button"
                onClick={() => goToProject("next")}
                disabled={projects.length <= 1}
                aria-label="Next project"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D9D5CD] bg-[#F8F5EE] text-stone-700 shadow-sm transition-all duration-200 hover:border-amber-700/60 hover:bg-[#F5EFE3] hover:text-amber-900 disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronRight size={17} strokeWidth={1.7} />
              </button>
            </div>
          </div>

          {/* =================================================
              ELEVATED IMAGE
          ================================================= */}

          <div className="flex items-center justify-center lg:col-span-6">
            <div className="relative w-full max-w-[580px] rounded-2xl border border-[#D9D5CD] bg-white/70 p-3 shadow-[0_20px_45px_rgba(41,37,36,0.12)] sm:p-4">
              {/* Subtle accent */}

              <div
                aria-hidden="true"
                className="absolute left-8 right-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-700/50 to-transparent"
              />

              <div className="relative overflow-hidden rounded-xl border border-stone-200 bg-stone-900 shadow-sm">
                <div className="relative aspect-[4/3]">
                  <AnimatePresence mode="sync">
                    <motion.img
                      key={currentImage}
                      src={currentImage}
                      alt={activeProject.title}
                      className="absolute inset-0 h-full w-full object-cover"
                      initial={
                        shouldReduceMotion
                          ? false
                          : {
                              opacity: 0,
                              scale: 1.025,
                            }
                      }
                      animate={{
                        opacity: 1,
                        scale: 1,
                      }}
                      exit={
                        shouldReduceMotion
                          ? undefined
                          : {
                              opacity: 0,
                            }
                      }
                      transition={{
                        duration: 0.65,
                        ease: "easeOut",
                      }}
                    />
                  </AnimatePresence>

                  {/* Image overlay */}

                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/55 via-transparent to-transparent" />

                  {/* Image navigation */}

                  {activeImages.length > 1 && (
                    <div className="absolute bottom-4 left-4 flex items-center gap-3 sm:bottom-5 sm:left-5">
                      <div className="flex gap-1.5">
                        {activeImages.map((image, index) => (
                          <button
                            key={`${image}-${index}`}
                            type="button"
                            onClick={() => setImageIndex(index)}
                            aria-label={`Show image ${index + 1}`}
                            className={`h-1 rounded-full transition-all ${
                              index === safeImageIndex
                                ? "w-7 bg-amber-300"
                                : "w-2.5 bg-white/45 hover:bg-amber-200/80"
                            }`}
                          />
                        ))}
                      </div>

                      <span className="font-mono text-[10px] tracking-[0.18em] text-white/70">
                        {currentImageNumber} / {totalImageNumber}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
