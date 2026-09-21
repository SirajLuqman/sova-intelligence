"use client";

import { useEffect, useRef, useState, ChangeEvent, FormEvent } from "react";
import { toast } from "sonner";
import { Upload, Info, X, Save, Loader2 } from "lucide-react";
import Image from "next/image";

/* =========================================================
   CONFIGURATION
========================================================= */

const MAX_LOGO_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"];

const MAX_BRAND_NAME_LENGTH = 35;
const MAX_TAGLINE_LENGTH = 50;

/* =========================================================
   NAVBAR ADMIN FORM
========================================================= */

export default function NavbarAdminForm() {
  const [isLoading, setisLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [logoUrl, setLogoUrl] = useState("");
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);

  const [brandName, setBrandName] = useState("SOVA");
  const [tagline, setTagline] = useState("Intelligence");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /* =======================================================
     LOAD EXISTING NAVBAR SETTINGS
  ======================================================= */

  useEffect(() => {
    const loadNavbarSettings = async () => {
      try {
        const res = await fetch("/api/navbar", {
          method: "GET",
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch navbar settings");
        }

        const data = await res.json();

        setBrandName(data?.brandName?.trim() || "SOVA");
        setTagline(data?.tagline?.trim() || "Intelligence");

        const storedLogo = data?.logoUrl?.trim() || "";

        /*
         * The new logo system is image-only.
         *
         * Older icon values are intentionally ignored.
         */
        if (storedLogo && !storedLogo.startsWith("icon:")) {
          setLogoUrl(storedLogo);
          setUploadedPreview(storedLogo);
        } else {
          setLogoUrl("");
          setUploadedPreview(null);
        }
      } catch (error) {
        console.error("Failed to fetch navbar settings:", error);
        toast.error("Failed to load navbar settings");
      } finally {
        setisLoading(false);
      }
    };

    loadNavbarSettings();
  }, []);

  /* =======================================================
     FILE VALIDATION
  ======================================================= */

  const validateLogoFile = (file: File): string | null => {
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      return "Please upload a PNG, JPG/JPEG, or WEBP image.";
    }

    if (file.size > MAX_LOGO_SIZE_BYTES) {
      return "Logo image must be smaller than 5 MB.";
    }

    return null;
  };

  /* =======================================================
     LOGO UPLOAD
  ======================================================= */

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    const validationError = validateLogoFile(file);

    if (validationError) {
      toast.error(validationError);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      if (typeof result !== "string") {
        toast.error("Unable to process the selected logo.");
        return;
      }

      setLogoUrl(result);
      setUploadedPreview(result);
    };

    reader.onerror = () => {
      toast.error("Failed to read the selected image.");
    };

    reader.readAsDataURL(file);
  };

  /* =======================================================
     CLEAR LOGO
  ======================================================= */

  const clearUploadedImage = () => {
    setLogoUrl("");
    setUploadedPreview(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /* =======================================================
     SAVE SETTINGS
  ======================================================= */

  const handleSaveAndPublish = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedBrandName = brandName.trim();
    const trimmedTagline = tagline.trim();

    if (!trimmedBrandName) {
      toast.error("Brand name is required.");
      return;
    }

    setIsSaving(true);

    const payload = {
      brandName: trimmedBrandName,
      tagline: trimmedTagline,
      logoUrl: logoUrl.trim(),
    };

    try {
      const res = await fetch("/api/navbar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to publish navbar settings.");
      }

      toast.success("Changes saved successfully.");
    } catch (error) {
      console.error("Failed to save navbar settings:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "An error occurred while saving navbar settings.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  /* =======================================================
     Loading STATE
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

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <form
      onSubmit={handleSaveAndPublish}
      className="w-full max-w-4xl space-y-6 font-sans"
    >
      {/* =====================================================
          MAIN FORM CARD
      ===================================================== */}

      <div className="overflow-hidden rounded-xl border border-stone-200 bg-[#FAF9F5]">
        <div className="space-y-7 p-6">
          {/* =================================================
              LOGO
          ================================================= */}

          <section>
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Logo
                </label>

                <p className="mt-1 text-[11px] text-stone-400">
                  PNG, JPG/JPEG, or WEBP · Maximum 5 MB
                </p>
              </div>

              <div className="hidden items-center gap-1.5 rounded-md border border-amber-200/80 bg-amber-50 px-2.5 py-1.5 text-[10px] font-medium text-amber-800 sm:inline-flex">
                <Info className="h-3.5 w-3.5 shrink-0" />

                <span>
                  Recommended height: <strong>24px – 32px</strong>
                </span>
              </div>
            </div>

            {/* =================================================
                EMPTY LOGO STATE
            ================================================= */}

            {!uploadedPreview ? (
              <div className="relative flex min-h-[150px] items-center justify-center rounded-lg border border-dashed border-stone-300 bg-white px-6 py-7 transition-colors hover:border-stone-400 hover:bg-stone-50/50">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileUpload}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  aria-label="Upload company logo"
                />

                <div className="flex flex-col items-center text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-stone-200 bg-stone-50">
                    <Upload className="h-4 w-4 text-stone-600" />
                  </div>

                  <p className="mt-3 text-xs font-medium text-stone-800">
                    Upload logo
                  </p>

                  <p className="mt-1 text-[10px] text-stone-400">
                    Click anywhere to choose an image
                  </p>

                  <span className="mt-3 inline-flex rounded-md border border-stone-300 bg-white px-3 py-1.5 text-[10px] font-medium text-stone-700 shadow-sm">
                    Choose Image
                  </span>
                </div>
              </div>
            ) : (
              /* =================================================
                 LOGO PREVIEW
              ================================================= */

              <div className="flex flex-col gap-4 rounded-lg border border-stone-200 bg-white p-4 sm:flex-row sm:items-center">
                {/* Compact Preview */}

                <div className="flex h-[76px] w-full max-w-[260px] items-center justify-center overflow-hidden rounded-md border border-stone-800 bg-black px-4 sm:w-[260px]">
                  <Image
                    src={uploadedPreview}
                    alt={`${brandName || "Company"} logo preview`}
                    width={140}
                    height={32}
                    className="block h-auto max-h-8 w-auto max-w-[140px] object-contain"
                  />
                </div>

                {/* Actions */}

                <div className="flex flex-1 flex-wrap gap-2">
                  <label
                    htmlFor="replace-logo"
                    className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md bg-stone-900 px-3.5 py-2 text-[10px] font-medium text-white transition-colors hover:bg-stone-800"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Replace
                  </label>

                  <input
                    id="replace-logo"
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={clearUploadedImage}
                    className="inline-flex items-center justify-center gap-1.5 rounded-md border border-red-200 bg-white px-3.5 py-2 text-[10px] font-medium text-red-600 transition-colors hover:bg-red-50"
                  >
                    <X className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* =================================================
              BRAND TEXT
          ================================================= */}

          <section className="border-t border-stone-200 pt-7">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* =============================================
                  BRAND NAME
              ============================================= */}

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label
                    htmlFor="navbar-brand-name"
                    className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500"
                  >
                    Brand Name
                  </label>

                  <span className="font-mono text-[10px] text-stone-400">
                    {brandName.length}/{MAX_BRAND_NAME_LENGTH}
                  </span>
                </div>

                <input
                  id="navbar-brand-name"
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  maxLength={MAX_BRAND_NAME_LENGTH}
                  placeholder="e.g. SOVA"
                  className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-3 text-xs font-medium text-stone-900 transition-colors placeholder:text-stone-300 focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                />
              </div>

              {/* =============================================
                  TAGLINE
              ============================================= */}

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label
                    htmlFor="navbar-tagline"
                    className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500"
                  >
                    Tagline / Subtitle
                  </label>

                  <span className="font-mono text-[10px] text-stone-400">
                    {tagline.length}/{MAX_TAGLINE_LENGTH}
                  </span>
                </div>

                <input
                  id="navbar-tagline"
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  maxLength={MAX_TAGLINE_LENGTH}
                  placeholder="e.g. Intelligence"
                  className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-3 text-xs font-medium text-stone-900 transition-colors placeholder:text-stone-300 focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                />
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* =====================================================
          SAVE
      ===================================================== */}

      <div className="flex justify-end border-t border-stone-200 pt-5">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-stone-900 px-6 py-2.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
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
  );
}
