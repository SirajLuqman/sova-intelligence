"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export type TabKey = "mission" | "program" | "impact";

export interface TabContent {
  tag: string;
  title: string;
  description: string;
  highlight: string;
}

export interface AboutData {
  sectionTitle?: string | null;
  tabData?: Partial<Record<TabKey, TabContent>> | null;
  imagePath?: string | null;
  overlayLabel?: string | null;
  overlayTitle?: string | null;
  overlayBadge?: string | null;
}

interface AboutProps {
  data?: AboutData | null;
}

const TABS: readonly TabKey[] = ["mission", "program", "impact"];

const TAB_LABELS: Record<TabKey, string> = {
  mission: "Overview",
  program: "SOVA Rise™",
  impact: "Our Impact",
};

export default function About({ data }: AboutProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("mission");

  const availableTabs = useMemo(() => {
    if (!data?.tabData) {
      return [];
    }

    return TABS.filter((tab) => Boolean(data.tabData?.[tab]));
  }, [data]);

  useEffect(() => {
    if (availableTabs.length === 0) {
      return;
    }

    if (!data?.tabData?.[activeTab]) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(availableTabs[0]);
    }
  }, [activeTab, availableTabs, data?.tabData]);

  if (!data || availableTabs.length === 0) {
    return null;
  }

  const content = data.tabData?.[activeTab];

  if (!content) {
    return null;
  }

  return (
    <section
      id="about"
      className="relative w-full overflow-hidden border-b border-stone-300/60 bg-[#EFECE6] px-8 py-16 font-sans text-stone-900 md:px-16 md:py-20"
    >
      {/* About Heading */}
      {data.sectionTitle && (
        <div className="mx-auto mb-10 max-w-7xl border-b border-stone-300/80 pb-6">
          <h2 className="font-serif text-4xl font-normal tracking-tight text-stone-950 sm:text-5xl">
            {data.sectionTitle}
          </h2>
        </div>
      )}

      {/* Main Content */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
        {/* Content */}
        <div className="space-y-7 lg:col-span-7">
          {/* Tabs */}
          <div className="flex w-fit flex-wrap items-center gap-2 rounded-lg border border-[#D9D5CD] bg-stone-300/50 p-1.5">
            {availableTabs.map((tab) => {
              const isActive = activeTab === tab;

              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  aria-pressed={isActive}
                  className={`cursor-pointer rounded-md px-5 py-2 text-xs font-medium uppercase tracking-wider transition-all ${
                    isActive
                      ? "bg-stone-950 font-semibold text-amber-400 shadow-md"
                      : "text-stone-700 hover:bg-white/60 hover:text-stone-950"
                  }`}
                >
                  {TAB_LABELS[tab]}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="min-h-[210px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{
                  opacity: 0,
                  y: 12,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: -12,
                }}
                transition={{
                  duration: 0.35,
                  ease: "easeOut",
                }}
                className="space-y-5"
              >
                <div className="space-y-2.5">
                  {content.tag && (
                    <span className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-amber-800">
                      {content.tag}
                    </span>
                  )}

                  {content.title && (
                    <h3 className="max-w-2xl font-serif text-3xl font-normal leading-[1.15] text-stone-950 sm:text-4xl">
                      {content.title}
                    </h3>
                  )}
                </div>

                {content.description && (
                  <p className="max-w-xl font-sans text-base font-light leading-relaxed text-stone-700 sm:text-lg">
                    {content.description}
                  </p>
                )}

                {content.highlight && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-800" />

                    <span className="rounded-full border border-stone-300 bg-stone-200/70 px-3 py-1.5 font-sans text-xs font-medium uppercase tracking-wider text-stone-700">
                      {content.highlight}
                    </span>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Image */}
        <div className="relative lg:col-span-5">
          {data.imagePath && (
            <div className="group relative h-[400px] w-full overflow-hidden rounded-2xl border border-stone-300 bg-stone-300 shadow-xl sm:h-[460px]">
              <Image
                src={data.imagePath}
                alt={data.sectionTitle || "About SOVA"}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
              />

              {/* Image Overlay */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

              {/* Impact Card */}
              {(data.overlayLabel ||
                data.overlayTitle ||
                data.overlayBadge) && (
                <motion.div
                  initial={{
                    opacity: 0,
                    scale: 0.9,
                  }}
                  whileInView={{
                    opacity: 1,
                    scale: 1,
                  }}
                  viewport={{
                    once: true,
                    amount: 0.2,
                  }}
                  transition={{
                    delay: 0.2,
                    duration: 0.4,
                  }}
                  className="absolute bottom-5 left-5 right-5 rounded-xl border border-white/50 bg-white/95 p-4 text-stone-900 shadow-lg backdrop-blur-md"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      {data.overlayLabel && (
                        <div className="font-serif text-xs uppercase tracking-wider text-stone-500">
                          {data.overlayLabel}
                        </div>
                      )}

                      {data.overlayTitle && (
                        <div className="mt-1 font-serif text-lg font-medium leading-tight text-stone-950">
                          {data.overlayTitle}
                        </div>
                      )}
                    </div>

                    {data.overlayBadge && (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-950 font-serif text-xs text-amber-400">
                        {data.overlayBadge}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
