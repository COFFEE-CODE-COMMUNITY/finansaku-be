/*
  Warnings:

  - You are about to drop the column `city_id` on the `living_cost` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[year]` on the table `living_cost` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "living_cost" DROP CONSTRAINT "living_cost_city_id_fkey";

-- DropIndex
DROP INDEX "living_cost_city_id_idx";

-- DropIndex
DROP INDEX "living_cost_city_id_year_key";

-- AlterTable
ALTER TABLE "living_cost" DROP COLUMN "city_id";

-- CreateIndex
CREATE UNIQUE INDEX "living_cost_year_key" ON "living_cost"("year");
