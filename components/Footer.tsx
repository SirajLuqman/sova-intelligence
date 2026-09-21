import Link from "next/link";

import { Sparkles, Mail, Phone, MapPin } from "lucide-react";

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

import type { ComponentType } from "react";

/* =========================================================
   TYPES
========================================================= */

export interface SocialLink {
  id: string;
  name: string;
  href: string;
  platform?: string | null;
  iconName?: string | null;
  iconUrl?: string | null;
}

export interface OfficeAddress {
  id: string;
  title: string;
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
}

export interface FooterData {
  badgeText?: string;
  headingText?: string;
  companyName?: string;
  companyRegistration?: string;
  email?: string;
  phone?: string;
  contactPerson?: string;
  copyrightText?: string;
  privacyPolicyText?: string;
  privacyPolicyHref?: string;
  termsText?: string;
  termsHref?: string;
  socialLinks?: SocialLink[];
  offices?: OfficeAddress[];
}

export interface FooterProps {
  data?: FooterData | null;
}

/* =========================================================
   PLATFORM ICONS
========================================================= */

const SOCIAL_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  facebook: FaFacebookF,
  instagram: FaInstagram,
  whatsapp: FaWhatsapp,
  linkedin: FaLinkedinIn,
  youtube: FaYoutube,
  tiktok: FaTiktok,
  telegram: FaTelegram,
  github: FaGithub,
  website: FaGlobe,
  email: FaEnvelope,
  x: FaXTwitter,
  twitter: FaXTwitter,
  threads: FaThreads,
};

/* =========================================================
   HELPERS
========================================================= */

function normalizePlatform(value?: string | null): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function getSocialIcon(
  social: SocialLink,
): ComponentType<{ className?: string }> {
  const platform = normalizePlatform(social.platform);

  if (platform && SOCIAL_ICONS[platform]) {
    return SOCIAL_ICONS[platform];
  }

  const name = normalizePlatform(social.name);

  if (name && SOCIAL_ICONS[name]) {
    return SOCIAL_ICONS[name];
  }

  const iconName = String(social.iconName ?? "")
    .trim()
    .toLowerCase();

  const legacyIconMap: Record<string, ComponentType<{ className?: string }>> = {
    fafacebookf: FaFacebookF,
    fafacebook: FaFacebookF,
    fainstagram: FaInstagram,
    fawhatsapp: FaWhatsapp,
    falinkedinin: FaLinkedinIn,
    falinkedin: FaLinkedinIn,
    fayoutube: FaYoutube,
    fatiktok: FaTiktok,
    fatelegram: FaTelegram,
    fatelegramplane: FaTelegram,
    fagithub: FaGithub,
    fglobe: FaGlobe,
    faglobe: FaGlobe,
    faenvelope: FaEnvelope,
    fax: FaXTwitter,
    fatwitter: FaXTwitter,
    fathreads: FaThreads,
  };

  return legacyIconMap[iconName] ?? FaGlobe;
}

function getSocialLabel(social: SocialLink): string {
  return social.platform?.trim() || social.name?.trim() || "Social link";
}

/* =========================================================
   COMPONENT
========================================================= */

