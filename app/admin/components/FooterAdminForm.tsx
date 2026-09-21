"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Info,
  Loader2,
  MapPin,
  Plus,
  Save,
  Trash2,
} from "lucide-react";

import {
  FaFacebookF,
  FaInstagram,
  FaWhatsapp,
  FaLinkedinIn,
  FaYoutube,
  FaTiktok,
  FaTelegram,
  FaGithub,
  FaGlobe,
  FaEnvelope,
  FaXTwitter,
  FaThreads,
} from "react-icons/fa6";

import { toast } from "sonner";

/* =========================================================
   TYPES
========================================================= */

export interface SocialLink {
  id: string;
  platform: string;
  href: string;
}

export interface OfficeAddress {
  id: string;
  title: string;
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
}

export interface FooterData {
  badgeText: string;
  headingText: string;

  companyName: string;
  companyRegistration: string;

  email: string;
  phone: string;
  contactPerson: string;

  copyrightText: string;

  privacyPolicyText: string;
  privacyPolicyHref: string;

  termsText: string;
  termsHref: string;

  socialLinks: SocialLink[];
  offices: OfficeAddress[];
}

/* =========================================================
   LIMITS
========================================================= */

export const FOOTER_LIMITS = {
  BADGE: 25,
  HEADING_CHARS: 60,
  HEADING_WORDS: 12,

  COMPANY_NAME: 50,
  REGISTRATION: 25,

  EMAIL: 100,
  PHONE: 25,
  CONTACT_PERSON: 50,

  COPYRIGHT: 100,

  POLICY_TEXT: 30,
  POLICY_URL: 250,

  TERMS_TEXT: 30,
  TERMS_URL: 250,

  OFFICE_TITLE: 35,
  ADDRESS_LINE: 60,

  SOCIAL_URL: 250,

  MAX_SOCIALS: 6,
  MAX_OFFICES: 8,
} as const;

/* =========================================================
   PLATFORM OPTIONS
========================================================= */

