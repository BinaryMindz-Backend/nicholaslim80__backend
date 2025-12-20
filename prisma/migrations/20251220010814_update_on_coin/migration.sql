/*
  Warnings:

  - Changed the type of `event_triggered` on the `coins` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "coin_history" ADD COLUMN     "role_triggered" TEXT;

-- AlterTable
ALTER TABLE "coins" DROP COLUMN "event_triggered",
ADD COLUMN     "event_triggered" TEXT NOT NULL;
