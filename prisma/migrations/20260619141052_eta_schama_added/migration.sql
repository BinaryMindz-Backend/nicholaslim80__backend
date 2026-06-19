-- CreateTable
CREATE TABLE "TriggerEvent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "backendTag" TEXT NOT NULL,
    "description" TEXT,
    "expectedValue" INTEGER,
    "expectedValueType" TEXT,
    "status" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TriggerEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "triggerTag" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "targetValue" TEXT NOT NULL,
    "stopScope" TEXT NOT NULL DEFAULT 'DYNAMIC',
    "fixedStopIndex" INTEGER,
    "notifTitle" TEXT NOT NULL,
    "notifMessage" TEXT NOT NULL,
    "sendToSender" BOOLEAN NOT NULL DEFAULT false,
    "sendToRecipient" BOOLEAN NOT NULL DEFAULT false,
    "viaPush" BOOLEAN NOT NULL DEFAULT false,
    "viaWhatsApp" BOOLEAN NOT NULL DEFAULT false,
    "viaSMS" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiredNotification" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "orderId" INTEGER NOT NULL,
    "stopIndex" INTEGER NOT NULL,
    "firedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FiredNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TriggerEvent_backendTag_key" ON "TriggerEvent"("backendTag");

-- CreateIndex
CREATE UNIQUE INDEX "FiredNotification_ruleId_orderId_stopIndex_key" ON "FiredNotification"("ruleId", "orderId", "stopIndex");
