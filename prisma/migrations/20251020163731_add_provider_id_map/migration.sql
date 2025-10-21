/*
  Warnings:

  - You are about to drop the column `providerId` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[provider_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."users_providerId_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "providerId",
ADD COLUMN     "provider_id" VARCHAR(255);

-- CreateIndex
CREATE UNIQUE INDEX "users_provider_id_key" ON "users"("provider_id");
