/*
  Warnings:

  - You are about to drop the column `uploadedById` on the `File` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[messageId]` on the table `File` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[fileId]` on the table `Message` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `uploaderId` to the `File` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('AVATAR', 'IMAGE', 'VIDEO', 'DOCUMENT');

-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_messageId_fkey";

-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_uploadedById_fkey";

-- AlterTable
ALTER TABLE "File" DROP COLUMN "uploadedById",
ADD COLUMN     "cloudinaryId" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "fileType" "FileType" NOT NULL DEFAULT 'IMAGE',
ADD COLUMN     "uploaderId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "fileId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "File_messageId_key" ON "File"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "Message_fileId_key" ON "Message"("fileId");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
