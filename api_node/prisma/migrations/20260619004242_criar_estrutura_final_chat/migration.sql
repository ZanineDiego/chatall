/*
  Warnings:

  - You are about to drop the column `endedAt` on the `MatchHistory` table. All the data in the column will be lost.
  - You are about to drop the column `age` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `gender` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `appleId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `googleId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Report` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `myAge` to the `Profile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `myGender` to the `Profile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Profile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.
  - Made the column `email` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_reportedId_fkey";

-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_reporterId_fkey";

-- DropIndex
DROP INDEX "User_appleId_key";

-- DropIndex
DROP INDEX "User_googleId_key";

-- AlterTable
ALTER TABLE "ChatMessage" ALTER COLUMN "mediaType" SET DEFAULT 'text';

-- AlterTable
ALTER TABLE "MatchHistory" DROP COLUMN "endedAt";

-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "age",
DROP COLUMN "gender",
ADD COLUMN     "maxAge" INTEGER NOT NULL DEFAULT 99,
ADD COLUMN     "minAge" INTEGER NOT NULL DEFAULT 18,
ADD COLUMN     "myAge" INTEGER NOT NULL,
ADD COLUMN     "myGender" TEXT NOT NULL,
ADD COLUMN     "searchingForGender" TEXT NOT NULL DEFAULT 'all',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "appleId",
DROP COLUMN "googleId",
ADD COLUMN     "password" TEXT NOT NULL,
ALTER COLUMN "email" SET NOT NULL;

-- DropTable
DROP TABLE "Report";

-- CreateIndex
CREATE INDEX "ChatMessage_roomId_idx" ON "ChatMessage"("roomId");
