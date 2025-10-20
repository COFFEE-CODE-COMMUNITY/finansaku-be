-- DropForeignKey
ALTER TABLE "public"."users" DROP CONSTRAINT "users_city_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."users" DROP CONSTRAINT "users_template_id_fkey";

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "city_id" DROP NOT NULL,
ALTER COLUMN "template_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id_city") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "allocation_templates"("id_template") ON DELETE SET NULL ON UPDATE CASCADE;
