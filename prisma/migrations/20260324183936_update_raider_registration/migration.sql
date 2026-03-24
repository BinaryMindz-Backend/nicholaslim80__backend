/*
  Warnings:

  - You are about to drop the column `current_apartment` on the `raider_registrations` table. All the data in the column will be lost.
  - You are about to drop the column `current_city` on the `raider_registrations` table. All the data in the column will be lost.
  - You are about to drop the column `current_state_province` on the `raider_registrations` table. All the data in the column will be lost.
  - You are about to drop the column `current_zip_post_code` on the `raider_registrations` table. All the data in the column will be lost.
  - You are about to drop the column `nid_back_images` on the `raider_registrations` table. All the data in the column will be lost.
  - You are about to drop the column `nid_front_images` on the `raider_registrations` table. All the data in the column will be lost.
  - You are about to drop the column `permanent_apartment` on the `raider_registrations` table. All the data in the column will be lost.
  - You are about to drop the column `permanent_city` on the `raider_registrations` table. All the data in the column will be lost.
  - You are about to drop the column `permanent_state_province` on the `raider_registrations` table. All the data in the column will be lost.
  - You are about to drop the column `permanent_zip_post_code` on the `raider_registrations` table. All the data in the column will be lost.
  - You are about to drop the column `vehicle_log_expire_date` on the `raider_registrations` table. All the data in the column will be lost.
  - You are about to drop the column `vehicle_log_issue_date` on the `raider_registrations` table. All the data in the column will be lost.
  - You are about to drop the column `vehicle_log_number` on the `raider_registrations` table. All the data in the column will be lost.
  - You are about to drop the column `vehicle_policy_expire_date` on the `raider_registrations` table. All the data in the column will be lost.
  - You are about to drop the column `vehicle_policy_images` on the `raider_registrations` table. All the data in the column will be lost.
  - You are about to drop the column `vehicle_policy_issue_date` on the `raider_registrations` table. All the data in the column will be lost.
  - You are about to drop the column `vehicle_policy_number` on the `raider_registrations` table. All the data in the column will be lost.
  - You are about to drop the column `vehicle_type` on the `raider_registrations` table. All the data in the column will be lost.
  - Added the required column `chassis_number` to the `raider_registrations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `current_postal_code` to the `raider_registrations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `identity_card_issue_date` to the `raider_registrations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `insurance_expiry_date` to the `raider_registrations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `insurance_issue_date` to the `raider_registrations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `insurance_policy_images` to the `raider_registrations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `insurance_policy_number` to the `raider_registrations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `license_class` to the `raider_registrations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nric_back_images` to the `raider_registrations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nric_front_images` to the `raider_registrations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `permanent_postal_code` to the `raider_registrations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vehicle_model` to the `raider_registrations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vehicle_type_id` to the `raider_registrations` table without a default value. This is not possible if the table is not empty.
  - Made the column `current_country` on table `raider_registrations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `permanent_country` on table `raider_registrations` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "LicenseClass" AS ENUM ('CLASS_2B', 'CLASS_2A', 'CLASS_2', 'CLASS_3', 'CLASS_3A', 'CLASS_4', 'CLASS_5');

-- AlterTable
ALTER TABLE "raider_registrations" DROP COLUMN "current_apartment",
DROP COLUMN "current_city",
DROP COLUMN "current_state_province",
DROP COLUMN "current_zip_post_code",
DROP COLUMN "nid_back_images",
DROP COLUMN "nid_front_images",
DROP COLUMN "permanent_apartment",
DROP COLUMN "permanent_city",
DROP COLUMN "permanent_state_province",
DROP COLUMN "permanent_zip_post_code",
DROP COLUMN "vehicle_log_expire_date",
DROP COLUMN "vehicle_log_issue_date",
DROP COLUMN "vehicle_log_number",
DROP COLUMN "vehicle_policy_expire_date",
DROP COLUMN "vehicle_policy_images",
DROP COLUMN "vehicle_policy_issue_date",
DROP COLUMN "vehicle_policy_number",
DROP COLUMN "vehicle_type",
ADD COLUMN     "chassis_number" TEXT NOT NULL,
ADD COLUMN     "current_postal_code" TEXT NOT NULL,
ADD COLUMN     "current_unit" TEXT,
ADD COLUMN     "identity_card_issue_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "insurance_expiry_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "insurance_issue_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "insurance_policy_images" TEXT NOT NULL,
ADD COLUMN     "insurance_policy_number" TEXT NOT NULL,
ADD COLUMN     "license_class" "LicenseClass" NOT NULL,
ADD COLUMN     "nric_back_images" TEXT NOT NULL,
ADD COLUMN     "nric_front_images" TEXT NOT NULL,
ADD COLUMN     "permanent_postal_code" TEXT NOT NULL,
ADD COLUMN     "permanent_unit" TEXT,
ADD COLUMN     "vehicle_model" TEXT NOT NULL,
ADD COLUMN     "vehicle_type_id" INTEGER NOT NULL,
ALTER COLUMN "current_country" SET NOT NULL,
ALTER COLUMN "current_country" SET DEFAULT 'Singapore',
ALTER COLUMN "permanent_country" SET NOT NULL,
ALTER COLUMN "permanent_country" SET DEFAULT 'Singapore',
ALTER COLUMN "bank_name" DROP NOT NULL,
ALTER COLUMN "account_number" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "raider_registrations" ADD CONSTRAINT "raider_registrations_vehicle_type_id_fkey" FOREIGN KEY ("vehicle_type_id") REFERENCES "vehicle_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