export default function Footer({ data }: FooterProps) {
  /*
   * All actual footer content comes from the database.
   *
   * Empty values are used only as structural fallbacks so
   * the component remains safe if data is temporarily missing.
   *
   * Default business/contact/legal values should be created
   * and maintained through the database/API layer.
   */

  const badgeText = data?.badgeText ?? "";

  const headingText = data?.headingText ?? "";

  const companyName = data?.companyName ?? "";

  const companyRegistration = data?.companyRegistration ?? "";

  const email = data?.email ?? "";

  const phone = data?.phone ?? "";

  const contactPerson = data?.contactPerson ?? "";

  const copyrightText = data?.copyrightText ?? "";

  const privacyPolicyText = data?.privacyPolicyText ?? "";

  const privacyPolicyHref = data?.privacyPolicyHref ?? "";

  const termsText = data?.termsText ?? "";

  const termsHref = data?.termsHref ?? "";

  const socialLinks = Array.isArray(data?.socialLinks) ? data.socialLinks : [];

  const offices = Array.isArray(data?.offices) ? data.offices : [];

  return (
    <footer
      id="contact"
      className="relative w-full bg-[#111110] text-stone-100 pt-24 pb-12 px-8 md:px-16 font-sans border-t border-stone-800"
    >
      <div className="max-w-7xl mx-auto space-y-16">
        {/* =================================================
            TOP SECTION
        ================================================= */}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* =================================================
              LEFT COLUMN
          ================================================= */}

          <div className="lg:col-span-6 space-y-8">
            <div className="space-y-4">
              {badgeText && (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-900 border border-stone-800 text-xs font-serif uppercase tracking-[0.2em] text-amber-400 font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />

                  <span>{badgeText}</span>
                </div>
              )}

              {headingText && (
                <h2 className="text-4xl sm:text-6xl font-serif font-normal text-white tracking-tight leading-tight">
                  {headingText}
                </h2>
              )}
            </div>

            {/* =================================================
                SOCIAL MEDIA
            ================================================= */}

            {socialLinks.length > 0 && (
              <div className="space-y-3 pt-2">
                <span className="text-xs font-serif uppercase tracking-widest text-stone-400 font-semibold block">
                  Visit Our Socials
                </span>

                <div className="flex flex-wrap items-center gap-2.5">
                  {socialLinks.map((social) => {
                    const Icon = getSocialIcon(social);

                    const label = getSocialLabel(social);

                    return (
                      <a
                        key={social.id}
                        href={social.href}
                        aria-label={label}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-xl bg-stone-900/90 border border-stone-800 flex items-center justify-center text-stone-300 hover:text-white hover:bg-stone-800 hover:border-stone-700 hover:shadow-sm transition-all duration-200"
                      >
                        <Icon className="w-4 h-4" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* =================================================
              RIGHT COLUMN
          ================================================= */}

          <div className="lg:col-span-6 space-y-6">
            {/* =================================================
                CONTACT CARDS
            ================================================= */}

            {(email || phone) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* EMAIL */}

                {email && (
                  <a
                    href={`mailto:${email}`}
                    className="bg-stone-900/80 p-6 rounded-2xl border border-stone-800 shadow-sm hover:shadow-md hover:border-stone-700 transition-all duration-200 group flex flex-col justify-between space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-serif uppercase tracking-widest text-amber-400 font-semibold">
                        Email
                      </span>

                      <div className="w-8 h-8 rounded-lg bg-stone-800 text-stone-300 flex items-center justify-center group-hover:bg-amber-400 group-hover:text-stone-950 transition-colors">
                        <Mail className="w-4 h-4" />
                      </div>
                    </div>

                    <div>
                      <span className="text-xs sm:text-sm font-sans font-medium text-stone-200 break-all block">
                        {email}
                      </span>
                    </div>
                  </a>
                )}

                {/* PHONE */}

                {phone && (
                  <a
                    href={`tel:${phone.replace(/\s+/g, "")}`}
                    className="bg-stone-900/80 p-6 rounded-2xl border border-stone-800 shadow-sm hover:shadow-md hover:border-stone-700 transition-all duration-200 group flex flex-col justify-between space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-serif uppercase tracking-widest text-amber-400 font-semibold">
                        Contact
                      </span>

                      <div className="w-8 h-8 rounded-lg bg-stone-800 text-stone-300 flex items-center justify-center group-hover:bg-amber-400 group-hover:text-stone-950 transition-colors">
                        <Phone className="w-4 h-4" />
                      </div>
                    </div>

                    <div>
                      <span className="text-sm font-sans font-semibold text-white block">
                        {phone}
                      </span>

                      {contactPerson && (
                        <span className="text-xs font-sans text-stone-400 block pt-0.5">
                          {contactPerson}
                        </span>
                      )}
                    </div>
                  </a>
                )}
              </div>
            )}

            {/* =================================================
                COMPANY + OFFICES
            ================================================= */}

            {(companyName || companyRegistration || offices.length > 0) && (
              <div className="bg-stone-900/80 p-6 sm:p-8 rounded-2xl border border-stone-800 shadow-sm space-y-6">
                {(companyName || companyRegistration) && (
                  <div className="flex items-center justify-between pb-4 border-b border-stone-800">
                    {companyName && (
                      <h4 className="text-base font-serif font-medium text-white">
                        {companyName}
                      </h4>
                    )}

                    {companyRegistration && (
                      <span className="text-[11px] font-sans text-stone-400">
                        {companyRegistration}
                      </span>
                    )}
                  </div>
                )}

                {offices.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {offices.map((office) => (
                      <div key={office.id} className="space-y-2">
                        {office.title && (
                          <div className="flex items-center gap-1.5 text-amber-400">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />

                            <span className="text-xs font-serif uppercase tracking-wider font-semibold">
                              {office.title}
                            </span>
                          </div>
                        )}

                        {(office.addressLine1 ||
                          office.addressLine2 ||
                          office.addressLine3) && (
                          <address className="not-italic text-xs text-stone-300 font-sans leading-relaxed">
                            {office.addressLine1 && (
                              <>
                                {office.addressLine1}
                                <br />
                              </>
                            )}

                            {office.addressLine2 && (
                              <>
                                {office.addressLine2}
                                <br />
                              </>
                            )}

                            {office.addressLine3}
                          </address>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* =================================================
            BOTTOM BAR
        ================================================= */}

        {(copyrightText || privacyPolicyText || termsText) && (
          <div className="pt-8 border-t border-stone-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500 font-sans">
            {copyrightText ? <p>{copyrightText}</p> : <span />}

            {(privacyPolicyText || termsText) && (
              <div className="flex items-center gap-6">
                {privacyPolicyText &&
                  (privacyPolicyHref ? (
                    <Link
                      href={privacyPolicyHref}
                      className="hover:text-stone-300 transition-colors"
                    >
                      {privacyPolicyText}
                    </Link>
                  ) : (
                    <span>{privacyPolicyText}</span>
                  ))}

                {privacyPolicyText && termsText && <span>•</span>}

                {termsText &&
                  (termsHref ? (
                    <Link
                      href={termsHref}
                      className="hover:text-stone-300 transition-colors"
                    >
                      {termsText}
                    </Link>
                  ) : (
                    <span>{termsText}</span>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </footer>
  );
}
