/*
  Warnings:

  - You are about to drop the column `avg_net_salary` on the `living_cost` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `living_cost` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `living_cost` table. All the data in the column will be lost.
  - You are about to drop the column `family_of_four_excl_rent` on the `living_cost` table. All the data in the column will be lost.
  - You are about to drop the column `single_person_excl_rent` on the `living_cost` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[year,city_id]` on the table `living_cost` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "living_cost_country_idx";

-- DropIndex
DROP INDEX "living_cost_country_year_key";

-- AlterTable
ALTER TABLE "aggregator_logs" ALTER COLUMN "message" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "living_cost" DROP COLUMN "avg_net_salary",
DROP COLUMN "country",
DROP COLUMN "currency",
DROP COLUMN "family_of_four_excl_rent",
DROP COLUMN "single_person_excl_rent",
ADD COLUMN     "city_id" UUID;

-- CreateIndex
CREATE INDEX "living_cost_city_id_idx" ON "living_cost"("city_id");

-- CreateIndex
CREATE UNIQUE INDEX "living_cost_year_city_id_key" ON "living_cost"("year", "city_id");
