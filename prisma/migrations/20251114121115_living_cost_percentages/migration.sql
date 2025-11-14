/*
  Warnings:

  - You are about to drop the column `index` on the `living_cost` table. All the data in the column will be lost.
  - You are about to drop the column `source_url` on the `living_cost` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[country,year]` on the table `living_cost` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `country` to the `living_cost` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currency` to the `living_cost` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "living_cost_year_key";

-- AlterTable
ALTER TABLE "living_cost" DROP COLUMN "index",
DROP COLUMN "source_url",
ADD COLUMN     "avg_net_salary" DECIMAL(18,2),
ADD COLUMN     "buy_apartment_pct" DECIMAL(5,2),
ADD COLUMN     "clothing_pct" DECIMAL(5,2),
ADD COLUMN     "country" VARCHAR(100) NOT NULL,
ADD COLUMN     "currency" VARCHAR(10) NOT NULL,
ADD COLUMN     "family_of_four_excl_rent" DECIMAL(18,2),
ADD COLUMN     "markets_pct" DECIMAL(5,2),
ADD COLUMN     "rent_pct" DECIMAL(5,2),
ADD COLUMN     "restaurants_pct" DECIMAL(5,2),
ADD COLUMN     "single_person_excl_rent" DECIMAL(18,2),
ADD COLUMN     "sports_leisure_pct" DECIMAL(5,2),
ADD COLUMN     "transportation_pct" DECIMAL(5,2),
ADD COLUMN     "utilities_pct" DECIMAL(5,2);

-- CreateIndex
CREATE INDEX "living_cost_country_idx" ON "living_cost"("country");

-- CreateIndex
CREATE UNIQUE INDEX "living_cost_country_year_key" ON "living_cost"("country", "year");
