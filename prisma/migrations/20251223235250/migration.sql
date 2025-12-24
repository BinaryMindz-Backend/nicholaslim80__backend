/*
  Warnings:

  - The values [COMPLETED20_ORDER] on the enum `CoinEvent` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CoinEvent_new" AS ENUM ('FIRST_SIGNUP', 'DAILY_LOGIN', 'SHARE_ON_SOCIAL', 'REFERRAL', 'COMPLETED_ORDER');
ALTER TYPE "CoinEvent" RENAME TO "CoinEvent_old";
ALTER TYPE "CoinEvent_new" RENAME TO "CoinEvent";
DROP TYPE "public"."CoinEvent_old";
COMMIT;
