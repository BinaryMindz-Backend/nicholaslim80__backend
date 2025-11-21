/*
  Warnings:

  - A unique constraint covering the columns `[referral_link]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "users_referral_link_key" ON "users"("referral_link");
