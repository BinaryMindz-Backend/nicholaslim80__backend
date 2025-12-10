-- CreateEnum
CREATE TYPE "ContentManagementType" AS ENUM ('TERMSANDCONDITION', 'PRIVANCYPOLICY', 'CANCELLATIONANDWAITINGPOLICY', 'FAQ', 'HELPARTICLES', 'ABOUTUS');

-- CreateTable
CREATE TABLE "ContentManagement" (
    "id" SERIAL NOT NULL,
    "contenttype" "ContentManagementType" NOT NULL,
    "description" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL,
    "version" INTEGER,

    CONSTRAINT "ContentManagement_pkey" PRIMARY KEY ("id")
);
