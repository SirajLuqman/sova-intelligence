"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Image from "next/image";

import {
  Award,
  Image as ImageIcon,
  Loader2,
  Save,
  Upload,
  X,
} from "lucide-react";

import { toast } from "sonner";

/* =========================================================
   TYPES
========================================================= */

export type TabKey = "mission" | "program" | "impact";

export interface TabContent {
  tag: string;
  title: string;
  description: string;
  highlight: string;
}

export interface AboutSettingsData {
  sectionTitle: string;
  tabData: Record<TabKey, TabContent>;
  imagePath: string;
  overlayLabel: string;
  overlayTitle: string;
  overlayBadge: string;
}

interface AboutAdminFormProps {
  initialData?: Partial<AboutSettingsData>;
  onSave?: (data: AboutSettingsData) => Promise<void>;
}

/* =========================================================
   CONSTANTS
========================================================= */

const DEFAULT_IMAGE_PATH = "/images/about_Image.png";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

const LIMITS = {
  sectionTitle: 35,

  tabTag: 30,
  tabTitle: 70,
  tabDescription: 300,
  tabHighlight: 45,

  overlayLabel: 25,
  overlayTitle: 45,
  overlayBadge: 8,
} as const;

const TABS: readonly TabKey[] = ["mission", "program", "impact"];

const TAB_LABELS: Record<TabKey, string> = {
  mission: "Overview",
  program: "SOVA Rise™",
  impact: "Our Impact",
};

/* =========================================================
   DEFAULT TAB DATA
========================================================= */

const DEFAULT_TAB_DATA: Record<TabKey, TabContent> = {
  mission: {
    tag: "Our Purpose",
    title: "Practical AI for real-world impact.",
    description:
      "SOVA helps schools, businesses, and communities in Malaysia and beyond apply AI in practical ways. Through targeted training, intelligent automation, and smart data solutions, we empower organizations to make confident, data-driven decisions.",
    highlight: "Decision Intelligence & Automation",
  },

  program: {
    tag: "Flagship Initiative",
    title: "SOVA Rise™ Empowerment Program",
    description:
      "Our flagship program, SOVA Rise™, is built to bridge the AI skills gap. We collaborate with institutions to foster practical digital literacy, build capability from within, and cultivate a sustainable technical talent ecosystem.",
    highlight: "Ecosystem Building & Upskilling",
  },

  impact: {
    tag: "Sustained Value",
    title: "Fostering inclusive digital growth.",
    description:
      "We believe technology should elevate human potential. By focusing on ethics, practical workflows, and tailored implementation, SOVA enables organizations to scale efficiency without complexity.",
    highlight: "Measurable Operational Growth",
  },
};

/* =========================================================
   HELPERS
========================================================= */

function createInitialTabData(
  initialData?: Partial<AboutSettingsData>,
): Record<TabKey, TabContent> {
  return {
    mission: {
      ...DEFAULT_TAB_DATA.mission,
      ...initialData?.tabData?.mission,
    },

    program: {
      ...DEFAULT_TAB_DATA.program,
      ...initialData?.tabData?.program,
    },

    impact: {
      ...DEFAULT_TAB_DATA.impact,
      ...initialData?.tabData?.impact,
    },
  };
}

function createInitialFormData(
  initialData?: Partial<AboutSettingsData>,
): AboutSettingsData {
  return {
    sectionTitle: initialData?.sectionTitle ?? "About Us",

    tabData: createInitialTabData(initialData),

    imagePath: initialData?.imagePath ?? DEFAULT_IMAGE_PATH,

    overlayLabel: initialData?.overlayLabel ?? "Impact Metric",

    overlayTitle: initialData?.overlayTitle ?? "100+ Organizations Empowered",

    overlayBadge: initialData?.overlayBadge ?? "AI",
  };
}

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
   FIELD STYLES
========================================================= */

const INPUT_CLASS =
  "w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10";

const TEXTAREA_CLASS =
  "w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-xs leading-relaxed text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10";

/* =========================================================
   COMPONENT
========================================================= */

