/*
  Warnings:

  - You are about to drop the column `current_coin_balance` on the `coin_history` table. All the data in the column will be lost.
  - You are about to drop the column `total_coin_acc` on the `coin_history` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `coin_history` table. All the data in the column will be lost.
  - Added the required column `coin_acc_amount` to the `coin_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role_triggered` to the `coin_history` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "coin_history" DROP COLUMN "current_coin_balance",
DROP COLUMN "total_coin_acc",
DROP COLUMN "username",
ADD COLUMN     "coin_acc_amount" INTEGER NOT NULL,
ADD COLUMN     "edited_by" TEXT,
ADD COLUMN     "role_triggered" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "current_coin_balance" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_coin_acc" INTEGER NOT NULL DEFAULT 0;
