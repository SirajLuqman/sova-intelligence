"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Save,
  AlertCircle,
  Search,
  Code2,
  Rocket,
  Cpu,
  BarChart,
  Settings,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

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

/* =========================================================
   ICONS
========================================================= */

export const AVAILABLE_ICONS = [
  { name: "Search", icon: Search },
  { name: "Code2", icon: Code2 },
  { name: "Rocket", icon: Rocket },
  { name: "Cpu", icon: Cpu },
  { name: "BarChart", icon: BarChart },
  { name: "Settings", icon: Settings },
];

/* =========================================================
   LIMITS
========================================================= */

export const METHODOLOGY_LIMITS = {
  SECTION_TITLE: {
    maxChars: 40,
    maxWords: 6,
  },

  STEP_TAGLINE: {
    maxChars: 25,
  },

  STEP_TITLE: {
    maxChars: 35,
    maxWords: 5,
  },

  STEP_DESC: {
    maxChars: 180,
    maxWords: 25,
  },

  TIMELINE: {
    maxChars: 20,
  },

  DELIVERABLE_ITEM: {
    maxChars: 50,
    maxWords: 8,
  },

  MAX_DELIVERABLES: 3,

  TOTAL_STEPS: 3,
};

/* =========================================================
   HELPERS
========================================================= */

const countWords = (text: string) =>
  text.trim() ? text.trim().split(/\s+/).length : 0;

const limitWords = (text: string, maxWords: number) => {
  const trimmed = text.trim();

  if (!trimmed) {
    return "";
  }

  const words = trimmed.split(/\s+/);

  if (words.length <= maxWords) {
    return text;
  }

  return words.slice(0, maxWords).join(" ");
};

const enforceLimits = (value: string, maxChars?: number, maxWords?: number) => {
  let result = value;

  if (typeof maxChars === "number") {
    result = result.slice(0, maxChars);
  }

  if (typeof maxWords === "number") {
    result = limitWords(result, maxWords);
  }

  return result;
};

/* =========================================================
   CHARACTER COUNTER
========================================================= */

function CharacterCounter({ current, max }: { current: number; max: number }) {
  const isAtLimit = current >= max;

  return (
    <span
      className={`text-[10px] font-mono font-normal normal-case tracking-normal ${
        isAtLimit ? "font-semibold text-red-600" : "text-stone-400"
      }`}
    >
      {current}/{max}
    </span>
  );
}

/* =========================================================
   FALLBACK DATA
========================================================= */

const createDefaultSteps = (): MethodologyStep[] => [
  {
    id: "1",
    title: "Discover & Define",
    tagline: "Strategic Alignment",
    iconName: "Search",
    description:
      "We begin by listening—understanding your goals, challenges, and data environment to identify where AI creates high-leverage value.",
    deliverables: [
      "Data Maturity & Readiness Assessment",
      "AI Use-Case Prioritization Matrix",
      "Technical Feasibility Roadmap",
    ],
    timeline: "Weeks 1 - 2",
  },
  {
    id: "2",
    title: "Design & Develop",
    tagline: "Custom Engineering",
    iconName: "Code2",
    description:
      "We craft simple, practical AI solutions tailored to your needs. From predictive analytics to smart dashboards, we ensure scalable innovation.",
    deliverables: [
      "Custom ML Model Training & Fine-Tuning",
      "Interactive Analytics & Decision Dashboards",
      "API & Enterprise System Integration",
    ],
    timeline: "Weeks 3 - 6",
  },
  {
    id: "3",
    title: "Deliver & Empower",
    tagline: "Deployment & Scaling",
    iconName: "Rocket",
    description:
      "We integrate our solutions seamlessly, train your teams, and track results to empower smarter decisions and lasting impact.",
    deliverables: [
      "Zero-Downtime System Deployment",
      "Hands-On Team Training & Documentation",
      "Performance Tracking & KPI Monitoring",
    ],
    timeline: "Ongoing Growth",
  },
];

const DEFAULT_DATA: MethodologyData = {
  sectionTitle: "How We Work",
  steps: createDefaultSteps(),
};

/* =========================================================
   COMPONENT
========================================================= */

