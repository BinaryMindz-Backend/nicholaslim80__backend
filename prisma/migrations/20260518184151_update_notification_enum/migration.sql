/*
  Warnings:

  - The values [PROMOTION,GENERAL] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('PUSH_NOTIFICATION', 'EMAIL', 'SMS', 'WEB_ANNOUNCEMENT', 'IN_APP', 'ORDER_UPDATE', 'FUNDS_FAILURE', 'FUNDS_CREDITED', 'COIN_CREDITED', 'ACCOUNT_UPDATE', 'COIN_REDEEMED', 'DISPUTE_RESOLVED', 'TIP_RECEIVED', 'TIP_SENT');
ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "public"."NotificationType_old";
COMMIT;
