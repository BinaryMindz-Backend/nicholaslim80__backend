-- CreateEnum
CREATE TYPE "DisputeRole" AS ENUM ('USER', 'DRIVER');

-- CreateTable
CREATE TABLE "DisputeType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "DisputeRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DisputeType_pkey" PRIMARY KEY ("id")
);
