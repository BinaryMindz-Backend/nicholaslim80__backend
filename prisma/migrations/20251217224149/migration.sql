/*
  Warnings:

  - A unique constraint covering the columns `[raiderId]` on the table `raider_locations` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "raider_locations_raiderId_key" ON "raider_locations"("raiderId");
