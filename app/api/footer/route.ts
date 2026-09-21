import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

/* =========================================================
   FOOTER LIMITS
========================================================= */

const MAX_SOCIALS = 6;
const MAX_OFFICES = 8;

const MAX_BADGE = 25;

const MAX_HEADING_CHARS = 60;
const MAX_HEADING_WORDS = 12;

const MAX_COMPANY_NAME = 50;
const MAX_REGISTRATION = 25;

const MAX_EMAIL = 100;
const MAX_PHONE = 25;
const MAX_CONTACT_PERSON = 50;

const MAX_COPYRIGHT = 100;

const MAX_PRIVACY_TEXT = 30;
const MAX_PRIVACY_HREF = 250;

const MAX_TERMS_TEXT = 30;
const MAX_TERMS_HREF = 250;

const MAX_SOCIAL_URL = 250;

const MAX_OFFICE_TITLE = 35;
const MAX_ADDRESS_LINE = 60;

/* =========================================================
   HELPERS
========================================================= */

const stringValue = (value: unknown): string =>
  typeof value === "string" ? value : "";

const countWords = (value: string): number =>
  value.trim() ? value.trim().split(/\s+/).length : 0;

const isValidUrl = (value: string): boolean => {
  const trimmed = value.trim();

  /*
   * "#" is allowed as a placeholder URL.
   */
  if (trimmed === "#") {
    return true;
  }

  if (!trimmed) {
    return false;
  }

  try {
    const url = new URL(trimmed);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

/* =========================================================
   PLATFORM NORMALIZATION
========================================================= */

const normalizePlatform = (value: unknown): string =>
  stringValue(value)
    .trim()
    .toLowerCase()
    .replace(/[\s\_-]+/g, "");

/* =========================================================
   PLATFORM -> ICON
========================================================= */

const PLATFORM_ICON_MAP: Record<string, string> = {
  facebook: "FaFacebookF",
  instagram: "FaInstagram",
  whatsapp: "FaWhatsapp",
  linkedin: "FaLinkedinIn",
  youtube: "FaYoutube",
  tiktok: "FaTiktok",
  telegram: "FaTelegram",
  github: "FaGithub",
  website: "FaGlobe",
  email: "FaEnvelope",
  x: "FaXTwitter",
  twitter: "FaXTwitter",
  threads: "FaThreads",
};

/* =========================================================
   LEGACY ICON COMPATIBILITY
========================================================= */

const LEGACY_ICON_MAP: Record<string, string> = {
  Globe: "FaGlobe",
  Globe2: "FaGlobe",
  Share2: "FaShareAlt",
  AtSign: "FaAt",
  MessageCircle: "FaCommentDots",

  Facebook: "FaFacebookF",
  FacebookF: "FaFacebookF",

  Instagram: "FaInstagram",

  WhatsApp: "FaWhatsapp",
  Whatsapp: "FaWhatsapp",

  Threads: "FaThreads",

  Twitter: "FaXTwitter",
  X: "FaXTwitter",

  LinkedIn: "FaLinkedinIn",
  LinkedInIn: "FaLinkedinIn",

  YouTube: "FaYoutube",

  TikTok: "FaTiktok",

  Telegram: "FaTelegram",
  TelegramPlane: "FaTelegram",

  GitHub: "FaGithub",

  Website: "FaGlobe",

  Email: "FaEnvelope",
  Mail: "FaEnvelope",
};

/* =========================================================
   ICON NORMALIZATION
========================================================= */

const normalizeIconName = (value: unknown, platform?: unknown): string => {
  const normalizedPlatform = normalizePlatform(platform);

  /*
   * Platform is the primary source of truth.
   */
  if (normalizedPlatform && PLATFORM_ICON_MAP[normalizedPlatform]) {
    return PLATFORM_ICON_MAP[normalizedPlatform];
  }

  /*
   * Legacy icon support.
   */
  const icon = stringValue(value).trim();

  if (!icon) {
    return "FaGlobe";
  }

  /*
   * Already-normalized React icon identifier.
   */
  if (
    icon.startsWith("Fa") ||
    icon.startsWith("Fi") ||
    icon.startsWith("Md") ||
    icon.startsWith("Si") ||
    icon.startsWith("Bs") ||
    icon.startsWith("Ai") ||
    icon.startsWith("Bi") ||
    icon.startsWith("Hi") ||
    icon.startsWith("Lu")
  ) {
    return icon;
  }

  return LEGACY_ICON_MAP[icon] ?? "FaGlobe";
};

/* =========================================================
   TYPES
========================================================= */

type RawSocialLink = {
  id?: unknown;
  name?: unknown;
  platform?: unknown;

  href?: unknown;
  url?: unknown;
  link?: unknown;

  iconName?: unknown;
  icon?: unknown;
  iconKey?: unknown;
  platformIcon?: unknown;
  platformLogo?: unknown;
  logo?: unknown;

  iconUrl?: unknown;
  logoUrl?: unknown;
  imageUrl?: unknown;
};

type NormalizedSocialLink = {
  id: string;
  name: string;
  platform: string;
  href: string;
  iconName: string;
  iconUrl: string | null;
};

type RawOffice = {
  id?: unknown;
  title?: unknown;
  addressLine1?: unknown;
  addressLine2?: unknown;
  addressLine3?: unknown;
};

type NormalizedOffice = {
  id: string;
  title: string;
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
};

/* =========================================================
   SOCIAL LINK NORMALIZATION
========================================================= */

const normalizeSocialLink = (
  social: RawSocialLink,
  index: number,
): NormalizedSocialLink => {
  const platform = normalizePlatform(social.platform ?? social.name);

  const rawIcon =
    social.iconName ??
    social.icon ??
    social.iconKey ??
    social.platformIcon ??
    social.platformLogo ??
    social.logo;

  const rawIconUrl =
    social.iconUrl ?? social.logoUrl ?? social.imageUrl ?? null;

  return {
    id: stringValue(social.id).trim() || `social-${index + 1}`,

    /*
     * FooterAdminForm does not store a separate name.
     * The platform value is therefore used as the name.
     */
    name: stringValue(social.name ?? social.platform).trim(),

    platform,

    href: stringValue(social.href ?? social.url ?? social.link).trim(),

    iconName: normalizeIconName(rawIcon, platform),

    iconUrl: rawIconUrl ? stringValue(rawIconUrl).trim() || null : null,
  };
};

/* =========================================================
   OFFICE NORMALIZATION
========================================================= */

const normalizeOffice = (
  office: RawOffice,
  index: number,
): NormalizedOffice => ({
  id: stringValue(office.id).trim() || `office-${index + 1}`,

  title: stringValue(office.title).trim(),

  addressLine1: stringValue(office.addressLine1).trim(),

  addressLine2: stringValue(office.addressLine2).trim(),

  addressLine3: stringValue(office.addressLine3).trim(),
});

/* =========================================================
   VALIDATION
   ALL FIELDS ARE OPTIONAL
========================================================= */

function validateFooter(body: Record<string, unknown>): string | null {
  const badgeText = stringValue(body.badgeText);
  const headingText = stringValue(body.headingText);

  const companyName = stringValue(body.companyName);
  const companyRegistration = stringValue(body.companyRegistration);

  const email = stringValue(body.email);
  const phone = stringValue(body.phone);
  const contactPerson = stringValue(body.contactPerson);

  const copyrightText = stringValue(body.copyrightText);

  const privacyPolicyText = stringValue(body.privacyPolicyText);

  const privacyPolicyHref = stringValue(body.privacyPolicyHref);

  const termsText = stringValue(body.termsText);

  const termsHref = stringValue(body.termsHref);

  /* -------------------------------------------------------
     General text limits
     Empty values are allowed.
  ------------------------------------------------------- */

  if (badgeText.length > MAX_BADGE) {
    return `Badge text cannot exceed ${MAX_BADGE} characters.`;
  }

  if (headingText.length > MAX_HEADING_CHARS) {
    return `Main headline cannot exceed ${MAX_HEADING_CHARS} characters.`;
  }

  if (countWords(headingText) > MAX_HEADING_WORDS) {
    return `Main headline cannot exceed ${MAX_HEADING_WORDS} words.`;
  }

  if (companyName.length > MAX_COMPANY_NAME) {
    return `Company name cannot exceed ${MAX_COMPANY_NAME} characters.`;
  }

  if (companyRegistration.length > MAX_REGISTRATION) {
    return `Registration number cannot exceed ${MAX_REGISTRATION} characters.`;
  }

  if (email.length > MAX_EMAIL) {
    return `Email cannot exceed ${MAX_EMAIL} characters.`;
  }

  if (phone.length > MAX_PHONE) {
    return `Contact number cannot exceed ${MAX_PHONE} characters.`;
  }

  if (contactPerson.length > MAX_CONTACT_PERSON) {
    return `Contact person cannot exceed ${MAX_CONTACT_PERSON} characters.`;
  }

  if (copyrightText.length > MAX_COPYRIGHT) {
    return `Copyright text cannot exceed ${MAX_COPYRIGHT} characters.`;
  }

  /* -------------------------------------------------------
     Legal links
     Optional.
  ------------------------------------------------------- */

  if (privacyPolicyText.length > MAX_PRIVACY_TEXT) {
    return `Privacy Policy text cannot exceed ${MAX_PRIVACY_TEXT} characters.`;
  }

  if (privacyPolicyHref.length > MAX_PRIVACY_HREF) {
    return `Privacy Policy URL cannot exceed ${MAX_PRIVACY_HREF} characters.`;
  }

  if (privacyPolicyHref.trim() && !isValidUrl(privacyPolicyHref.trim())) {
    return "Please enter a valid Privacy Policy URL.";
  }

  if (termsText.length > MAX_TERMS_TEXT) {
    return `Terms text cannot exceed ${MAX_TERMS_TEXT} characters.`;
  }

  if (termsHref.length > MAX_TERMS_HREF) {
    return `Terms URL cannot exceed ${MAX_TERMS_HREF} characters.`;
  }

  if (termsHref.trim() && !isValidUrl(termsHref.trim())) {
    return "Please enter a valid Terms URL.";
  }

  /* -------------------------------------------------------
     Social channels
     Social channels are optional.
     Platform and URL are also optional.
  ------------------------------------------------------- */

  const socialLinks = Array.isArray(body.socialLinks) ? body.socialLinks : [];

  if (socialLinks.length > MAX_SOCIALS) {
    return `A maximum of ${MAX_SOCIALS} social channels is allowed.`;
  }

  const platforms = new Set<string>();

  for (let i = 0; i < socialLinks.length; i++) {
    const social = normalizeSocialLink(socialLinks[i] as RawSocialLink, i);

    /*
     * Completely empty social entries are allowed.
     */
    if (!social.platform && !social.href) {
      continue;
    }

    /*
     * Platform is optional.
     * If provided, duplicate platforms are not allowed.
     */
    if (social.platform) {
      if (platforms.has(social.platform)) {
        return `Social channel ${
          i + 1
        } uses a platform that has already been added.`;
      }

      platforms.add(social.platform);
    }

    /*
     * URL is optional.
     * Validate only when a URL has been entered.
     */
    if (social.href) {
      if (social.href.length > MAX_SOCIAL_URL) {
        return `Social channel ${
          i + 1
        } URL cannot exceed ${MAX_SOCIAL_URL} characters.`;
      }

      if (!isValidUrl(social.href)) {
        return `Social channel ${i + 1} must contain a valid URL.`;
      }
    }
  }

  /* -------------------------------------------------------
     Offices
     Offices are optional.
     All office fields are optional.
  ------------------------------------------------------- */

  const offices = Array.isArray(body.offices) ? body.offices : [];

  if (offices.length > MAX_OFFICES) {
    return `A maximum of ${MAX_OFFICES} office locations is allowed.`;
  }

  for (let i = 0; i < offices.length; i++) {
    const office = normalizeOffice(offices[i] as RawOffice, i);

    if (office.title.length > MAX_OFFICE_TITLE) {
      return `Office ${
        i + 1
      } title cannot exceed ${MAX_OFFICE_TITLE} characters.`;
    }

    if (office.addressLine1.length > MAX_ADDRESS_LINE) {
      return `Office ${
        i + 1
      } address line 1 cannot exceed ${MAX_ADDRESS_LINE} characters.`;
    }

    if (office.addressLine2.length > MAX_ADDRESS_LINE) {
      return `Office ${
        i + 1
      } address line 2 cannot exceed ${MAX_ADDRESS_LINE} characters.`;
    }

    if (office.addressLine3.length > MAX_ADDRESS_LINE) {
      return `Office ${
        i + 1
      } address line 3 cannot exceed ${MAX_ADDRESS_LINE} characters.`;
    }
  }

  return null;
}

/* =========================================================
   GET
========================================================= */

export async function GET() {
  try {
    const footer = await prisma.footerSettings.findUnique({
      where: {
        id: 1,
      },
    });

    if (!footer) {
      return NextResponse.json(null);
    }

    const rawSocialLinks = Array.isArray(footer.socialLinks)
      ? footer.socialLinks
      : [];

    const rawOffices = Array.isArray(footer.offices) ? footer.offices : [];

    /*
     * Normalize data for the public Footer component.
     *
     * GET remains read-only.
     */
    const normalizedSocialLinks = rawSocialLinks.map((social, index) =>
      normalizeSocialLink(social as RawSocialLink, index),
    );

    const normalizedOffices = rawOffices.map((office, index) =>
      normalizeOffice(office as RawOffice, index),
    );

    return NextResponse.json({
      ...footer,
      socialLinks: normalizedSocialLinks,
      offices: normalizedOffices,
    });
  } catch (error) {
    console.error("Footer GET error:", error);

    return NextResponse.json(
      {
        error: "Unable to load footer settings.",
      },
      {
        status: 500,
      },
    );
  }
}

/* =========================================================
   POST
========================================================= */

export async function POST(request: Request) {
  try {
    const body = await request.json();

    /* -------------------------------------------------------
       Validation
    ------------------------------------------------------- */

    const validationError = validateFooter(body);

    if (validationError) {
      return NextResponse.json(
        {
          error: validationError,
        },
        {
          status: 400,
        },
      );
    }

    /* -------------------------------------------------------
       Normalize social links
    ------------------------------------------------------- */

    const socialLinks = (
      Array.isArray(body.socialLinks) ? body.socialLinks : []
    ).map((social: RawSocialLink, index: number) =>
      normalizeSocialLink(social, index),
    );

    /* -------------------------------------------------------
       Normalize offices
    ------------------------------------------------------- */

    const offices = (Array.isArray(body.offices) ? body.offices : []).map(
      (office: RawOffice, index: number) => normalizeOffice(office, index),
    );

    /* -------------------------------------------------------
       Normalize all scalar fields
       Empty / missing values become empty strings.
    ------------------------------------------------------- */

    const badgeText = stringValue(body.badgeText).trim();

    const headingText = stringValue(body.headingText).trim();

    const companyName = stringValue(body.companyName).trim();

    const companyRegistration = stringValue(body.companyRegistration).trim();

    const email = stringValue(body.email).trim();

    const phone = stringValue(body.phone).trim();

    const contactPerson = stringValue(body.contactPerson).trim();

    const copyrightText = stringValue(body.copyrightText).trim();

    const privacyPolicyText = stringValue(body.privacyPolicyText).trim();

    const privacyPolicyHref = stringValue(body.privacyPolicyHref).trim();

    const termsText = stringValue(body.termsText).trim();

    const termsHref = stringValue(body.termsHref).trim();

    /* -------------------------------------------------------
       Save
    ------------------------------------------------------- */

    const footer = await prisma.footerSettings.upsert({
      where: {
        id: 1,
      },

      update: {
        badgeText,
        headingText,

        companyName,
        companyRegistration,

        email,
        phone,
        contactPerson,

        copyrightText,

        privacyPolicyText,
        privacyPolicyHref,

        termsText,
        termsHref,

        socialLinks,
        offices,
      },

      create: {
        id: 1,

        badgeText,
        headingText,

        companyName,
        companyRegistration,

        email,
        phone,
        contactPerson,

        copyrightText,

        privacyPolicyText,
        privacyPolicyHref,

        termsText,
        termsHref,

        socialLinks,
        offices,
      },
    });

    /* -------------------------------------------------------
       Return complete saved data
    ------------------------------------------------------- */

    const savedSocialLinks = Array.isArray(footer.socialLinks)
      ? footer.socialLinks.map((social, index) =>
          normalizeSocialLink(social as RawSocialLink, index),
        )
      : [];

    const savedOffices = Array.isArray(footer.offices)
      ? footer.offices.map((office, index) =>
          normalizeOffice(office as RawOffice, index),
        )
      : [];

    return NextResponse.json({
      success: true,

      data: {
        ...footer,

        socialLinks: savedSocialLinks,

        offices: savedOffices,
      },
    });
  } catch (error) {
    console.error("Footer POST error:", error);

    return NextResponse.json(
      {
        error: "Unable to save footer settings.",
      },
      {
        status: 500,
      },
    );
  }
}
