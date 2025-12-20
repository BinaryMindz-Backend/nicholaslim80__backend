-- CreateTable
CREATE TABLE "collected_incentives" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "incentiveId" INTEGER,
    "amount" INTEGER DEFAULT 0,
    "is_collected" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collected_incentives_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "collected_incentives" ADD CONSTRAINT "collected_incentives_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collected_incentives" ADD CONSTRAINT "collected_incentives_incentiveId_fkey" FOREIGN KEY ("incentiveId") REFERENCES "incentives"("id") ON DELETE SET NULL ON UPDATE CASCADE;
