-- CreateEnum
CREATE TYPE "Advertisementfor" AS ENUM ('USER', 'RAIDER');

-- CreateTable
CREATE TABLE "Advertise" (
    "id" SERIAL NOT NULL,
    "create_for" "Advertisementfor" NOT NULL DEFAULT 'USER',
    "ad_title" TEXT NOT NULL,
    "ad_image" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Advertise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdvertiseAnalytics" (
    "id" SERIAL NOT NULL,
    "advertiseId" INTEGER NOT NULL,
    "impression" INTEGER NOT NULL DEFAULT 0,
    "click" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdvertiseAnalytics_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AdvertiseAnalytics" ADD CONSTRAINT "AdvertiseAnalytics_advertiseId_fkey" FOREIGN KEY ("advertiseId") REFERENCES "Advertise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
