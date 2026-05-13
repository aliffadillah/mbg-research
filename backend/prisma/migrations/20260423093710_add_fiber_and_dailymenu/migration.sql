-- AlterTable
ALTER TABLE "nutritions" ADD COLUMN     "fiber" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "daily_menus" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "foods" JSONB NOT NULL,
    "large_portion" JSONB NOT NULL,
    "small_portion" JSONB NOT NULL,

    CONSTRAINT "daily_menus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_menus_name_key" ON "daily_menus"("name");
