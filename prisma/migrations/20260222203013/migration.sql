/*
  Warnings:

  - The values [SUPER_ADMIN] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('USER', 'RAIDER', 'ADMIN');
ALTER TABLE "public"."AboutUs" ALTER COLUMN "faq_for" DROP DEFAULT;
ALTER TABLE "public"."ContentManagement" ALTER COLUMN "faq_for" DROP DEFAULT;
ALTER TABLE "public"."FAQ" ALTER COLUMN "faq_for" DROP DEFAULT;
ALTER TABLE "public"."Policy" ALTER COLUMN "faq_for" DROP DEFAULT;
ALTER TABLE "public"."article" ALTER COLUMN "faq_for" DROP DEFAULT;
ALTER TABLE "AboutUs" ALTER COLUMN "faq_for" TYPE "UserRole_new" USING ("faq_for"::text::"UserRole_new");
ALTER TABLE "article" ALTER COLUMN "faq_for" TYPE "UserRole_new" USING ("faq_for"::text::"UserRole_new");
ALTER TABLE "content_management_logs" ALTER COLUMN "faqFor" TYPE "UserRole_new" USING ("faqFor"::text::"UserRole_new");
ALTER TABLE "ContentManagement" ALTER COLUMN "faq_for" TYPE "UserRole_new" USING ("faq_for"::text::"UserRole_new");
ALTER TABLE "FAQ" ALTER COLUMN "faq_for" TYPE "UserRole_new" USING ("faq_for"::text::"UserRole_new");
ALTER TABLE "Policy" ALTER COLUMN "faq_for" TYPE "UserRole_new" USING ("faq_for"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
ALTER TABLE "AboutUs" ALTER COLUMN "faq_for" SET DEFAULT 'USER';
ALTER TABLE "ContentManagement" ALTER COLUMN "faq_for" SET DEFAULT 'USER';
ALTER TABLE "FAQ" ALTER COLUMN "faq_for" SET DEFAULT 'USER';
ALTER TABLE "Policy" ALTER COLUMN "faq_for" SET DEFAULT 'USER';
ALTER TABLE "article" ALTER COLUMN "faq_for" SET DEFAULT 'USER';
COMMIT;