export default function MethodologyAdminForm() {
  const [formData, setFormData] = useState<MethodologyData>(DEFAULT_DATA);

  const [selectedStepId, setSelectedStepId] = useState<string>(
    DEFAULT_DATA.steps[0].id,
  );

  const [isLoading, setisLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentStep =
    formData.steps.find((step) => step.id === selectedStepId) ||
    formData.steps[0];

  /* =========================================================
     LOAD DATA
  ========================================================= */

  useEffect(() => {
    const loadMethodology = async () => {
      try {
        setisLoading(true);
        setError(null);

        const response = await fetch("/api/methodology", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load methodology settings.");
        }

        const data = await response.json();

        if (!data) {
          setFormData(DEFAULT_DATA);
          setSelectedStepId(DEFAULT_DATA.steps[0].id);
          return;
        }

        const loadedSteps =
          Array.isArray(data.steps) &&
          data.steps.length === METHODOLOGY_LIMITS.TOTAL_STEPS
            ? data.steps
            : createDefaultSteps();

        const loadedData: MethodologyData = {
          id: data.id,

          sectionTitle:
            typeof data.sectionTitle === "string"
              ? enforceLimits(
                  data.sectionTitle,
                  METHODOLOGY_LIMITS.SECTION_TITLE.maxChars,
                  METHODOLOGY_LIMITS.SECTION_TITLE.maxWords,
                )
              : DEFAULT_DATA.sectionTitle,

          steps: loadedSteps.map((step: MethodologyStep, index: number) => ({
            id:
              typeof step.id === "string" && step.id.trim()
                ? step.id
                : String(index + 1),

            title: enforceLimits(
              typeof step.title === "string" ? step.title : "",
              METHODOLOGY_LIMITS.STEP_TITLE.maxChars,
              METHODOLOGY_LIMITS.STEP_TITLE.maxWords,
            ),

            tagline: enforceLimits(
              typeof step.tagline === "string" ? step.tagline : "",
              METHODOLOGY_LIMITS.STEP_TAGLINE.maxChars,
            ),

            iconName:
              typeof step.iconName === "string" &&
              AVAILABLE_ICONS.some((icon) => icon.name === step.iconName)
                ? step.iconName
                : "Settings",

            description: enforceLimits(
              typeof step.description === "string" ? step.description : "",
              METHODOLOGY_LIMITS.STEP_DESC.maxChars,
              METHODOLOGY_LIMITS.STEP_DESC.maxWords,
            ),

            deliverables: Array.isArray(step.deliverables)
              ? step.deliverables
                  .slice(0, METHODOLOGY_LIMITS.MAX_DELIVERABLES)
                  .map((item) =>
                    enforceLimits(
                      typeof item === "string" ? item : "",
                      METHODOLOGY_LIMITS.DELIVERABLE_ITEM.maxChars,
                      METHODOLOGY_LIMITS.DELIVERABLE_ITEM.maxWords,
                    ),
                  )
              : [],

            timeline: enforceLimits(
              typeof step.timeline === "string" ? step.timeline : "",
              METHODOLOGY_LIMITS.TIMELINE.maxChars,
            ),
          })),
        };

        setFormData(loadedData);

        if (loadedData.steps.length > 0) {
          setSelectedStepId(loadedData.steps[0].id);
        }
      } catch (err) {
        console.error("Methodology load error:", err);

        const errorMessage =
          err instanceof Error
            ? err.message
            : "Unable to load methodology settings.";

        setError(errorMessage);

        setFormData(DEFAULT_DATA);
        setSelectedStepId(DEFAULT_DATA.steps[0].id);

        toast.error("Unable to load methodology settings.");
      } finally {
        setisLoading(false);
      }
    };

    loadMethodology();
  }, []);

  /* =========================================================
     SECTION FIELD UPDATE
  ========================================================= */

  const handleSectionFieldChange = (field: "sectionTitle", value: string) => {
    const limitedValue = enforceLimits(
      value,
      METHODOLOGY_LIMITS.SECTION_TITLE.maxChars,
      METHODOLOGY_LIMITS.SECTION_TITLE.maxWords,
    );

    setFormData((prev) => ({
      ...prev,
      [field]: limitedValue,
    }));
  };

  /* =========================================================
     STEP FIELD UPDATE
  ========================================================= */

  const handleUpdateStepField = (
    field: keyof MethodologyStep,
    value: string | string[],
  ) => {
    let limitedValue = value;

    if (typeof value === "string") {
      if (field === "tagline") {
        limitedValue = enforceLimits(
          value,
          METHODOLOGY_LIMITS.STEP_TAGLINE.maxChars,
        );
      }

      if (field === "title") {
        limitedValue = enforceLimits(
          value,
          METHODOLOGY_LIMITS.STEP_TITLE.maxChars,
          METHODOLOGY_LIMITS.STEP_TITLE.maxWords,
        );
      }

      if (field === "description") {
        limitedValue = enforceLimits(
          value,
          METHODOLOGY_LIMITS.STEP_DESC.maxChars,
          METHODOLOGY_LIMITS.STEP_DESC.maxWords,
        );
      }

      if (field === "timeline") {
        limitedValue = enforceLimits(
          value,
          METHODOLOGY_LIMITS.TIMELINE.maxChars,
        );
      }
    }

    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.map((step) =>
        step.id === selectedStepId
          ? {
              ...step,
              [field]: limitedValue,
            }
          : step,
      ),
    }));
  };

  /* =========================================================
     DELIVERABLES
  ========================================================= */

  const handleAddDeliverable = () => {
    if (!currentStep) return;

    if (
      currentStep.deliverables.length >= METHODOLOGY_LIMITS.MAX_DELIVERABLES
    ) {
      toast.error(
        `Each step can have a maximum of ${METHODOLOGY_LIMITS.MAX_DELIVERABLES} deliverables.`,
      );

      return;
    }

    handleUpdateStepField("deliverables", [...currentStep.deliverables, ""]);
  };

  const handleUpdateDeliverable = (index: number, text: string) => {
    if (!currentStep) return;

    const limitedText = enforceLimits(
      text,
      METHODOLOGY_LIMITS.DELIVERABLE_ITEM.maxChars,
      METHODOLOGY_LIMITS.DELIVERABLE_ITEM.maxWords,
    );

    const updated = [...currentStep.deliverables];

    updated[index] = limitedText;

    handleUpdateStepField("deliverables", updated);
  };

  const handleRemoveDeliverable = (index: number) => {
    if (!currentStep) return;

    const updated = currentStep.deliverables.filter(
      (_, itemIndex) => itemIndex !== index,
    );

    handleUpdateStepField("deliverables", updated);
  };

  /* =========================================================
     VALIDATION
  ========================================================= */

  const validateForm = () => {
    if (!formData.sectionTitle.trim()) {
      return "Section title cannot be empty.";
    }

    if (
      formData.sectionTitle.length > METHODOLOGY_LIMITS.SECTION_TITLE.maxChars
    ) {
      return `Section title exceeds ${METHODOLOGY_LIMITS.SECTION_TITLE.maxChars} characters.`;
    }

    if (
      countWords(formData.sectionTitle) >
      METHODOLOGY_LIMITS.SECTION_TITLE.maxWords
    ) {
      return `Section title exceeds ${METHODOLOGY_LIMITS.SECTION_TITLE.maxWords} words.`;
    }

    if (formData.steps.length !== METHODOLOGY_LIMITS.TOTAL_STEPS) {
      return `Methodology must contain exactly ${METHODOLOGY_LIMITS.TOTAL_STEPS} steps.`;
    }

    for (let i = 0; i < formData.steps.length; i++) {
      const step = formData.steps[i];

      if (!step.title.trim()) {
        return `Step ${i + 1} title cannot be empty.`;
      }

      if (!step.tagline.trim()) {
        return `Step ${i + 1} tagline cannot be empty.`;
      }

      if (!step.description.trim()) {
        return `Step ${i + 1} description cannot be empty.`;
      }

      if (!step.timeline.trim()) {
        return `Step ${i + 1} timeline cannot be empty.`;
      }

      if (!step.iconName.trim()) {
        return `Please select an icon for Step ${i + 1}.`;
      }

      if (step.title.length > METHODOLOGY_LIMITS.STEP_TITLE.maxChars) {
        return `Step ${i + 1} title exceeds ${METHODOLOGY_LIMITS.STEP_TITLE.maxChars} characters.`;
      }

      if (countWords(step.title) > METHODOLOGY_LIMITS.STEP_TITLE.maxWords) {
        return `Step ${i + 1} title exceeds ${METHODOLOGY_LIMITS.STEP_TITLE.maxWords} words.`;
      }

      if (step.tagline.length > METHODOLOGY_LIMITS.STEP_TAGLINE.maxChars) {
        return `Step ${i + 1} tagline exceeds ${METHODOLOGY_LIMITS.STEP_TAGLINE.maxChars} characters.`;
      }

      if (step.description.length > METHODOLOGY_LIMITS.STEP_DESC.maxChars) {
        return `Step ${i + 1} description exceeds ${METHODOLOGY_LIMITS.STEP_DESC.maxChars} characters.`;
      }

      if (
        countWords(step.description) > METHODOLOGY_LIMITS.STEP_DESC.maxWords
      ) {
        return `Step ${i + 1} description exceeds ${METHODOLOGY_LIMITS.STEP_DESC.maxWords} words.`;
      }

      if (step.timeline.length > METHODOLOGY_LIMITS.TIMELINE.maxChars) {
        return `Step ${i + 1} timeline exceeds ${METHODOLOGY_LIMITS.TIMELINE.maxChars} characters.`;
      }

      if (step.deliverables.length > METHODOLOGY_LIMITS.MAX_DELIVERABLES) {
        return `Step ${i + 1} can have a maximum of ${METHODOLOGY_LIMITS.MAX_DELIVERABLES} deliverables.`;
      }

      for (let j = 0; j < step.deliverables.length; j++) {
        const deliverable = step.deliverables[j];

        if (!deliverable.trim()) {
          return `Deliverable ${j + 1} in Step ${i + 1} cannot be empty.`;
        }

        if (deliverable.length > METHODOLOGY_LIMITS.DELIVERABLE_ITEM.maxChars) {
          return `Deliverable ${j + 1} in Step ${
            i + 1
          } exceeds ${METHODOLOGY_LIMITS.DELIVERABLE_ITEM.maxChars} characters.`;
        }

        if (
          countWords(deliverable) > METHODOLOGY_LIMITS.DELIVERABLE_ITEM.maxWords
        ) {
          return `Deliverable ${j + 1} in Step ${
            i + 1
          } exceeds ${METHODOLOGY_LIMITS.DELIVERABLE_ITEM.maxWords} words.`;
        }
      }
    }

    return null;
  };

  /* =========================================================
     SAVE
  ========================================================= */

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isSaving) return;

    const validationError = validateForm();

    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setIsSaving(true);

      const payload = {
        sectionBadge: "",
        sectionTitle: formData.sectionTitle,
        sectionDescription: "",
        steps: formData.steps,
      };

      const response = await fetch("/api/methodology", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save methodology.");
      }

      setFormData((prev) => ({
        ...prev,
        id: result.id,
      }));

      toast.success("Changes saved successfully.");
    } catch (err) {
      console.error("Save methodology error:", err);

      toast.error(
        err instanceof Error ? err.message : "Failed to save methodology.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  /* =========================================================
     isLoading STATE
  ========================================================= */

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-stone-200 bg-[#FAF9F5]">
        <div className="flex flex-col items-center gap-3 text-stone-500">
          <Loader2 className="h-6 w-6 animate-spin text-stone-800" />

          <p className="text-xs font-serif tracking-wider">Loading...</p>
        </div>
      </div>
    );
  }

  /* =========================================================
     EMPTY STATE
  ========================================================= */

  if (!currentStep) {
    return (
      <div className="space-y-8 font-sans">
        <div className="rounded-xl border border-stone-200 bg-[#FAF9F5] p-6">
          <div className="flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="h-5 w-5" />
            <span>No methodology steps are available.</span>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     MAIN FORM
  ========================================================= */

  return (
    <div className="space-y-8 font-sans">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* =====================================================
            LOAD ERROR
        ===================================================== */}

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* =====================================================
            SECTION TITLE
        ===================================================== */}

        <section className="space-y-4 rounded-xl border border-stone-200 bg-[#FAF9F5] p-6">
          <div className="flex items-center gap-2 border-b border-stone-200 pb-3">
            <h4 className="text-sm font-serif font-medium uppercase tracking-wider text-stone-900">
              Heading
            </h4>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-end">
              <CharacterCounter
                current={formData.sectionTitle.length}
                max={METHODOLOGY_LIMITS.SECTION_TITLE.maxChars}
              />
            </div>

            <input
              type="text"
              maxLength={METHODOLOGY_LIMITS.SECTION_TITLE.maxChars}
              value={formData.sectionTitle}
              onChange={(e) =>
                handleSectionFieldChange("sectionTitle", e.target.value)
              }
              className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-xs font-serif text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
            />
          </div>
        </section>

        {/* =====================================================
            STEP EDITOR
        ===================================================== */}

        <section className="space-y-6 rounded-xl border border-stone-200 bg-[#FAF9F5] p-6">
          <div className="flex flex-col justify-between gap-3 border-b border-stone-200 pb-3 sm:flex-row sm:items-center">
            <div>
              <h4 className="text-sm font-serif font-medium uppercase tracking-wider text-stone-900">
                Methodology Steps
              </h4>
            </div>

            <div className="inline-flex rounded-lg border border-stone-300 bg-stone-200/70 p-1">
              {formData.steps.map((item, index) => {
                const isActive = selectedStepId === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedStepId(item.id)}
                    aria-pressed={isActive}
                    className={`cursor-pointer rounded-md px-3 py-1 text-xs font-serif uppercase tracking-wider transition-all ${
                      isActive
                        ? "bg-stone-950 font-semibold text-amber-400 shadow-sm"
                        : "text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    Phase {index + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-5">
            {/* =================================================
                STEP INFORMATION
            ================================================== */}

            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* TAGLINE */}

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-widest text-stone-600">
                      Tagline
                    </label>

                    <CharacterCounter
                      current={currentStep.tagline.length}
                      max={METHODOLOGY_LIMITS.STEP_TAGLINE.maxChars}
                    />
                  </div>

                  <input
                    type="text"
                    maxLength={METHODOLOGY_LIMITS.STEP_TAGLINE.maxChars}
                    value={currentStep.tagline}
                    onChange={(e) =>
                      handleUpdateStepField("tagline", e.target.value)
                    }
                    className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                  />
                </div>

                {/* ICON */}

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-widest text-stone-600">
                    Icon
                  </label>

                  <select
                    value={currentStep.iconName}
                    onChange={(e) =>
                      handleUpdateStepField("iconName", e.target.value)
                    }
                    className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                  >
                    {AVAILABLE_ICONS.map((icon) => (
                      <option key={icon.name} value={icon.name}>
                        {icon.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* TITLE */}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-widest text-stone-600">
                    Title
                  </label>

                  <CharacterCounter
                    current={currentStep.title.length}
                    max={METHODOLOGY_LIMITS.STEP_TITLE.maxChars}
                  />
                </div>

                <input
                  type="text"
                  maxLength={METHODOLOGY_LIMITS.STEP_TITLE.maxChars}
                  value={currentStep.title}
                  onChange={(e) =>
                    handleUpdateStepField("title", e.target.value)
                  }
                  className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-xs font-serif text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                />
              </div>

              {/* DESCRIPTION */}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-widest text-stone-600">
                    Description
                  </label>

                  <CharacterCounter
                    current={currentStep.description.length}
                    max={METHODOLOGY_LIMITS.STEP_DESC.maxChars}
                  />
                </div>

                <textarea
                  rows={4}
                  maxLength={METHODOLOGY_LIMITS.STEP_DESC.maxChars}
                  value={currentStep.description}
                  onChange={(e) =>
                    handleUpdateStepField("description", e.target.value)
                  }
                  className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-xs leading-relaxed text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                />
              </div>

              {/* TIMELINE */}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-widest text-stone-600">
                    Timeline
                  </label>

                  <CharacterCounter
                    current={currentStep.timeline.length}
                    max={METHODOLOGY_LIMITS.TIMELINE.maxChars}
                  />
                </div>

                <input
                  type="text"
                  maxLength={METHODOLOGY_LIMITS.TIMELINE.maxChars}
                  value={currentStep.timeline}
                  onChange={(e) =>
                    handleUpdateStepField("timeline", e.target.value)
                  }
                  placeholder="e.g. Weeks 1 - 2"
                  className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                />
              </div>
            </div>

            {/* =================================================
                DELIVERABLES
            ================================================== */}

            <div className="space-y-3 border-t border-stone-200/60 pt-3">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-stone-600">
                    Deliverables
                  </label>

                  <span className="text-[10px] text-stone-400">
                    {currentStep.deliverables.length}/
                    {METHODOLOGY_LIMITS.MAX_DELIVERABLES} items · Up to 3
                    deliverables per step.
                  </span>
                </div>

                {currentStep.deliverables.length <
                  METHODOLOGY_LIMITS.MAX_DELIVERABLES && (
                  <button
                    type="button"
                    onClick={handleAddDeliverable}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-stone-700 transition hover:bg-stone-100 hover:text-stone-900"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Deliverable
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {currentStep.deliverables.map((item, index) => (
                  <div
                    key={`${currentStep.id}-deliverable-${index}`}
                    className="space-y-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-800" />

                      <div className="flex flex-1 items-center justify-between">
                        <span className="font-mono text-[10px] text-stone-400">
                          Item {index + 1}
                        </span>

                        <CharacterCounter
                          current={item.length}
                          max={METHODOLOGY_LIMITS.DELIVERABLE_ITEM.maxChars}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveDeliverable(index)}
                        className="inline-flex cursor-pointer items-center justify-center rounded-lg p-1.5 text-red-600 transition hover:bg-red-50"
                        aria-label="Remove deliverable"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <input
                      type="text"
                      maxLength={METHODOLOGY_LIMITS.DELIVERABLE_ITEM.maxChars}
                      value={item}
                      onChange={(e) =>
                        handleUpdateDeliverable(index, e.target.value)
                      }
                      placeholder="Deliverable title"
                      className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            SAVE
        ===================================================== */}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-stone-900 px-6 py-2.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
