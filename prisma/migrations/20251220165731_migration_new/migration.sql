/*
  Warnings:

  - You are about to drop the column `role_triggered` on the `coin_history` table. All the data in the column will be lost.
  - You are about to drop the column `total_coin_apply` on the `coin_history` table. All the data in the column will be lost.
  - The `type` column on the `coin_history` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `event_triggered` on the `coins` table. All the data in the column will be lost.
  - You are about to drop the column `expire_date` on the `coins` table. All the data in the column will be lost.
  - You are about to alter the column `coin_amount` on the `coins` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Integer`.
  - A unique constraint covering the columns `[key]` on the table `coins` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `key` to the `coins` table without a default value. This is not possible if the table is not empty.
  - Made the column `coin_amount` on table `coins` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "coin_history" DROP COLUMN "role_triggered",
DROP COLUMN "total_coin_apply",
DROP COLUMN "type",
ADD COLUMN     "type" TEXT;

-- AlterTable
ALTER TABLE "coins" DROP COLUMN "event_triggered",
DROP COLUMN "expire_date",
ADD COLUMN     "condition" JSONB,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "expire_days" INTEGER,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "key" TEXT NOT NULL,
ALTER COLUMN "coin_amount" SET NOT NULL,
ALTER COLUMN "coin_amount" SET DATA TYPE INTEGER;

-- CreateTable
CREATE TABLE "coin_acc_history" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "role_triggered" TEXT NOT NULL,
    "coin_amount" INTEGER NOT NULL,
    "edited_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coin_acc_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coin_acc_history_userId_key" ON "coin_acc_history"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "coins_key_key" ON "coins"("key");
