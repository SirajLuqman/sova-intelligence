"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  GraduationCap,
  Plus,
  Trash2,
  Save,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

/* =========================================================
   CHARACTER LIMIT CONFIGURATION
========================================================= */

const LIMITS = {
  sectionTitle: 50,
  serviceTitle: 80,
  serviceDescription: 160,
  servicesPerCategory: 6,
} as const;

/* =========================================================
   TYPES
========================================================= */

interface ServiceItem {
  id: string;
  title: string;
  desc: string;
}

interface ServicesFormData {
  sectionTitle: string;
  enterpriseServices: ServiceItem[];
  individualServices: ServiceItem[];
}

/* =========================================================
   INITIAL DATA
========================================================= */

const EMPTY_FORM_DATA: ServicesFormData = {
  sectionTitle: "",
  enterpriseServices: [],
  individualServices: [],
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
   ID GENERATOR
========================================================= */

function createServiceId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/* =========================================================
   NORMALIZE SERVICES
========================================================= */

function normalizeServices(services: unknown, prefix: string): ServiceItem[] {
  if (!Array.isArray(services)) {
    return [];
  }

  return services
    .filter((service) => service && typeof service === "object")
    .map((service, index) => {
      const item = service as Partial<ServiceItem>;

      return {
        id:
          typeof item.id === "string" && item.id.trim()
            ? item.id
            : `${prefix}-${Date.now()}-${index}-${Math.random()
                .toString(36)
                .slice(2, 8)}`,

        title: typeof item.title === "string" ? item.title : "",

        desc: typeof item.desc === "string" ? item.desc : "",
      };
    });
}

/* =========================================================
   COMPONENT
========================================================= */

export default function ServicesAdminForm() {
  const [formData, setFormData] = useState<ServicesFormData>(EMPTY_FORM_DATA);

  const [activeTab, setActiveTab] = useState<"enterprise" | "individual">(
    "enterprise",
  );

  const [isLoading, setisLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  /* =========================================================
     LOAD DATA
  ========================================================= */

  useEffect(() => {
    const loadServices = async () => {
      try {
        setisLoading(true);

        const response = await fetch("/api/services", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load Services settings.");
        }

        const data = await response.json();

        setFormData({
          sectionTitle:
            typeof data.sectionTitle === "string" ? data.sectionTitle : "",

          enterpriseServices: normalizeServices(
            data.enterpriseServices,
            "enterprise",
          ),

          individualServices: normalizeServices(
            data.individualServices,
            "individual",
          ),
        });
      } catch (error) {
        console.error("Failed to load Services settings:", error);

        setFormData(EMPTY_FORM_DATA);

        toast.error("Unable to load Services settings.");
      } finally {
        setisLoading(false);
      }
    };

    loadServices();
  }, []);

  /* =========================================================
     SECTION TITLE HANDLER
  ========================================================= */

  const handleSectionTitleChange = (value: string) => {
    setFormData((previous) => ({
      ...previous,
      sectionTitle: value,
    }));
  };

  /* =========================================================
     SERVICE HANDLER
  ========================================================= */

  const handleServiceChange = (
    serviceId: string,
    field: "title" | "desc",
    value: string,
  ) => {
    setFormData((previous) => {
      if (activeTab === "enterprise") {
        return {
          ...previous,
          enterpriseServices: previous.enterpriseServices.map((service) =>
            service.id === serviceId
              ? {
                  ...service,
                  [field]: value,
                }
              : service,
          ),
        };
      }

      return {
        ...previous,
        individualServices: previous.individualServices.map((service) =>
          service.id === serviceId
            ? {
                ...service,
                [field]: value,
              }
            : service,
        ),
      };
    });
  };

  /* =========================================================
     ADD SERVICE
  ========================================================= */

  const addService = () => {
    const prefix = activeTab === "enterprise" ? "enterprise" : "individual";

    setFormData((previous) => {
      if (activeTab === "enterprise") {
        if (previous.enterpriseServices.length >= LIMITS.servicesPerCategory) {
          return previous;
        }

        const newService: ServiceItem = {
          id: createServiceId(prefix),
          title: "",
          desc: "",
        };

        return {
          ...previous,
          enterpriseServices: [...previous.enterpriseServices, newService],
        };
      }

      if (previous.individualServices.length >= LIMITS.servicesPerCategory) {
        return previous;
      }

      const newService: ServiceItem = {
        id: createServiceId(prefix),
        title: "",
        desc: "",
      };

      return {
        ...previous,
        individualServices: [...previous.individualServices, newService],
      };
    });
  };

  /* =========================================================
     REMOVE SERVICE
  ========================================================= */

  const removeService = (serviceId: string) => {
    setFormData((previous) => {
      if (activeTab === "enterprise") {
        return {
          ...previous,
          enterpriseServices: previous.enterpriseServices.filter(
            (service) => service.id !== serviceId,
          ),
        };
      }

      return {
        ...previous,
        individualServices: previous.individualServices.filter(
          (service) => service.id !== serviceId,
        ),
      };
    });
  };

  /* =========================================================
     SAVE
  ========================================================= */

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const payload: ServicesFormData = {
        sectionTitle: formData.sectionTitle.trim(),

        enterpriseServices: formData.enterpriseServices.map((service) => ({
          id: service.id,
          title: service.title.trim(),
          desc: service.desc.trim(),
        })),

        individualServices: formData.individualServices.map((service) => ({
          id: service.id,
          title: service.title.trim(),
          desc: service.desc.trim(),
        })),
      };

      const response = await fetch("/api/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Failed to save Services settings.");
      }

      toast.success("Changes saved successfully.");
    } catch (error) {
      console.error("Failed to save Services settings:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save Services settings.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  /* =========================================================
     ACTIVE DATA
  ========================================================= */

  const currentServices =
    activeTab === "enterprise"
      ? formData.enterpriseServices
      : formData.individualServices;

  const currentLabel = activeTab === "enterprise" ? "Enterprise" : "Individual";

  const hasReachedServiceLimit =
    currentServices.length >= LIMITS.servicesPerCategory;

  /* =========================================================
     Loading
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
     RENDER
  ========================================================= */

  return (
    <div className="space-y-8 font-sans">
      {/* =====================================================
          SECTION TITLE
      ===================================================== */}

      <div className="space-y-4 rounded-xl border border-stone-200 bg-[#FAF9F5] p-6">
        <div className="border-b border-stone-200 pb-3">
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
            onChange={(event) => handleSectionTitleChange(event.target.value)}
            placeholder="e.g. Our Services"
            className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-xs font-serif text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
          />
        </div>
      </div>

      {/* =====================================================
          SERVICE CATEGORIES
      ===================================================== */}

      <div className="space-y-6 rounded-xl border border-stone-200 bg-[#FAF9F5] p-6">
        <div className="flex flex-col justify-between gap-3 border-b border-stone-200 pb-3 sm:flex-row sm:items-center">
          <div>
            <h4 className="text-sm font-serif font-medium uppercase tracking-wider text-stone-900">
              Service Categories
            </h4>
          </div>

          {/* Category Switcher */}

          <div className="inline-flex rounded-lg border border-stone-300 bg-stone-200/70 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("enterprise")}
              className={`flex items-center gap-2 rounded-md px-3 py-1 text-xs font-serif uppercase tracking-wider transition-all ${
                activeTab === "enterprise"
                  ? "bg-stone-950 font-semibold text-amber-400 shadow-sm"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />

              <span>Enterprise</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("individual")}
              className={`flex items-center gap-2 rounded-md px-3 py-1 text-xs font-serif uppercase tracking-wider transition-all ${
                activeTab === "individual"
                  ? "bg-stone-950 font-semibold text-amber-400 shadow-sm"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <GraduationCap className="h-3.5 w-3.5" />

              <span>Individuals</span>
            </button>
          </div>
        </div>

        {/* ===================================================
            SERVICE LIST
        =================================================== */}

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <label className="text-xs font-bold uppercase tracking-widest text-stone-600">
              {currentLabel} Services ({currentServices.length})
            </label>

            <button
              type="button"
              onClick={addService}
              disabled={hasReachedServiceLimit}
              className="inline-flex items-center gap-1 text-[11px] font-serif uppercase tracking-wider text-amber-900 hover:underline disabled:cursor-not-allowed disabled:text-stone-400 disabled:no-underline"
            >
              <Plus className="h-3.5 w-3.5" />
              {hasReachedServiceLimit ? "Maximum Reached" : "Add Service"}
            </button>
          </div>

          {/* Service list */}

          {currentServices.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stone-300 bg-white px-6 py-10 text-center">
              <p className="text-xs text-stone-500">
                No {currentLabel.toLowerCase()} services found.
              </p>

              <button
                type="button"
                onClick={addService}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-amber-900 hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                Add your first service
              </button>
            </div>
          ) : (
            <div className="max-h-[520px] space-y-3 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-stone-300">
              {currentServices.map((service, index) => (
                <div
                  key={service.id}
                  className="flex items-start gap-3 rounded-xl border border-stone-200 bg-white p-3.5 shadow-xs"
                >
                  {/* Number */}

                  <span className="pt-2.5 text-xs font-mono font-bold text-stone-400">
                    #{index + 1}
                  </span>

                  <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
                    {/* Service Title */}

                    <div className="space-y-1">
                      <div className="flex items-center justify-between px-0.5">
                        <span className="text-[10px] font-serif uppercase tracking-wider text-stone-400">
                          Service Title
                        </span>

                        <CharacterCounter
                          current={service.title.length}
                          max={LIMITS.serviceTitle}
                        />
                      </div>

                      <input
                        type="text"
                        maxLength={LIMITS.serviceTitle}
                        value={service.title}
                        onChange={(event) =>
                          handleServiceChange(
                            service.id,
                            "title",
                            event.target.value,
                          )
                        }
                        placeholder="Enter service title"
                        className="w-full rounded-lg border border-stone-300 bg-stone-50/50 px-3 py-2 text-xs font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                      />
                    </div>

                    {/* Description */}

                    <div className="space-y-1">
                      <div className="flex items-center justify-between px-0.5">
                        <span className="text-[10px] font-serif uppercase tracking-wider text-stone-400">
                          Description
                        </span>

                        <CharacterCounter
                          current={service.desc.length}
                          max={LIMITS.serviceDescription}
                        />
                      </div>

                      <input
                        type="text"
                        maxLength={LIMITS.serviceDescription}
                        value={service.desc}
                        onChange={(event) =>
                          handleServiceChange(
                            service.id,
                            "desc",
                            event.target.value,
                          )
                        }
                        placeholder="Enter short description"
                        className="w-full rounded-lg border border-stone-300 bg-stone-50/50 px-3 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                      />
                    </div>
                  </div>

                  {/* Remove */}

                  <button
                    type="button"
                    onClick={() => removeService(service.id)}
                    title="Remove service"
                    aria-label={`Remove service ${index + 1}`}
                    className="mt-0.5 p-2 text-stone-400 transition-colors hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* =====================================================
          SAVE
      ===================================================== */}

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
