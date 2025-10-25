-- CreateTable
CREATE TABLE "living_cost" (
    "id_living_cost" UUID NOT NULL,
    "city_id" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "index" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'IDR',
    "source_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "living_cost_pkey" PRIMARY KEY ("id_living_cost")
);

-- CreateTable
CREATE TABLE "aggregator_logs" (
    "id_aggregator_log" UUID NOT NULL,
    "city_id" UUID,
    "year" INTEGER,
    "type" VARCHAR(20) NOT NULL,
    "chosen_source" VARCHAR(100),
    "confidence" DECIMAL(5,2),
    "status" VARCHAR(20) NOT NULL DEFAULT 'success',
    "message" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aggregator_logs_pkey" PRIMARY KEY ("id_aggregator_log")
);

-- CreateIndex
CREATE INDEX "living_cost_city_id_idx" ON "living_cost"("city_id");

-- CreateIndex
CREATE INDEX "living_cost_year_idx" ON "living_cost"("year");

-- CreateIndex
CREATE UNIQUE INDEX "living_cost_city_id_year_key" ON "living_cost"("city_id", "year");

-- CreateIndex
CREATE INDEX "aggregator_logs_city_id_idx" ON "aggregator_logs"("city_id");

-- CreateIndex
CREATE INDEX "aggregator_logs_year_idx" ON "aggregator_logs"("year");

-- CreateIndex
CREATE INDEX "aggregator_logs_type_idx" ON "aggregator_logs"("type");

-- CreateIndex
CREATE INDEX "aggregator_logs_status_idx" ON "aggregator_logs"("status");

-- AddForeignKey
ALTER TABLE "living_cost" ADD CONSTRAINT "living_cost_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id_city") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aggregator_logs" ADD CONSTRAINT "aggregator_logs_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id_city") ON DELETE SET NULL ON UPDATE CASCADE;
