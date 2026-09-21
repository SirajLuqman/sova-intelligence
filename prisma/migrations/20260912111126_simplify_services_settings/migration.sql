/*
  Warnings:

  - You are about to drop the column `badgeText` on the `ServicesSettings` table. All the data in the column will be lost.
  - You are about to drop the column `enterpriseMeta` on the `ServicesSettings` table. All the data in the column will be lost.
  - You are about to drop the column `individualMeta` on the `ServicesSettings` table. All the data in the column will be lost.
  - You are about to drop the column `sectionSubtitle` on the `ServicesSettings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ServicesSettings" DROP COLUMN "badgeText",
DROP COLUMN "enterpriseMeta",
DROP COLUMN "individualMeta",
DROP COLUMN "sectionSubtitle";
