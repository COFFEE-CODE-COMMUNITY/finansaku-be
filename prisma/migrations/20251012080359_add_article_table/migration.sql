-- CreateTable
CREATE TABLE "article" (
    "id_article" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "article_pkey" PRIMARY KEY ("id_article")
);

-- CreateIndex
CREATE UNIQUE INDEX "article_title_key" ON "article"("title");