export default function AboutAdminForm({
  initialData,
  onSave,
}: AboutAdminFormProps) {
  const [formData, setFormData] = useState<AboutSettingsData>(() =>
    createInitialFormData(initialData),
  );

  const [activeTabEdit, setActiveTabEdit] = useState<TabKey>("mission");

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  /* =======================================================
     LOAD ABOUT SETTINGS
  ======================================================= */

  useEffect(() => {
    let isMounted = true;

    const loadAboutSettings = async () => {
      setIsLoading(true);

      try {
        if (initialData) {
          if (isMounted) {
            setFormData(createInitialFormData(initialData));
            setImagePreview(null);
          }

          return;
        }

        const response = await fetch("/api/about", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          let errorMessage = "Failed to load About settings.";

          try {
            const result = await response.json();

            if (typeof result?.error === "string") {
              errorMessage = result.error;
            }
          } catch {
            // Ignore invalid JSON responses.
          }

          throw new Error(errorMessage);
        }

        const result = await response.json();

        const data =
          result?.data && typeof result.data === "object"
            ? result.data
            : result;

        if (isMounted) {
          setFormData(createInitialFormData(data));
          setImagePreview(null);
        }
      } catch (error) {
        console.error("Failed to load About settings:", error);

        if (isMounted) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to load About settings.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadAboutSettings();

    return () => {
      isMounted = false;
    };
  }, [initialData]);

  /* =======================================================
     FIELD UPDATE
  ======================================================= */

  const updateField = <K extends keyof AboutSettingsData>(
    field: K,
    value: AboutSettingsData[K],
  ) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  /* =======================================================
     TAB FIELD UPDATE
  ======================================================= */

  const handleTabChange = (field: keyof TabContent, value: string) => {
    setFormData((previous) => ({
      ...previous,

      tabData: {
        ...previous.tabData,

        [activeTabEdit]: {
          ...previous.tabData[activeTabEdit],
          [field]: value,
        },
      },
    }));
  };

  /* =======================================================
     IMAGE UPLOAD
  ======================================================= */

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !ACCEPTED_IMAGE_TYPES.includes(
        file.type as (typeof ACCEPTED_IMAGE_TYPES)[number],
      )
    ) {
      toast.error("Please select a PNG, JPG, or WebP image.");

      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Image must be smaller than 3MB.");

      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        toast.error("Unable to process the selected image.");

        return;
      }

      setImagePreview(reader.result);

      updateField("imagePath", reader.result);
    };

    reader.onerror = () => {
      toast.error("Unable to read the selected image.");
    };

    reader.readAsDataURL(file);

    event.target.value = "";
  };

  /* =======================================================
     RESET IMAGE
  ======================================================= */

  const resetImage = () => {
    setImagePreview(null);

    updateField("imagePath", DEFAULT_IMAGE_PATH);
  };

  /* =======================================================
     FORM SUBMIT
  ======================================================= */

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    const sectionTitle = formData.sectionTitle.trim();

    if (!sectionTitle) {
      toast.error("Please enter an About section title.");

      return;
    }

    setIsSaving(true);

    const payload: AboutSettingsData = {
      sectionTitle,

      tabData: {
        mission: {
          tag: formData.tabData.mission.tag.trim(),
          title: formData.tabData.mission.title.trim(),
          description: formData.tabData.mission.description.trim(),
          highlight: formData.tabData.mission.highlight.trim(),
        },

        program: {
          tag: formData.tabData.program.tag.trim(),
          title: formData.tabData.program.title.trim(),
          description: formData.tabData.program.description.trim(),
          highlight: formData.tabData.program.highlight.trim(),
        },

        impact: {
          tag: formData.tabData.impact.tag.trim(),
          title: formData.tabData.impact.title.trim(),
          description: formData.tabData.impact.description.trim(),
          highlight: formData.tabData.impact.highlight.trim(),
        },
      },

      imagePath: formData.imagePath.trim(),

      overlayLabel: formData.overlayLabel.trim(),

      overlayTitle: formData.overlayTitle.trim(),

      overlayBadge: formData.overlayBadge.trim(),
    };

    try {
      if (onSave) {
        await onSave(payload);
      } else {
        const response = await fetch("/api/about", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          let errorMessage = "Failed to save About settings.";

          try {
            const result = await response.json();

            if (typeof result?.error === "string") {
              errorMessage = result.error;
            }
          } catch {
            // Ignore invalid JSON responses.
          }

          throw new Error(errorMessage);
        }
      }

      toast.success("Changes saved successfully.");
    } catch (error) {
      console.error("Failed to save About settings:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save About settings. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const activeTab = formData.tabData[activeTabEdit];

  const currentImage = imagePreview || formData.imagePath;

  /* =======================================================
     LOADING
  ======================================================= */

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

  return (
    <div className="space-y-8 font-sans">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* =================================================
            1. ABOUT HEADING
        ================================================== */}

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
                max={LIMITS.sectionTitle}
              />
            </div>

            <input
              id="sectionTitle"
              type="text"
              maxLength={LIMITS.sectionTitle}
              value={formData.sectionTitle}
              onChange={(event) =>
                updateField("sectionTitle", event.target.value)
              }
              placeholder="About Us"
              className={`${INPUT_CLASS} font-serif`}
            />
          </div>
        </section>

        {/* =================================================
            2. TAB CONTENT
        ================================================== */}

        <section className="space-y-6 rounded-xl border border-stone-200 bg-[#FAF9F5] p-6">
          <div className="flex flex-col justify-between gap-3 border-b border-stone-200 pb-3 sm:flex-row sm:items-center">
            <div>
              <h4 className="text-sm font-serif font-medium uppercase tracking-wider text-stone-900">
                Tab Content
              </h4>
            </div>

            <div className="inline-flex w-fit flex-wrap rounded-lg border border-stone-300 bg-stone-200/70 p-1">
              {TABS.map((tab) => {
                const isActive = activeTabEdit === tab;

                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTabEdit(tab)}
                    aria-pressed={isActive}
                    className={`cursor-pointer rounded-md px-3 py-1 text-xs font-serif uppercase tracking-wider transition-all ${
                      isActive
                        ? "bg-stone-950 font-semibold text-amber-400 shadow-sm"
                        : "text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    {TAB_LABELS[tab]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-5">
            {/* =================================================
                TAG + HIGHLIGHT
            ================================================== */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* TAG */}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor={`${activeTabEdit}-tag`}
                    className="block text-xs font-bold uppercase tracking-widest text-stone-600"
                  >
                    Tag
                  </label>

                  <CharacterCounter
                    current={activeTab.tag.length}
                    max={LIMITS.tabTag}
                  />
                </div>

                <input
                  id={`${activeTabEdit}-tag`}
                  type="text"
                  maxLength={LIMITS.tabTag}
                  value={activeTab.tag}
                  onChange={(event) =>
                    handleTabChange("tag", event.target.value)
                  }
                  placeholder="Our Purpose"
                  className={INPUT_CLASS}
                />
              </div>

              {/* HIGHLIGHT */}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor={`${activeTabEdit}-highlight`}
                    className="block text-xs font-bold uppercase tracking-widest text-stone-600"
                  >
                    Highlight
                  </label>

                  <CharacterCounter
                    current={activeTab.highlight.length}
                    max={LIMITS.tabHighlight}
                  />
                </div>

                <input
                  id={`${activeTabEdit}-highlight`}
                  type="text"
                  maxLength={LIMITS.tabHighlight}
                  value={activeTab.highlight}
                  onChange={(event) =>
                    handleTabChange("highlight", event.target.value)
                  }
                  placeholder="Decision Intelligence & Automation"
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            {/* =================================================
                TITLE
            ================================================== */}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor={`${activeTabEdit}-title`}
                  className="block text-xs font-bold uppercase tracking-widest text-stone-600"
                >
                  Title
                </label>

                <CharacterCounter
                  current={activeTab.title.length}
                  max={LIMITS.tabTitle}
                />
              </div>

              <input
                id={`${activeTabEdit}-title`}
                type="text"
                maxLength={LIMITS.tabTitle}
                value={activeTab.title}
                onChange={(event) =>
                  handleTabChange("title", event.target.value)
                }
                placeholder="Enter tab title..."
                className={`${INPUT_CLASS} font-serif`}
              />
            </div>

            {/* =================================================
                DESCRIPTION
            ================================================== */}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor={`${activeTabEdit}-description`}
                  className="block text-xs font-bold uppercase tracking-widest text-stone-600"
                >
                  Description
                </label>

                <CharacterCounter
                  current={activeTab.description.length}
                  max={LIMITS.tabDescription}
                />
              </div>

              <textarea
                id={`${activeTabEdit}-description`}
                rows={4}
                maxLength={LIMITS.tabDescription}
                value={activeTab.description}
                onChange={(event) =>
                  handleTabChange("description", event.target.value)
                }
                placeholder="Enter a short description..."
                className={TEXTAREA_CLASS}
              />
            </div>
          </div>
        </section>

        {/* =================================================
            3. IMAGE & IMPACT CARD
        ================================================== */}

        <section className="space-y-6 rounded-xl border border-stone-200 bg-[#FAF9F5] p-6">
          <div className="flex items-center gap-2 border-b border-stone-200 pb-3">
            <h4 className="text-sm font-serif font-medium uppercase tracking-wider text-stone-900">
              Image & Impact Card
            </h4>
          </div>

          {/* =================================================
              IMAGE
          ================================================== */}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[220px_1fr]">
            {/* PREVIEW */}

            <div className="relative min-h-[150px] overflow-hidden rounded-lg border border-stone-300 bg-stone-100">
              {currentImage ? (
                <Image
                  src={currentImage}
                  alt="About section preview"
                  fill
                  sizes="(max-width: 640px) 100vw, 220px"
                  className="object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="flex h-40 items-center justify-center text-stone-400 sm:h-full sm:min-h-[150px]">
                  <ImageIcon className="h-6 w-6" />
                </div>
              )}
            </div>

            {/* UPLOAD */}

            <div className="flex flex-col justify-center space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-stone-600">
                  About Image
                </label>

                <p className="mt-1 text-[10px] text-stone-400">
                  PNG, JPG, or WebP · Maximum 5MB
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-xs font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-50">
                  <Upload className="h-3.5 w-3.5" />

                  {imagePreview ? "Replace Image" : "Upload Image"}

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>

                {imagePreview && (
                  <button
                    type="button"
                    onClick={resetImage}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
                  >
                    <X className="h-3.5 w-3.5" />
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* =================================================
              IMPACT CARD
          ================================================== */}

          <div className="space-y-3 border-t border-stone-200/60 pt-3">
            <div className="flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-amber-800" />

              <span className="text-xs font-medium text-stone-800">
                Impact Card
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* LABEL */}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="overlayLabel"
                    className="block text-xs font-bold uppercase tracking-widest text-stone-600"
                  >
                    Label
                  </label>

                  <CharacterCounter
                    current={formData.overlayLabel.length}
                    max={LIMITS.overlayLabel}
                  />
                </div>

                <input
                  id="overlayLabel"
                  type="text"
                  maxLength={LIMITS.overlayLabel}
                  value={formData.overlayLabel}
                  onChange={(event) =>
                    updateField("overlayLabel", event.target.value)
                  }
                  placeholder="Impact Metric"
                  className={INPUT_CLASS}
                />
              </div>

              {/* TITLE */}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="overlayTitle"
                    className="block text-xs font-bold uppercase tracking-widest text-stone-600"
                  >
                    Title
                  </label>

                  <CharacterCounter
                    current={formData.overlayTitle.length}
                    max={LIMITS.overlayTitle}
                  />
                </div>

                <input
                  id="overlayTitle"
                  type="text"
                  maxLength={LIMITS.overlayTitle}
                  value={formData.overlayTitle}
                  onChange={(event) =>
                    updateField("overlayTitle", event.target.value)
                  }
                  placeholder="100+ Organizations Empowered"
                  className={`${INPUT_CLASS} font-serif`}
                />
              </div>

              {/* BADGE */}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="overlayBadge"
                    className="block text-xs font-bold uppercase tracking-widest text-stone-600"
                  >
                    Badge
                  </label>

                  <CharacterCounter
                    current={formData.overlayBadge.length}
                    max={LIMITS.overlayBadge}
                  />
                </div>

                <input
                  id="overlayBadge"
                  type="text"
                  maxLength={LIMITS.overlayBadge}
                  value={formData.overlayBadge}
                  onChange={(event) =>
                    updateField("overlayBadge", event.target.value)
                  }
                  placeholder="AI"
                  className={`${INPUT_CLASS} font-mono uppercase`}
                />
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            SAVE
        ================================================== */}

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
