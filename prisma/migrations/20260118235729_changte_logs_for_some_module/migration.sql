-- CreateTable
CREATE TABLE "advertise_logs" (
    "id" SERIAL NOT NULL,
    "advertiseId" INTEGER NOT NULL,
    "createFor" TEXT NOT NULL,
    "adTitle" TEXT NOT NULL,
    "adImage" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "changedByRole" TEXT NOT NULL,
    "changedByUserId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "advertise_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coin_logs" (
    "id" SERIAL NOT NULL,
    "coinId" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "coinAmount" INTEGER NOT NULL,
    "condition" JSONB,
    "expireDays" INTEGER,
    "coinValueInCent" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL,
    "changedByRole" TEXT NOT NULL,
    "changedByUserId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coin_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_management_logs" (
    "id" SERIAL NOT NULL,
    "contentId" INTEGER NOT NULL,
    "contentType" "ContentManagementType" NOT NULL,
    "faqFor" "UserRole" NOT NULL,
    "description" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL,
    "version" INTEGER,
    "changedByRole" TEXT NOT NULL,
    "changedByUserId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_management_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incentive_logs" (
    "id" SERIAL NOT NULL,
    "incentiveId" INTEGER NOT NULL,
    "incentiveName" TEXT,
    "type" "IncentiveType" NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "incentiveAmount" INTEGER,
    "status" "IncentiveStatus" NOT NULL,
    "changedByRole" TEXT NOT NULL,
    "changedByAdminId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incentive_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_logs" (
    "id" SERIAL NOT NULL,
    "quizId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "quizOption" JSONB,
    "description" TEXT,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL,
    "changedByRole" TEXT NOT NULL,
    "changedByAdminId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "advertise_logs_advertiseId_idx" ON "advertise_logs"("advertiseId");

-- CreateIndex
CREATE INDEX "advertise_logs_createdAt_idx" ON "advertise_logs"("createdAt");

-- CreateIndex
CREATE INDEX "coin_logs_coinId_idx" ON "coin_logs"("coinId");

-- CreateIndex
CREATE INDEX "coin_logs_createdAt_idx" ON "coin_logs"("createdAt");

-- CreateIndex
CREATE INDEX "content_management_logs_contentId_idx" ON "content_management_logs"("contentId");

-- CreateIndex
CREATE INDEX "content_management_logs_createdAt_idx" ON "content_management_logs"("createdAt");

-- CreateIndex
CREATE INDEX "incentive_logs_incentiveId_idx" ON "incentive_logs"("incentiveId");

-- CreateIndex
CREATE INDEX "incentive_logs_createdAt_idx" ON "incentive_logs"("createdAt");

-- CreateIndex
CREATE INDEX "quiz_logs_quizId_idx" ON "quiz_logs"("quizId");

-- CreateIndex
CREATE INDEX "quiz_logs_createdAt_idx" ON "quiz_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "advertise_logs" ADD CONSTRAINT "advertise_logs_advertiseId_fkey" FOREIGN KEY ("advertiseId") REFERENCES "Advertise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coin_logs" ADD CONSTRAINT "coin_logs_coinId_fkey" FOREIGN KEY ("coinId") REFERENCES "coins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_management_logs" ADD CONSTRAINT "content_management_logs_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "ContentManagement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incentive_logs" ADD CONSTRAINT "incentive_logs_incentiveId_fkey" FOREIGN KEY ("incentiveId") REFERENCES "incentives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_logs" ADD CONSTRAINT "quiz_logs_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