interface PlatformOption {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const SOCIAL_PLATFORM_OPTIONS: PlatformOption[] = [
  {
    value: "facebook",
    label: "Facebook",
    icon: FaFacebookF,
  },
  {
    value: "instagram",
    label: "Instagram",
    icon: FaInstagram,
  },
  {
    value: "whatsapp",
    label: "WhatsApp",
    icon: FaWhatsapp,
  },
  {
    value: "linkedin",
    label: "LinkedIn",
    icon: FaLinkedinIn,
  },
  {
    value: "youtube",
    label: "YouTube",
    icon: FaYoutube,
  },
  {
    value: "tiktok",
    label: "TikTok",
    icon: FaTiktok,
  },
  {
    value: "x",
    label: "X",
    icon: FaXTwitter,
  },
  {
    value: "threads",
    label: "Threads",
    icon: FaThreads,
  },
  {
    value: "telegram",
    label: "Telegram",
    icon: FaTelegram,
  },
  {
    value: "github",
    label: "GitHub",
    icon: FaGithub,
  },
  {
    value: "website",
    label: "Website",
    icon: FaGlobe,
  },
  {
    value: "email",
    label: "Email",
    icon: FaEnvelope,
  },
];

/* =========================================================
   DEFAULT DATA
========================================================= */

const DEFAULT_FOOTER_DATA: FooterData = {
  badgeText: "Get In Touch",
  headingText: "Let's work together.",

  companyName: "SOVA Intelligence (M) Sdn. Bhd.",
  companyRegistration: "(1651222-H)",

  email: "drsalasiah@sovaintell.com",
  phone: "+6019-7738522",
  contactPerson: "Dr. Salasiah Abbas, CEO",

  copyrightText: "© 2026 SOVA Intelligence (M) Sdn. Bhd. All rights reserved.",

  privacyPolicyText: "Privacy Policy",
  privacyPolicyHref: "#",

  termsText: "Terms of Service",
  termsHref: "#",

  socialLinks: [
    {
      id: "1",
      platform: "facebook",
      href: "#",
    },
    {
      id: "2",
      platform: "instagram",
      href: "#",
    },
    {
      id: "3",
      platform: "threads",
      href: "#",
    },
    {
      id: "4",
      platform: "x",
      href: "#",
    },
  ],

  offices: [
    {
      id: "1",
      title: "Johor Office",
      addressLine1: "27-01, Jalan Permas 9/1",
      addressLine2: "Bandar Baru Permas Jaya",
      addressLine3: "81750 Johor Bahru, JOHOR",
    },
    {
      id: "2",
      title: "Melaka Office",
      addressLine1: "Lot 11, Jalan KTF 1",
      addressLine2: "Kota Tun Fatimah, MITC",
      addressLine3: "75450 Ayer Keroh, MELAKA",
    },
  ],
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
   HELPERS
========================================================= */

const countWords = (value: string) =>
  value.trim() ? value.trim().split(/\s+/).length : 0;

const getPlatform = (platform: string) =>
  SOCIAL_PLATFORM_OPTIONS.find((item) => item.value === platform);

const isValidUrl = (value: string) => {
  if (!value.trim()) return false;

  if (value.trim() === "#") return true;

  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

/* =========================================================
   COMPONENT
========================================================= */

export default function FooterAdminForm() {
  const [formData, setFormData] = useState<FooterData>(DEFAULT_FOOTER_DATA);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState("");

  /* =======================================================
     LOAD
  ======================================================= */

  useEffect(() => {
    const loadFooter = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch("/api/footer", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load footer settings.");
        }

        const result = await response.json();

        const data = result?.data ?? result;

        if (data && typeof data === "object" && data.badgeText !== undefined) {
          setFormData({
            ...DEFAULT_FOOTER_DATA,
            ...data,

            socialLinks:
              Array.isArray(data.socialLinks) && data.socialLinks.length > 0
                ? data.socialLinks
                : DEFAULT_FOOTER_DATA.socialLinks,

            offices:
              Array.isArray(data.offices) && data.offices.length > 0
                ? data.offices
                : DEFAULT_FOOTER_DATA.offices,
          });
        }
      } catch (err) {
        console.error("Footer loading error:", err);

        const message =
          "Unable to load saved footer settings. Default values are being shown.";

        setError(message);
        setFormData(DEFAULT_FOOTER_DATA);

        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadFooter();
  }, []);

  /* =======================================================
     FIELD UPDATES
  ======================================================= */

  const handleFieldChange = (field: keyof FooterData, value: string) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));

    setError("");
  };

  const handleSocialChange = (
    id: string,
    field: keyof SocialLink,
    value: string,
  ) => {
    setFormData((previous) => ({
      ...previous,

      socialLinks: previous.socialLinks.map((social) =>
        social.id === id
          ? {
              ...social,
              [field]: value,
            }
          : social,
      ),
    }));

    setError("");
  };

  const handleOfficeChange = (
    id: string,
    field: keyof OfficeAddress,
    value: string,
  ) => {
    setFormData((previous) => ({
      ...previous,

      offices: previous.offices.map((office) =>
        office.id === id
          ? {
              ...office,
              [field]: value,
            }
          : office,
      ),
    }));

    setError("");
  };

  /* =======================================================
     SOCIAL ACTIONS
  ======================================================= */

  const handleAddSocial = () => {
    if (formData.socialLinks.length >= FOOTER_LIMITS.MAX_SOCIALS) {
      const message = `You can add a maximum of ${FOOTER_LIMITS.MAX_SOCIALS} social media platforms.`;

      toast.error(message);
      setError(message);

      return;
    }

    const usedPlatforms = new Set(
      formData.socialLinks.map((social) => social.platform),
    );

    const platform =
      SOCIAL_PLATFORM_OPTIONS.find((item) => !usedPlatforms.has(item.value)) ??
      SOCIAL_PLATFORM_OPTIONS[0];

    setFormData((previous) => ({
      ...previous,

      socialLinks: [
        ...previous.socialLinks,
        {
          id: crypto.randomUUID(),
          platform: platform.value,
          href: "",
        },
      ],
    }));

    setError("");
  };

