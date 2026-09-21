"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Layers,
  Search,
  Code2,
  Rocket,
  Cpu,
  BarChart,
  Settings,
  LucideIcon,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

export interface MethodologyStep {
  id: string;
  title: string;
  tagline: string;
  iconName: string;
  description: string;
  deliverables: string[];
  timeline: string;
}

export interface MethodologyData {
  id?: number;
  sectionTitle: string;
  steps: MethodologyStep[];
}

interface MethodologyProps {
  data?: MethodologyData | null;
}

/* =========================================================
   ICON MAP
========================================================= */

const ICON_MAP: Record<string, LucideIcon> = {
  Search,
  Code2,
  Rocket,
  Cpu,
  BarChart,
  Settings,
};

/* =========================================================
   COMPONENT
========================================================= */

export default function Methodology({ data }: MethodologyProps) {
  /*
   * No static methodology content is used here.
   * Data is supplied through props by the parent.
   *
   * If no valid data is available, the section safely
   * renders nothing rather than displaying hardcoded content.
   */
  if (
    !data ||
    !data.sectionTitle?.trim() ||
    !Array.isArray(data.steps) ||
    data.steps.length === 0
  ) {
    return null;
  }

  const steps = data.steps.slice(0, 3);

  if (steps.length === 0) {
    return null;
  }

  return (
    <section
      id="methodology"
      className="border-b border-stone-300/60 bg-[#FAF9F5] px-8 py-20 font-sans text-stone-900 md:px-16 md:py-24"
    >
      <div className="mx-auto max-w-7xl">
        {/* =====================================================
            SECTION HEADER
        ===================================================== */}

        <div className="mx-auto mb-12 max-w-7xl border-b border-stone-300/80 pb-6">
          <h2 className="font-serif text-4xl font-normal tracking-tight text-stone-950 sm:text-5xl">
            {data.sectionTitle}
          </h2>
        </div>

        {/* =====================================================
            METHODOLOGY STEPS
        ===================================================== */}

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = ICON_MAP[step.iconName] || Settings;

            return (
              <motion.article
                key={step.id}
                initial={{
                  opacity: 0,
                  y: 24,
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                }}
                viewport={{
                  once: true,
                  amount: 0.15,
                }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={{
                  y: -6,
                }}
                className="group flex h-full flex-col rounded-2xl border border-stone-200 bg-white/90 p-7 shadow-sm backdrop-blur-sm transition-shadow duration-300 hover:shadow-lg"
              >
                {/* =================================================
                    ICON
                ================================================= */}

                <div className="mb-7 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-950 text-amber-400 transition-transform duration-300 group-hover:scale-105">
                    <Icon className="h-5 w-5" />
                  </div>

                  <ArrowRight className="h-5 w-5 text-stone-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-stone-700" />
                </div>

                {/* =================================================
                    TITLE
                ================================================= */}

                <div>
                  {step.tagline && (
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-800">
                      {step.tagline}
                    </p>
                  )}

                  {step.title && (
                    <h3 className="text-2xl font-semibold tracking-tight text-stone-950">
                      {step.title}
                    </h3>
                  )}

                  {step.description && (
                    <p className="mt-4 text-sm leading-6 text-stone-600">
                      {step.description}
                    </p>
                  )}
                </div>

                {/* =================================================
                    DELIVERABLES
                ================================================= */}

                {step.deliverables?.length > 0 && (
                  <div className="mt-7 rounded-xl border border-stone-200 bg-stone-50/80 p-4.5">
                    <div className="mb-4 flex items-center gap-2">
                      <Layers className="h-4 w-4 text-stone-700" />

                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-700">
                        Deliverables
                      </span>
                    </div>

                    <ul className="space-y-3">
                      {step.deliverables.map(
                        (deliverable, deliverableIndex) => (
                          <li
                            key={`${step.id}-deliverable-${deliverableIndex}`}
                            className="flex items-start gap-3 text-sm leading-5 text-stone-600"
                          >
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-800" />

                            <span>{deliverable}</span>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                )}

                {/* =================================================
                    TIMELINE
                ================================================= */}

                {step.timeline && (
                  <div className="mt-auto flex items-center justify-between border-t border-stone-200 pt-5">
                    <div className="flex items-center gap-2 text-stone-500">
                      <Clock className="h-4 w-4" />

                      <span className="text-xs font-medium">
                        {step.timeline}
                      </span>
                    </div>

                    <span className="text-xs font-medium text-amber-800">
                      Phase {index + 1}
                    </span>
                  </div>
                )}
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
