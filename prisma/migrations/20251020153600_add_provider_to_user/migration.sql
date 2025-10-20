/*
  Warnings:

  - A unique constraint covering the columns `[providerId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "provider" VARCHAR(50) DEFAULT 'local',
ADD COLUMN     "providerId" VARCHAR(255);

-- CreateIndex
CREATE UNIQUE INDEX "users_providerId_key" ON "users"("providerId");
