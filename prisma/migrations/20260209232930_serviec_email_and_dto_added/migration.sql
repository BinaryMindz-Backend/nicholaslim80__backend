-- CreateTable
CREATE TABLE "ServiceConfig" (
    "id" SERIAL NOT NULL,
    "service_email" TEXT NOT NULL,
    "service_number" INTEGER NOT NULL,

    CONSTRAINT "ServiceConfig_pkey" PRIMARY KEY ("id")
);
