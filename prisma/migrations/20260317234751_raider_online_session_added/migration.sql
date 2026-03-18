-- CreateTable
CREATE TABLE "RaiderOnlineSession" (
    "id" SERIAL NOT NULL,
    "raiderId" INTEGER NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endAt" TIMESTAMP(3),

    CONSTRAINT "RaiderOnlineSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RaiderOnlineSession_raiderId_startAt_idx" ON "RaiderOnlineSession"("raiderId", "startAt");

-- AddForeignKey
ALTER TABLE "RaiderOnlineSession" ADD CONSTRAINT "RaiderOnlineSession_raiderId_fkey" FOREIGN KEY ("raiderId") REFERENCES "Raider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
