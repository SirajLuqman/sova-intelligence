/*
  Warnings:

  - You are about to drop the column `badgeText` on the `ExpertiseSettings` table. All the data in the column will be lost.
  - You are about to drop the column `ctaHref` on the `ExpertiseSettings` table. All the data in the column will be lost.
  - You are about to drop the column `ctaText` on the `ExpertiseSettings` table. All the data in the column will be lost.
  - You are about to drop the column `sectionSubtitle` on the `ExpertiseSettings` table. All the data in the column will be lost.
  - Made the column `pillars` on table `ExpertiseSettings` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ExpertiseSettings" DROP COLUMN "badgeText",
DROP COLUMN "ctaHref",
DROP COLUMN "ctaText",
DROP COLUMN "sectionSubtitle",
ALTER COLUMN "sectionTitle" DROP DEFAULT,
ALTER COLUMN "pillars" SET NOT NULL;
