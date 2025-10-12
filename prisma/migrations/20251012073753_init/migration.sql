-- CreateTable
CREATE TABLE "users" (
    "id_user" UUID NOT NULL,
    "city_id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "email_verified_at" TIMESTAMP(3),
    "password" TEXT NOT NULL,
    "remember_token" VARCHAR(255),
    "profile_image" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id_user")
);

-- CreateTable
CREATE TABLE "cities" (
    "id_city" UUID NOT NULL,
    "city_name" VARCHAR(100) NOT NULL,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id_city")
);

-- CreateTable
CREATE TABLE "umk" (
    "id_umk" UUID NOT NULL,
    "city_id" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "umk_pkey" PRIMARY KEY ("id_umk")
);

-- CreateTable
CREATE TABLE "allocation_templates" (
    "id_template" UUID NOT NULL,
    "persona" VARCHAR(50) NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "allocation_templates_pkey" PRIMARY KEY ("id_template")
);

-- CreateTable
CREATE TABLE "allocation_template_items" (
    "id_template_item" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "subcategory_id" UUID NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "allocation_template_items_pkey" PRIMARY KEY ("id_template_item")
);

-- CreateTable
CREATE TABLE "budget_categories" (
    "id_category" UUID NOT NULL,
    "user_id" UUID,
    "name" VARCHAR(100) NOT NULL,
    "default_percentage" DECIMAL(5,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_categories_pkey" PRIMARY KEY ("id_category")
);

-- CreateTable
CREATE TABLE "budget_subcategories" (
    "id_subcategory" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "user_id" UUID,
    "name" VARCHAR(100) NOT NULL,
    "default_percentage" DECIMAL(5,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_subcategories_pkey" PRIMARY KEY ("id_subcategory")
);

-- CreateTable
CREATE TABLE "saku" (
    "id_saku" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "city_id" UUID NOT NULL,
    "umk_id" UUID,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "salary" DECIMAL(15,2),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saku_pkey" PRIMARY KEY ("id_saku")
);

-- CreateTable
CREATE TABLE "saku_allocations" (
    "id_saku_allocation" UUID NOT NULL,
    "saku_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "subcategory_id" UUID,
    "percentage" DECIMAL(5,2),
    "fixed_amount" DECIMAL(15,2),
    "amount" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saku_allocations_pkey" PRIMARY KEY ("id_saku_allocation")
);

-- CreateTable
CREATE TABLE "saku_details" (
    "id_saku_detail" UUID NOT NULL,
    "saku_id" UUID NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value_number" DECIMAL(15,2),
    "value_text" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saku_details_pkey" PRIMARY KEY ("id_saku_detail")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id_event" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "category_id" UUID,
    "subcategory_id" UUID,
    "due_date" TIMESTAMP(3) NOT NULL,
    "expected_amount" DECIMAL(15,2),
    "recurrence_rule" VARCHAR(255),
    "remind_offset" INTEGER,
    "status" VARCHAR(20) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id_event")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id_notification" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "admin_id" UUID,
    "announcement_id" UUID,
    "title" VARCHAR(140) NOT NULL,
    "body" TEXT NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "notifiable_type" VARCHAR(40),
    "notifiable_id" UUID,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id_notification")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id_pref" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "in_app_reminder" BOOLEAN NOT NULL DEFAULT true,
    "email_reminder" BOOLEAN NOT NULL DEFAULT false,
    "in_app_system" BOOLEAN NOT NULL DEFAULT true,
    "email_system" BOOLEAN NOT NULL DEFAULT false,
    "in_app_survey" BOOLEAN NOT NULL DEFAULT true,
    "email_survey" BOOLEAN NOT NULL DEFAULT false,
    "in_app_budget" BOOLEAN NOT NULL DEFAULT true,
    "email_budget" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id_pref")
);

-- CreateTable
CREATE TABLE "admins" (
    "id_admin" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" VARCHAR(30) NOT NULL,
    "active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id_admin")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id_announcement" UUID NOT NULL,
    "admin_id" UUID NOT NULL,
    "title" VARCHAR(140) NOT NULL,
    "body" TEXT NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "notifiable_type" VARCHAR(40),
    "notifiable_id" UUID,
    "audience_scope" VARCHAR(30) NOT NULL,
    "audience_user_id" UUID,
    "audience_persona" TEXT,
    "audience_city_id" UUID,
    "scheduled_at" TIMESTAMP(3),
    "status" VARCHAR(12) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id_announcement")
);

-- CreateTable
CREATE TABLE "_AnnouncementsByAdmin" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_AnnouncementsByAdmin_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_city_id_idx" ON "users"("city_id");

-- CreateIndex
CREATE INDEX "users_template_id_idx" ON "users"("template_id");

-- CreateIndex
CREATE INDEX "users_remember_token_idx" ON "users"("remember_token");

-- CreateIndex
CREATE INDEX "cities_city_name_idx" ON "cities"("city_name");

-- CreateIndex
CREATE INDEX "umk_city_id_idx" ON "umk"("city_id");

-- CreateIndex
CREATE INDEX "umk_year_idx" ON "umk"("year");

-- CreateIndex
CREATE UNIQUE INDEX "umk_city_id_year_key" ON "umk"("city_id", "year");

-- CreateIndex
CREATE UNIQUE INDEX "allocation_templates_persona_key" ON "allocation_templates"("persona");

-- CreateIndex
CREATE INDEX "allocation_template_items_template_id_idx" ON "allocation_template_items"("template_id");

-- CreateIndex
CREATE INDEX "allocation_template_items_category_id_idx" ON "allocation_template_items"("category_id");

-- CreateIndex
CREATE INDEX "allocation_template_items_subcategory_id_idx" ON "allocation_template_items"("subcategory_id");

-- CreateIndex
CREATE UNIQUE INDEX "allocation_template_items_template_id_category_id_subcatego_key" ON "allocation_template_items"("template_id", "category_id", "subcategory_id");

-- CreateIndex
CREATE INDEX "budget_categories_user_id_idx" ON "budget_categories"("user_id");

-- CreateIndex
CREATE INDEX "budget_categories_name_idx" ON "budget_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "budget_categories_user_id_name_key" ON "budget_categories"("user_id", "name");

-- CreateIndex
CREATE INDEX "budget_subcategories_category_id_idx" ON "budget_subcategories"("category_id");

-- CreateIndex
CREATE INDEX "budget_subcategories_user_id_idx" ON "budget_subcategories"("user_id");

-- CreateIndex
CREATE INDEX "budget_subcategories_name_idx" ON "budget_subcategories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "budget_subcategories_category_id_user_id_name_key" ON "budget_subcategories"("category_id", "user_id", "name");

-- CreateIndex
CREATE INDEX "saku_user_id_idx" ON "saku"("user_id");

-- CreateIndex
CREATE INDEX "saku_city_id_idx" ON "saku"("city_id");

-- CreateIndex
CREATE INDEX "saku_umk_id_idx" ON "saku"("umk_id");

-- CreateIndex
CREATE INDEX "saku_year_idx" ON "saku"("year");

-- CreateIndex
CREATE INDEX "saku_month_idx" ON "saku"("month");

-- CreateIndex
CREATE UNIQUE INDEX "saku_user_id_city_id_year_month_key" ON "saku"("user_id", "city_id", "year", "month");

-- CreateIndex
CREATE INDEX "saku_allocations_saku_id_idx" ON "saku_allocations"("saku_id");

-- CreateIndex
CREATE INDEX "saku_allocations_category_id_idx" ON "saku_allocations"("category_id");

-- CreateIndex
CREATE INDEX "saku_allocations_subcategory_id_idx" ON "saku_allocations"("subcategory_id");

-- CreateIndex
CREATE UNIQUE INDEX "saku_allocations_saku_id_category_id_subcategory_id_key" ON "saku_allocations"("saku_id", "category_id", "subcategory_id");

-- CreateIndex
CREATE INDEX "saku_details_saku_id_idx" ON "saku_details"("saku_id");

-- CreateIndex
CREATE INDEX "saku_details_key_idx" ON "saku_details"("key");

-- CreateIndex
CREATE INDEX "calendar_events_user_id_idx" ON "calendar_events"("user_id");

-- CreateIndex
CREATE INDEX "calendar_events_category_id_idx" ON "calendar_events"("category_id");

-- CreateIndex
CREATE INDEX "calendar_events_subcategory_id_idx" ON "calendar_events"("subcategory_id");

-- CreateIndex
CREATE INDEX "calendar_events_due_date_idx" ON "calendar_events"("due_date");

-- CreateIndex
CREATE INDEX "calendar_events_recurrence_rule_idx" ON "calendar_events"("recurrence_rule");

-- CreateIndex
CREATE INDEX "calendar_events_remind_offset_idx" ON "calendar_events"("remind_offset");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_key" ON "notification_preferences"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "admins_user_id_key" ON "admins"("user_id");

-- CreateIndex
CREATE INDEX "announcements_status_scheduled_at_idx" ON "announcements"("status", "scheduled_at");

-- CreateIndex
CREATE INDEX "_AnnouncementsByAdmin_B_index" ON "_AnnouncementsByAdmin"("B");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id_city") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "allocation_templates"("id_template") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "umk" ADD CONSTRAINT "umk_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id_city") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocation_template_items" ADD CONSTRAINT "allocation_template_items_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "allocation_templates"("id_template") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocation_template_items" ADD CONSTRAINT "allocation_template_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "budget_categories"("id_category") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocation_template_items" ADD CONSTRAINT "allocation_template_items_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "budget_subcategories"("id_subcategory") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_categories" ADD CONSTRAINT "budget_categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id_user") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_subcategories" ADD CONSTRAINT "budget_subcategories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "budget_categories"("id_category") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_subcategories" ADD CONSTRAINT "budget_subcategories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id_user") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saku" ADD CONSTRAINT "saku_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saku" ADD CONSTRAINT "saku_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id_city") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saku" ADD CONSTRAINT "saku_umk_id_fkey" FOREIGN KEY ("umk_id") REFERENCES "umk"("id_umk") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saku_allocations" ADD CONSTRAINT "saku_allocations_saku_id_fkey" FOREIGN KEY ("saku_id") REFERENCES "saku"("id_saku") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saku_allocations" ADD CONSTRAINT "saku_allocations_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "budget_categories"("id_category") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saku_allocations" ADD CONSTRAINT "saku_allocations_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "budget_subcategories"("id_subcategory") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saku_details" ADD CONSTRAINT "saku_details_saku_id_fkey" FOREIGN KEY ("saku_id") REFERENCES "saku"("id_saku") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "budget_categories"("id_category") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "budget_subcategories"("id_subcategory") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id_admin") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "announcements"("id_announcement") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admins" ADD CONSTRAINT "admins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id_admin") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_audience_user_id_fkey" FOREIGN KEY ("audience_user_id") REFERENCES "users"("id_user") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_audience_city_id_fkey" FOREIGN KEY ("audience_city_id") REFERENCES "cities"("id_city") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AnnouncementsByAdmin" ADD CONSTRAINT "_AnnouncementsByAdmin_A_fkey" FOREIGN KEY ("A") REFERENCES "announcements"("id_announcement") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AnnouncementsByAdmin" ADD CONSTRAINT "_AnnouncementsByAdmin_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;
