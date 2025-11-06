/*
  Warnings:

  - You are about to drop the column `remember_token` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."users_remember_token_idx";

-- AlterTable
ALTER TABLE "living_cost" ALTER COLUMN "index" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "users" DROP COLUMN "remember_token";
