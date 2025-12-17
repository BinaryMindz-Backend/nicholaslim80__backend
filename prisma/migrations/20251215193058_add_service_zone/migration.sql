-- CreateTable
CREATE TABLE "serviceZone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "zoneName" TEXT NOT NULL,
    "coordinates" JSONB NOT NULL,
    "deliveryFee" DOUBLE PRECISION NOT NULL,
    "priority" INTEGER,
    "color" TEXT,
    "minOrderAmmount" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "serviceZone_pkey" PRIMARY KEY ("id")
);
