"use client";

import { useEffect, useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

/* =========================================================
   CHARACTER LIMIT CONFIGURATION
========================================================= */

const LIMITS = {
  sectionTitle: 50,
  pillarCategory: 40,
  pillarId: 10,
  pillarTitle: 80,
  pillarDescription: 400,
  highlight: 100,
} as const;

/* =========================================================
   TYPES
========================================================= */

interface ExpertisePillar {
  id: string;
  category: string;
  title: string;
  description: string;
  highlights: string[];
}

interface ExpertiseFormData {
  sectionTitle: string;
  pillars: ExpertisePillar[];
}

/* =========================================================
   HELPERS
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
   COMPONENT
========================================================= */

export default function ExpertiseAdminForm() {
  const [formData, setFormData] = useState<ExpertiseFormData>({
    sectionTitle: "",
    pillars: [],
  });

  const [activePillarIndex, setActivePillarIndex] = useState(0);
  const [isLoading, setisLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  /* =======================================================
     LOAD DATA
  ======================================================= */

  useEffect(() => {
    const loadExpertise = async () => {
      try {
        setisLoading(true);

        const response = await fetch("/api/expertise", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load Expertise settings.");
        }

        const data = await response.json();

        setFormData({
          sectionTitle:
            typeof data.sectionTitle === "string" ? data.sectionTitle : "",
          pillars: Array.isArray(data.pillars)
            ? data.pillars.filter(Boolean).map((pillar: ExpertisePillar) => ({
                id: pillar.id ?? "",
                category: pillar.category ?? "",
                title: pillar.title ?? "",
                description: pillar.description ?? "",
                highlights: Array.isArray(pillar.highlights)
                  ? pillar.highlights
                  : [],
              }))
            : [],
        });
      } catch (error) {
        console.error(error);

        toast.error("Unable to load Expertise settings.");
      } finally {
        setisLoading(false);
      }
    };

    loadExpertise();
  }, []);

  /* =======================================================
     SECTION TITLE
  ======================================================= */

  const handleSectionTitleChange = (value: string) => {
    setFormData((previous) => ({
      ...previous,
      sectionTitle: value,
    }));
  };

  /* =======================================================
     PILLAR
  ======================================================= */

  const handlePillarChange = (field: keyof ExpertisePillar, value: string) => {
    setFormData((previous) => {
      if (!previous.pillars[activePillarIndex]) {
        return previous;
      }

      const updatedPillars = [...previous.pillars];

      updatedPillars[activePillarIndex] = {
        ...updatedPillars[activePillarIndex],
        [field]: value,
      };

      return {
        ...previous,
        pillars: updatedPillars,
      };
    });
  };

  /* =======================================================
     HIGHLIGHTS
  ======================================================= */

  const handleHighlightChange = (index: number, value: string) => {
    setFormData((previous) => {
      if (!previous.pillars[activePillarIndex]) {
        return previous;
      }

      const updatedPillars = [...previous.pillars];
      const updatedHighlights = [
        ...updatedPillars[activePillarIndex].highlights,
      ];

      updatedHighlights[index] = value;

      updatedPillars[activePillarIndex] = {
        ...updatedPillars[activePillarIndex],
        highlights: updatedHighlights,
      };

      return {
        ...previous,
        pillars: updatedPillars,
      };
    });
  };

  /* =======================================================
     SAVE
  ======================================================= */

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const response = await fetch("/api/expertise", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Failed to save Expertise settings.");
      }

      toast.success("Changes saved successfully.");
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save Expertise settings.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  /* =======================================================
     ACTIVE PILLAR
  ======================================================= */

  const activePillar = formData.pillars[activePillarIndex];

  /* =======================================================
     isLoading
  ======================================================= */

  if (isLoading) {
  return (
    <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-stone-200 bg-[#FAF9F5]">
      <div className="flex flex-col items-center gap-3 text-stone-500">
        <Loader2 className="h-6 w-6 animate-spin text-stone-800" />

        <p className="text-xs font-serif tracking-wider">
          Loading...
        </p>
      </div>
    </div>
  );
}

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="space-y-8 font-sans">
      {/* SECTION TITLE */}

      <div className="space-y-4 rounded-xl border border-stone-200 bg-[#FAF9F5] p-6">
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
            type="text"
            maxLength={LIMITS.sectionTitle}
            value={formData.sectionTitle}
            onChange={(e) => handleSectionTitleChange(e.target.value)}
            placeholder="Enter section title..."
            className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-xs font-serif text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
          />
        </div>
      </div>

      {/* PILLARS */}

      <div className="space-y-6 rounded-xl border border-stone-200 bg-[#FAF9F5] p-6">
        <div className="flex flex-col justify-between gap-3 border-b border-stone-200 pb-3 sm:flex-row sm:items-center">
          <div>
            <h4 className="text-sm font-serif font-medium uppercase tracking-wider text-stone-900">
              Operational Pillars
            </h4>
          </div>

          {/* PILLAR SWITCHER */}

          {formData.pillars.length > 0 && (
            <div className="inline-flex rounded-lg border border-stone-300 bg-stone-200/70 p-1">
              {formData.pillars.map((item, index) => (
                <button
                  key={`${item.id}-${index}`}
                  type="button"
                  onClick={() => setActivePillarIndex(index)}
                  className={`rounded-md px-3 py-1 text-xs font-serif uppercase tracking-wider transition-all ${
                    activePillarIndex === index
                      ? "bg-stone-950 font-semibold text-amber-400 shadow-sm"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  Pillar {item.id}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* SELECTED PILLAR */}

        {activePillar && (
          <div className="space-y-5">
            {/* CATEGORY + ID */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* CATEGORY */}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-widest text-stone-600">
                    Category
                  </label>

                  <CharacterCounter
                    current={activePillar.category.length}
                    max={LIMITS.pillarCategory}
                  />
                </div>

                <input
                  type="text"
                  maxLength={LIMITS.pillarCategory}
                  value={activePillar.category}
                  onChange={(e) =>
                    handlePillarChange("category", e.target.value)
                  }
                  className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                />
              </div>

              {/* ID */}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-widest text-stone-600">
                    Pillar ID
                  </label>

                  <CharacterCounter
                    current={activePillar.id.length}
                    max={LIMITS.pillarId}
                  />
                </div>

                <input
                  type="text"
                  maxLength={LIMITS.pillarId}
                  value={activePillar.id}
                  onChange={(e) => handlePillarChange("id", e.target.value)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 font-mono text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                />
              </div>
            </div>

            {/* TITLE */}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-widest text-stone-600">
                  Main Pillar Title
                </label>

                <CharacterCounter
                  current={activePillar.title.length}
                  max={LIMITS.pillarTitle}
                />
              </div>

              <input
                type="text"
                maxLength={LIMITS.pillarTitle}
                value={activePillar.title}
                onChange={(e) => handlePillarChange("title", e.target.value)}
                className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 font-serif text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
              />
            </div>

            {/* DESCRIPTION */}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-widest text-stone-600">
                  Description
                </label>

                <CharacterCounter
                  current={activePillar.description.length}
                  max={LIMITS.pillarDescription}
                />
              </div>

              <textarea
                rows={4}
                maxLength={LIMITS.pillarDescription}
                value={activePillar.description}
                onChange={(e) =>
                  handlePillarChange("description", e.target.value)
                }
                className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-xs leading-relaxed text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
              />
            </div>

            {/* HIGHLIGHTS */}

            <div className="space-y-3 border-t border-stone-200/60 pt-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-widest text-stone-600">
                  Core Focus Checklist Items ({activePillar.highlights.length})
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {activePillar.highlights.map((highlight, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between px-0.5">
                      <span className="font-mono text-[10px] text-stone-400">
                        Item {index + 1}
                      </span>

                      <CharacterCounter
                        current={highlight.length}
                        max={LIMITS.highlight}
                      />
                    </div>

                    <input
                      type="text"
                      maxLength={LIMITS.highlight}
                      value={highlight}
                      onChange={(e) =>
                        handleHighlightChange(index, e.target.value)
                      }
                      className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* EMPTY STATE */}

        {formData.pillars.length === 0 && (
          <div className="py-10 text-center text-sm text-stone-500">
            No Expertise pillars found in the database.
          </div>
        )}
      </div>

      {/* SAVE */}

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSave}
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
    </div>
  );
}