  const handleRemoveSocial = (id: string) => {
    setFormData((previous) => ({
      ...previous,

      socialLinks: previous.socialLinks.filter((social) => social.id !== id),
    }));

    setError("");
  };

  /* =======================================================
     OFFICE ACTIONS
  ======================================================= */

  const handleAddOffice = () => {
    if (formData.offices.length >= FOOTER_LIMITS.MAX_OFFICES) {
      const message = `You can add a maximum of ${FOOTER_LIMITS.MAX_OFFICES} office locations.`;

      toast.error(message);
      setError(message);

      return;
    }

    setFormData((previous) => ({
      ...previous,

      offices: [
        ...previous.offices,
        {
          id: crypto.randomUUID(),
          title: `Office ${previous.offices.length + 1}`,
          addressLine1: "",
          addressLine2: "",
          addressLine3: "",
        },
      ],
    }));

    setError("");
  };

  const handleRemoveOffice = (id: string) => {
    if (formData.offices.length <= 1) {
      const message = "At least one office location is required.";

      toast.error(message);
      setError(message);

      return;
    }

    setFormData((previous) => ({
      ...previous,

      offices: previous.offices.filter((office) => office.id !== id),
    }));

    setError("");
  };

  /* =======================================================
     VALIDATION
  ======================================================= */

  const validateForm = () => {
    if (!formData.badgeText.trim()) {
      return "Badge text is required.";
    }

    if (!formData.headingText.trim()) {
      return "Main headline text is required.";
    }

    if (countWords(formData.headingText) > FOOTER_LIMITS.HEADING_WORDS) {
      return `Main headline cannot exceed ${FOOTER_LIMITS.HEADING_WORDS} words.`;
    }

    if (!formData.companyName.trim()) {
      return "Company name is required.";
    }

    if (!formData.email.trim()) {
      return "Email address is required.";
    }

    if (!formData.phone.trim()) {
      return "Contact number is required.";
    }

    if (!formData.copyrightText.trim()) {
      return "Copyright text is required.";
    }

    if (formData.offices.length === 0) {
      return "At least one office location is required.";
    }

    const platforms = new Set<string>();

    for (const social of formData.socialLinks) {
      const platform = getPlatform(social.platform);

      const label = platform?.label ?? "Social media";

      if (platforms.has(social.platform)) {
        return `${label} has been added more than once.`;
      }

      platforms.add(social.platform);

      if (social.href.trim() && !isValidUrl(social.href)) {
        return `Please enter a valid URL for ${label}.`;
      }
    }

    if (
      formData.privacyPolicyHref.trim() &&
      !isValidUrl(formData.privacyPolicyHref)
    ) {
      return "Please enter a valid Privacy Policy URL.";
    }

    if (formData.termsHref.trim() && !isValidUrl(formData.termsHref)) {
      return "Please enter a valid Terms of Service URL.";
    }

    return "";
  };

  /* =======================================================
     SAVE
  ======================================================= */

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");

