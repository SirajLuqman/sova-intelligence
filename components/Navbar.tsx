import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import Image from "next/image";

/* =========================================================
   TYPES
========================================================= */

export interface NavbarData {
  brandName?: string;
  tagline?: string;
  logoUrl?: string;
}

/* =========================================================
   NAVIGATION LINKS

   These IDs must match the section IDs used on the page.
========================================================= */

const NAV_LINKS = [
  {
    name: "About",
    href: "#about",
  },
  {
    name: "Expertise",
    href: "#expertise",
  },
  {
    name: "Services",
    href: "#services",
  },
  {
    name: "Projects",
    href: "#projects",
  },
  {
    name: "How We Work",
    href: "#methodology",
  },
  {
    name: "Our Team",
    href: "#team",
  },
  {
    name: "Contact Us",
    href: "#contact",
  },
];

/* =========================================================
   NAVBAR
========================================================= */

export default async function Navbar() {
  /* =======================================================
     SERVER-SIDE DATABASE FETCH

     NavbarSettings is loaded directly through Prisma so
     there is no client-side API request or loading delay.
  ======================================================= */

  const data = await prisma.navbarSettings.findUnique({
    where: {
      id: 1,
    },
  });

  /* =======================================================
     BRAND DATA
  ======================================================= */

  const brandTitle = data?.brandName?.trim() || "SOVA";
  const brandSubtitle = data?.tagline?.trim() || "";

  /* =======================================================
     LOGO DATA

     The logo is now image-only.

     Supported values can be:
     - /images/logo.png
     - /uploads/navbar-logo.webp
     - https://example.com/logo.png
     - data:image/... (currently supported for compatibility)

     No preset icons are used.
  ======================================================= */

  const rawLogo = data?.logoUrl?.trim() || "";

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-800/60 bg-black/80 px-6 py-4 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
        {/* =================================================
            BRAND
        ================================================= */}

        <a
          href="#"
          aria-label={`${brandTitle} home`}
          className="group flex min-w-0 shrink-0 items-center gap-3"
        >
          {rawLogo && (
            <div className="flex h-8 max-w-[180px] shrink-0 items-center">
              <Image
                src={rawLogo}
                alt={`${brandTitle} logo`}
                width={180}
                height={32}
                className="block h-auto max-h-16 w-auto max-w-[180px] object-contain"
              />
            </div>
          )}

          <div className="min-w-0">
            <span className="block truncate text-base font-semibold tracking-wider text-white">
              {brandTitle}
            </span>

            {brandSubtitle && (
              <span className="block truncate text-[10px] font-normal uppercase tracking-wide text-neutral-400">
                {brandSubtitle}
              </span>
            )}
          </div>
        </a>

        {/* =================================================
            DESKTOP NAVIGATION

            Hidden on mobile. The existing responsive
            structure can be extended with a mobile menu
            component later if required.
        ================================================= */}

        <nav
          aria-label="Main navigation"
          className="hidden items-center space-x-6 text-sm font-normal text-neutral-400 lg:flex"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="whitespace-nowrap py-1 transition-colors hover:text-white focus:outline-none focus-visible:text-white"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* =================================================
            REQUEST DEMO

            Request Demo intentionally points to the Footer
            because the contact information is located there.
        ================================================= */}

        <div className="hidden shrink-0 md:block">
          <a
            href="#contact"
            className={cn(
              buttonVariants({
                size: "default",
              }),
              "rounded-full bg-white px-4 py-2 text-xs font-medium tracking-wide text-black transition-all hover:bg-neutral-200",
            )}
          >
            Request a Demo
          </a>
        </div>
      </div>
    </header>
  );
}
