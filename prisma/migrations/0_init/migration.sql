-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "NavbarSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "brandName" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL,
    "navLinks" JSONB,
    "ctaText" TEXT,
    "ctaHref" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tagline" TEXT,

    CONSTRAINT "NavbarSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeroSettings" (
    "id" TEXT NOT NULL,
    "headlineLine1" TEXT,
    "headlineLine2" TEXT,
    "description" TEXT,
    "mediaType" TEXT NOT NULL DEFAULT 'video',
    "mediaUrl" TEXT NOT NULL DEFAULT '/videos/hero-bg.mp4',
    "mediaOpacity" TEXT NOT NULL DEFAULT '45',
    "clients" TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeroSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AboutSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "badgeText" TEXT NOT NULL DEFAULT 'Corporate Profile',
    "sectionTitle" TEXT NOT NULL DEFAULT 'About Us',
    "sectionSubtitle" TEXT DEFAULT 'Bridging technology and practical implementation to empower sustainable digital growth.',
    "bannerText" TEXT DEFAULT 'Intelligence ◆ Innovation ◆ Impact',
    "bannerSubtext" TEXT DEFAULT 'SOVA Corporate Overview',
    "tabData" JSONB,
    "primaryCtaText" TEXT DEFAULT 'Get In Touch',
    "secondaryCtaText" TEXT DEFAULT 'Explore Expertise →',
    "secondaryCtaHref" TEXT DEFAULT '#expertise',
    "imagePath" TEXT DEFAULT '/images/about_Image.png',
    "overlayLabel" TEXT DEFAULT 'Impact Metric',
    "overlayTitle" TEXT DEFAULT '100+ Organizations Empowered',
    "overlayBadge" TEXT DEFAULT 'AI',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AboutSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpertiseSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "badgeText" TEXT NOT NULL DEFAULT 'Core Operational Pillars',
    "sectionTitle" TEXT NOT NULL DEFAULT 'Our Expertise',
    "sectionSubtitle" TEXT DEFAULT 'Tailored AI deployment frameworks designed to solve real-world operational challenges for enterprise and community stakeholders.',
    "pillars" JSONB,
    "ctaText" TEXT DEFAULT 'Request Pillar Briefing',
    "ctaHref" TEXT DEFAULT '#contact',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpertiseSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServicesSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "badgeText" TEXT NOT NULL,
    "sectionTitle" TEXT NOT NULL,
    "sectionSubtitle" TEXT NOT NULL,
    "enterpriseMeta" JSONB NOT NULL,
    "individualMeta" JSONB NOT NULL,
    "enterpriseServices" JSONB NOT NULL,
    "individualServices" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServicesSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectsSettings" (
    "id" TEXT NOT NULL,
    "projects" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectsSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MethodologySettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "sectionBadge" TEXT NOT NULL,
    "sectionTitle" TEXT NOT NULL,
    "sectionDescription" TEXT NOT NULL,
    "steps" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MethodologySettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FooterSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "badgeText" TEXT NOT NULL,
    "headingText" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "companyRegistration" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "copyrightText" TEXT NOT NULL,
    "privacyPolicyText" TEXT NOT NULL,
    "privacyPolicyHref" TEXT NOT NULL,
    "termsText" TEXT NOT NULL,
    "termsHref" TEXT NOT NULL,
    "socialLinks" JSONB NOT NULL,
    "offices" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FooterSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "members" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamSettings_pkey" PRIMARY KEY ("id")
);