    const validationError = validateForm();

    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch("/api/footer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Unable to save footer settings.");
      }

      const savedData = result?.data ?? result;

      if (
        savedData &&
        typeof savedData === "object" &&
        savedData.badgeText !== undefined
      ) {
        setFormData({
          ...DEFAULT_FOOTER_DATA,
          ...savedData,

          socialLinks: Array.isArray(savedData.socialLinks)
            ? savedData.socialLinks
            : DEFAULT_FOOTER_DATA.socialLinks,

          offices: Array.isArray(savedData.offices)
            ? savedData.offices
            : DEFAULT_FOOTER_DATA.offices,
        });
      }

      toast.success("Changes saved successfully.");
    } catch (err) {
      console.error("Footer save error:", err);

      const message =
        err instanceof Error ? err.message : "Unable to save footer settings.";

      setError(message);

      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

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

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="space-y-8 font-sans">
      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

          <span>{error}</span>
        </div>
      )}

      <form
        id="footer-admin-form"
        onSubmit={handleSubmit}
        className="space-y-8"
      >
        {/* =====================================================
            FOOTER INTRODUCTION
        ===================================================== */}

        <section className="space-y-5 rounded-xl border border-stone-200 bg-[#FAF9F5] p-6">
          <div className="border-b border-stone-200 pb-3">
            <h4 className="text-sm font-serif font-medium uppercase tracking-wider text-stone-900">
              Footer Introduction
            </h4>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Badge */}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-serif uppercase tracking-wider text-stone-400">
                  Badge Text
                </label>

                <CharacterCounter
                  current={formData.badgeText.length}
                  max={FOOTER_LIMITS.BADGE}
                />
              </div>

              <input
                type="text"
                maxLength={FOOTER_LIMITS.BADGE}
                value={formData.badgeText}
                onChange={(event) =>
                  handleFieldChange("badgeText", event.target.value)
                }
                placeholder="e.g. Get In Touch"
                className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-xs font-serif text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
              />
            </div>

            {/* Heading */}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-serif uppercase tracking-wider text-stone-400">
                  Main Headline
                </label>

                <CharacterCounter
                  current={formData.headingText.length}
                  max={FOOTER_LIMITS.HEADING_CHARS}
                />
              </div>

              <input
                type="text"
                maxLength={FOOTER_LIMITS.HEADING_CHARS}
                value={formData.headingText}
                onChange={(event) => {
                  const value = event.target.value;

                  if (countWords(value) <= FOOTER_LIMITS.HEADING_WORDS) {
                    handleFieldChange("headingText", value);
                  }
                }}
                placeholder="e.g. Let's work together."
                className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-xs font-serif font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
              />
            </div>
          </div>
        </section>

        {/* =====================================================
            CONTACT INFORMATION
        ===================================================== */}

        <section className="space-y-5 rounded-xl border border-stone-200 bg-[#FAF9F5] p-6">
          <div className="border-b border-stone-200 pb-3">
            <h4 className="text-sm font-serif font-medium uppercase tracking-wider text-stone-900">
              Contact Information
            </h4>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {/* Email */}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-serif uppercase tracking-wider text-stone-400">
                  Email Address
                </label>

                <CharacterCounter
                  current={formData.email.length}
                  max={FOOTER_LIMITS.EMAIL}
                />
              </div>

              <input
                type="email"
                maxLength={FOOTER_LIMITS.EMAIL}
                value={formData.email}
                onChange={(event) =>
                  handleFieldChange("email", event.target.value)
                }
                placeholder="Email address"
                className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
              />
            </div>

            {/* Phone */}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-serif uppercase tracking-wider text-stone-400">
                  Contact Number
                </label>

                <CharacterCounter
                  current={formData.phone.length}
                  max={FOOTER_LIMITS.PHONE}
                />
              </div>

              <input
                type="tel"
                maxLength={FOOTER_LIMITS.PHONE}
                value={formData.phone}
                onChange={(event) =>
                  handleFieldChange("phone", event.target.value)
                }
                placeholder="Contact number"
                className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
              />
            </div>

            {/* Contact Person */}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-serif uppercase tracking-wider text-stone-400">
                  Contact Person
                </label>

                <CharacterCounter
                  current={formData.contactPerson.length}
                  max={FOOTER_LIMITS.CONTACT_PERSON}
                />
              </div>

              <input
                type="text"
                maxLength={FOOTER_LIMITS.CONTACT_PERSON}
                value={formData.contactPerson}
                onChange={(event) =>
                  handleFieldChange("contactPerson", event.target.value)
                }
                placeholder="Contact person"
                className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
              />
            </div>
          </div>
        </section>

        {/* =====================================================
            COMPANY & OFFICES
        ===================================================== */}

        <section className="space-y-6 rounded-xl border border-stone-200 bg-[#FAF9F5] p-6">
          <div className="border-b border-stone-200 pb-3">
            <h4 className="text-sm font-serif font-medium uppercase tracking-wider text-stone-900">
              Company & Offices
            </h4>
          </div>

          {/* Company Information */}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Company Name */}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-serif uppercase tracking-wider text-stone-400">
                  Registered Company Name
                </label>

                <CharacterCounter
                  current={formData.companyName.length}
                  max={FOOTER_LIMITS.COMPANY_NAME}
                />
              </div>

              <input
                type="text"
                maxLength={FOOTER_LIMITS.COMPANY_NAME}
                value={formData.companyName}
                onChange={(event) =>
                  handleFieldChange("companyName", event.target.value)
                }
                placeholder="Registered company name"
                className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-xs font-serif font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
              />
            </div>

            {/* Registration */}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-serif uppercase tracking-wider text-stone-400">
                  Registration Number (SSM)
                </label>

                <CharacterCounter
                  current={formData.companyRegistration.length}
                  max={FOOTER_LIMITS.REGISTRATION}
                />
              </div>

              <input
                type="text"
                maxLength={FOOTER_LIMITS.REGISTRATION}
                value={formData.companyRegistration}
                onChange={(event) =>
                  handleFieldChange("companyRegistration", event.target.value)
                }
                placeholder="e.g. (1651222-H)"
                className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 font-mono text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
              />
            </div>
          </div>

          {/* Office Locations */}

          <div className="space-y-4">
            <div className="flex flex-col justify-between gap-3 border-b border-stone-200 pb-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-stone-700" />

                <h5 className="text-xs font-bold uppercase tracking-widest text-stone-600">
                  Office Locations ({formData.offices.length})
                </h5>
              </div>

              {formData.offices.length < FOOTER_LIMITS.MAX_OFFICES && (
                <button
                  type="button"
                  onClick={handleAddOffice}
                  className="inline-flex items-center gap-1 text-[11px] font-serif uppercase tracking-wider text-amber-900 hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Location
                </button>
              )}
            </div>

            {formData.offices.length === 0 ? (
              <div className="rounded-xl border border-dashed border-stone-300 bg-white px-6 py-10 text-center">
                <p className="text-xs text-stone-500">
                  No office locations found.
                </p>

                <button
                  type="button"
                  onClick={handleAddOffice}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-amber-900 hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add your first office
                </button>
              </div>
            ) : (
              <div className="max-h-[520px] space-y-3 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-stone-300">
                {formData.offices.map((office, index) => (
                  <div
                    key={office.id}
                    className="flex items-start gap-3 rounded-xl border border-stone-200 bg-white p-3.5 shadow-xs"
                  >
                    {/* Number */}

                    <span className="pt-2.5 text-xs font-mono font-bold text-stone-400">
                      #{index + 1}
                    </span>

                    <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
                      {/* Office Name */}

                      <div className="space-y-1 sm:col-span-2">
                        <div className="flex items-center justify-between px-0.5">
                          <span className="text-[10px] font-serif uppercase tracking-wider text-stone-400">
                            Office Name
                          </span>

                          <CharacterCounter
                            current={office.title.length}
                            max={FOOTER_LIMITS.OFFICE_TITLE}
                          />
                        </div>

                        <input
                          type="text"
                          maxLength={FOOTER_LIMITS.OFFICE_TITLE}
                          value={office.title}
                          onChange={(event) =>
                            handleOfficeChange(
                              office.id,
                              "title",
                              event.target.value,
                            )
                          }
                          placeholder={`Office ${index + 1}`}
                          className="w-full rounded-lg border border-stone-300 bg-stone-50/50 px-3 py-2 text-xs font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                        />
                      </div>

                      {/* Address Line 1 */}

                      <div className="space-y-1">
                        <div className="flex items-center justify-between px-0.5">
                          <span className="text-[10px] font-serif uppercase tracking-wider text-stone-400">
                            Address Line 1
                          </span>

                          <CharacterCounter
                            current={office.addressLine1.length}
                            max={FOOTER_LIMITS.ADDRESS_LINE}
                          />
                        </div>

                        <input
                          type="text"
                          maxLength={FOOTER_LIMITS.ADDRESS_LINE}
                          value={office.addressLine1}
                          onChange={(event) =>
                            handleOfficeChange(
                              office.id,
                              "addressLine1",
                              event.target.value,
                            )
                          }
                          placeholder="Address Line 1"
                          className="w-full rounded-lg border border-stone-300 bg-stone-50/50 px-3 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                        />
                      </div>

                      {/* Address Line 2 */}

                      <div className="space-y-1">
                        <div className="flex items-center justify-between px-0.5">
                          <span className="text-[10px] font-serif uppercase tracking-wider text-stone-400">
                            Address Line 2
                          </span>

                          <CharacterCounter
                            current={office.addressLine2.length}
                            max={FOOTER_LIMITS.ADDRESS_LINE}
                          />
                        </div>

                        <input
                          type="text"
                          maxLength={FOOTER_LIMITS.ADDRESS_LINE}
                          value={office.addressLine2}
                          onChange={(event) =>
                            handleOfficeChange(
                              office.id,
                              "addressLine2",
                              event.target.value,
                            )
                          }
                          placeholder="Address Line 2 (Optional)"
                          className="w-full rounded-lg border border-stone-300 bg-stone-50/50 px-3 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                        />
                      </div>

                      {/* Address Line 3 */}

                      <div className="space-y-1 sm:col-span-2">
                        <div className="flex items-center justify-between px-0.5">
                          <span className="text-[10px] font-serif uppercase tracking-wider text-stone-400">
                            Address Line 3
                          </span>

                          <CharacterCounter
                            current={office.addressLine3.length}
                            max={FOOTER_LIMITS.ADDRESS_LINE}
                          />
                        </div>

                        <input
                          type="text"
                          maxLength={FOOTER_LIMITS.ADDRESS_LINE}
                          value={office.addressLine3}
                          onChange={(event) =>
                            handleOfficeChange(
                              office.id,
                              "addressLine3",
                              event.target.value,
                            )
                          }
                          placeholder="Postcode, City, State"
                          className="w-full rounded-lg border border-stone-300 bg-stone-50/50 px-3 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                        />
                      </div>
                    </div>

                    {/* Remove */}

                    {formData.offices.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOffice(office.id)}
                        title="Remove office"
                        aria-label={`Remove office ${index + 1}`}
                        className="mt-0.5 p-2 text-stone-400 transition-colors hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* =====================================================
            SOCIAL MEDIA
        ===================================================== */}

        <section className="space-y-6 rounded-xl border border-stone-200 bg-[#FAF9F5] p-6">
          <div className="flex flex-col justify-between gap-3 border-b border-stone-200 pb-3 sm:flex-row sm:items-center">
            <div>
              <h4 className="text-sm font-serif font-medium uppercase tracking-wider text-stone-900">
                Social Media
              </h4>

              <p className="mt-1 text-[11px] text-stone-400">
                Social channels displayed in the footer.
              </p>
            </div>

            {formData.socialLinks.length < FOOTER_LIMITS.MAX_SOCIALS && (
              <button
                type="button"
                onClick={handleAddSocial}
                className="inline-flex items-center gap-1 text-[11px] font-serif uppercase tracking-wider text-amber-900 hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Channel
              </button>
            )}
          </div>

          {/* Information */}

          <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-[11px] leading-relaxed text-amber-950">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-800" />

            <p>
              Each platform can only be added once. Maximum{" "}
              {FOOTER_LIMITS.MAX_SOCIALS} channels.
            </p>
          </div>

          {/* Social List */}

          {formData.socialLinks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stone-300 bg-white px-6 py-10 text-center">
              <p className="text-xs text-stone-500">
                No social channels added.
              </p>

              <button
                type="button"
                onClick={handleAddSocial}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-amber-900 hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                Add your first channel
              </button>
            </div>
          ) : (
            <div className="max-h-[520px] space-y-3 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-stone-300">
              {formData.socialLinks.map((social, index) => {
                const platform = getPlatform(social.platform);

                const Icon = platform?.icon ?? FaGlobe;

                return (
                  <div
                    key={social.id}
                    className="flex items-end gap-3 rounded-xl border border-stone-200 bg-white p-3.5 shadow-xs"
                  >
                    {/* Number */}

                    <span className="shrink-0 pb-[9px] text-xs font-mono font-bold text-stone-400">
                      #{index + 1}
                    </span>

                    <div className="grid min-w-0 flex-1 grid-cols-1 items-end gap-3 sm:grid-cols-2">
                      {/* Platform */}

                      <div className="space-y-1">
                        {/* Spacer matching the Link URL label row */}

                        <div className="h-[15px]" aria-hidden="true" />

                        <div className="flex h-[34px] gap-2">
                          <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg bg-stone-950 text-amber-400">
                            <Icon className="h-4 w-4" />
                          </div>

                          <select
                            value={social.platform}
                            onChange={(event) =>
                              handleSocialChange(
                                social.id,
                                "platform",
                                event.target.value,
                              )
                            }
                            className="h-[34px] min-w-0 flex-1 rounded-lg border border-stone-300 bg-stone-50/50 px-2.5 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                          >
                            {SOCIAL_PLATFORM_OPTIONS.map((option) => (
                              <option
                                key={option.value}
                                value={option.value}
                                disabled={formData.socialLinks.some(
                                  (item) =>
                                    item.id !== social.id &&
                                    item.platform === option.value,
                                )}
                              >
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* URL */}

                      <div className="space-y-1">
                        <div className="flex h-[15px] items-center justify-between px-0.5">
                          <span className="text-[10px] font-serif uppercase tracking-wider text-stone-400">
                            Link URL
                          </span>

                          <CharacterCounter
                            current={social.href.length}
                            max={FOOTER_LIMITS.SOCIAL_URL}
                          />
                        </div>

                        <input
                          type="url"
                          maxLength={FOOTER_LIMITS.SOCIAL_URL}
                          value={social.href}
                          onChange={(event) =>
                            handleSocialChange(
                              social.id,
                              "href",
                              event.target.value,
                            )
                          }
                          placeholder="https://..."
                          className="h-[34px] w-full rounded-lg border border-stone-300 bg-stone-50/50 px-3 py-2 text-xs font-mono text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                        />
                      </div>
                    </div>

                    {/* Remove */}

                    <button
                      type="button"
                      onClick={() => handleRemoveSocial(social.id)}
                      title="Remove channel"
                      aria-label={`Remove social channel ${index + 1}`}
                      className="mb-[1px] shrink-0 p-2 text-stone-400 transition-colors hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* =====================================================
            LEGAL & COPYRIGHT
        ===================================================== */}

        <section className="space-y-6 rounded-xl border border-stone-200 bg-[#FAF9F5] p-6">
          <div className="border-b border-stone-200 pb-3">
            <h4 className="text-sm font-serif font-medium uppercase tracking-wider text-stone-900">
              Legal & Copyright
            </h4>
          </div>

          <div className="space-y-5">
            {/* Copyright */}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-serif uppercase tracking-wider text-stone-400">
                  Copyright Text
                </label>

                <CharacterCounter
                  current={formData.copyrightText.length}
                  max={FOOTER_LIMITS.COPYRIGHT}
                />
              </div>

              <input
                type="text"
                maxLength={FOOTER_LIMITS.COPYRIGHT}
                value={formData.copyrightText}
                onChange={(event) =>
                  handleFieldChange("copyrightText", event.target.value)
                }
                placeholder="Copyright text"
                className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-xs font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
              />
            </div>

            {/* Legal Links */}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Privacy Policy */}

              <div className="space-y-3 rounded-xl border border-stone-200 bg-white p-4">
                <div className="border-b border-stone-200 pb-3">
                  <h5 className="text-xs font-bold uppercase tracking-widest text-stone-600">
                    Privacy Policy
                  </h5>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between px-0.5">
                    <span className="text-[10px] font-serif uppercase tracking-wider text-stone-400">
                      Link Text
                    </span>

                    <CharacterCounter
                      current={formData.privacyPolicyText.length}
                      max={FOOTER_LIMITS.POLICY_TEXT}
                    />
                  </div>

                  <input
                    type="text"
                    maxLength={FOOTER_LIMITS.POLICY_TEXT}
                    value={formData.privacyPolicyText}
                    onChange={(event) =>
                      handleFieldChange("privacyPolicyText", event.target.value)
                    }
                    placeholder="Privacy Policy"
                    className="w-full rounded-lg border border-stone-300 bg-stone-50/50 px-3 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between px-0.5">
                    <span className="text-[10px] font-serif uppercase tracking-wider text-stone-400">
                      URL
                    </span>

                    <CharacterCounter
                      current={formData.privacyPolicyHref.length}
                      max={FOOTER_LIMITS.POLICY_URL}
                    />
                  </div>

                  <input
                    type="url"
                    maxLength={FOOTER_LIMITS.POLICY_URL}
                    value={formData.privacyPolicyHref}
                    onChange={(event) =>
                      handleFieldChange("privacyPolicyHref", event.target.value)
                    }
                    placeholder="https://..."
                    className="w-full rounded-lg border border-stone-300 bg-stone-50/50 px-3 py-2 font-mono text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                  />
                </div>
              </div>

              {/* Terms */}

              <div className="space-y-3 rounded-xl border border-stone-200 bg-white p-4">
                <div className="border-b border-stone-200 pb-3">
                  <h5 className="text-xs font-bold uppercase tracking-widest text-stone-600">
                    Terms of Service
                  </h5>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between px-0.5">
                    <span className="text-[10px] font-serif uppercase tracking-wider text-stone-400">
                      Link Text
                    </span>

                    <CharacterCounter
                      current={formData.termsText.length}
                      max={FOOTER_LIMITS.TERMS_TEXT}
                    />
                  </div>

                  <input
                    type="text"
                    maxLength={FOOTER_LIMITS.TERMS_TEXT}
                    value={formData.termsText}
                    onChange={(event) =>
                      handleFieldChange("termsText", event.target.value)
                    }
                    placeholder="Terms of Service"
                    className="w-full rounded-lg border border-stone-300 bg-stone-50/50 px-3 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between px-0.5">
                    <span className="text-[10px] font-serif uppercase tracking-wider text-stone-400">
                      URL
                    </span>

                    <CharacterCounter
                      current={formData.termsHref.length}
                      max={FOOTER_LIMITS.TERMS_URL}
                    />
                  </div>

                  <input
                    type="url"
                    maxLength={FOOTER_LIMITS.TERMS_URL}
                    value={formData.termsHref}
                    onChange={(event) =>
                      handleFieldChange("termsHref", event.target.value)
                    }
                    placeholder="https://..."
                    className="w-full rounded-lg border border-stone-300 bg-stone-50/50 px-3 py-2 font-mono text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </form>

      {/* =====================================================
          SAVE
          COMPLETELY OUTSIDE FORM
      ===================================================== */}

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          form="footer-admin-form"
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
