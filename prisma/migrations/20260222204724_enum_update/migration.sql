/*
  Warnings:

  - The values [SUPER_ADMIN] on the enum `AdminRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AdminRole_new" AS ENUM ('ADMIN', 'MODERATOR');
ALTER TYPE "AdminRole" RENAME TO "AdminRole_old";
ALTER TYPE "AdminRole_new" RENAME TO "AdminRole";
DROP TYPE "public"."AdminRole_old";
COMMIT;
