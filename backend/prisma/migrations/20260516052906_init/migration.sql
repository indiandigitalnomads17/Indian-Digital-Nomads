/*
  Warnings:

  - You are about to drop the column `projectUrl` on the `Project` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Project" DROP COLUMN "projectUrl",
ADD COLUMN     "links" TEXT[] DEFAULT ARRAY[]::TEXT[];
