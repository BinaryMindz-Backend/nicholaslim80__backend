/*
  Warnings:

  - You are about to drop the `reviews` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_orderId_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_raiderId_fkey";

-- DropTable
DROP TABLE "reviews";

-- CreateTable
CREATE TABLE "rate_customers" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "raiderId" INTEGER,
    "user_id" INTEGER,
    "rating_star" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "rate_customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_raiders" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "raiderId" INTEGER,
    "user_id" INTEGER,
    "delivery_quality" "DeliveryQuality" NOT NULL,
    "delivery_status" "DeliveryStatus" NOT NULL,
    "rating_star" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "rate_raiders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rate_customers_orderId_key" ON "rate_customers"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "rate_raiders_orderId_key" ON "rate_raiders"("orderId");

-- AddForeignKey
ALTER TABLE "rate_customers" ADD CONSTRAINT "rate_customers_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rate_customers" ADD CONSTRAINT "rate_customers_raiderId_fkey" FOREIGN KEY ("raiderId") REFERENCES "Raider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rate_customers" ADD CONSTRAINT "rate_customers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rate_raiders" ADD CONSTRAINT "rate_raiders_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rate_raiders" ADD CONSTRAINT "rate_raiders_raiderId_fkey" FOREIGN KEY ("raiderId") REFERENCES "Raider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rate_raiders" ADD CONSTRAINT "rate_raiders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
