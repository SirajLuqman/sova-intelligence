/*
  Warnings:

  - You are about to drop the column `badgeText` on the `AboutSettings` table. All the data in the column will be lost.
  - You are about to drop the column `bannerSubtext` on the `AboutSettings` table. All the data in the column will be lost.
  - You are about to drop the column `bannerText` on the `AboutSettings` table. All the data in the column will be lost.
  - You are about to drop the column `primaryCtaText` on the `AboutSettings` table. All the data in the column will be lost.
  - You are about to drop the column `secondaryCtaHref` on the `AboutSettings` table. All the data in the column will be lost.
  - You are about to drop the column `secondaryCtaText` on the `AboutSettings` table. All the data in the column will be lost.
  - You are about to drop the column `sectionSubtitle` on the `AboutSettings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AboutSettings" DROP COLUMN "badgeText",
DROP COLUMN "bannerSubtext",
DROP COLUMN "bannerText",
DROP COLUMN "primaryCtaText",
DROP COLUMN "secondaryCtaHref",
DROP COLUMN "secondaryCtaText",
DROP COLUMN "sectionSubtitle";
