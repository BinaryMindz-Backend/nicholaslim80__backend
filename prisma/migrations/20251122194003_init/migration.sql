/*
  Warnings:

  - You are about to drop the column `raider_verification` on the `raider_registrations` table. All the data in the column will be lost.
  - The `driver_photos` column on the `raider_registrations` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Made the column `raider_name` on table `raider_registrations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `contact_number` on table `raider_registrations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `email_address` on table `raider_registrations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `dob` on table `raider_registrations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `gender` on table `raider_registrations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `emergency_contact_name` on table `raider_registrations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `emergency_contact_number` on table `raider_registrations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `identity_card_number` on table `raider_registrations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `nid_front_images` on table `raider_registrations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `nid_back_images` on table `raider_registrations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `driving_license_number` on table `raider_registrations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `driving_license_issue_date` on table `raider_registrations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `driving_license_expire_date` on table `raider_registrations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `driving_license_front_images` on table `raider_registrations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `driving_license_back_images` on table `raider_registrations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `vehicle_plate_number` on table `raider_registrations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `vehicle_type` on table `raider_registrations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `vehicle_brand` on table `raider_registrations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `registration_date` on table `raider_registrations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `vehicle_front_images` on table `raider_registrations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `vehicle_back_images` on table `raider_registrations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `vehicle_driver_side_images` on table `raider_registrations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `vehicle_passenger_side_images` on table `raider_registrations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `vehicle_log_number` on table `raider_registrations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `vehicle_log_issue_date` on table `raider_registrations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `vehicle_log_expire_date` on table `raider_registrations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `vehicle_log_images` on table `raider_registrations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `vehicle_policy_number` on table `raider_registrations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `vehicle_policy_issue_date` on table `raider_registrations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `vehicle_policy_expire_date` on table `raider_registrations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `vehicle_policy_images` on table `raider_registrations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `current_address` on table `raider_registrations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `current_apartment` on table `raider_registrations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `current_state_province` on table `raider_registrations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `current_city` on table `raider_registrations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `current_country` on table `raider_registrations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `current_zip_post_code` on table `raider_registrations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `permanent_address` on table `raider_registrations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `permanent_apartment` on table `raider_registrations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `permanent_state_province` on table `raider_registrations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `permanent_city` on table `raider_registrations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `permanent_country` on table `raider_registrations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `permanent_zip_post_code` on table `raider_registrations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `bank_name` on table `raider_registrations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `account_number` on table `raider_registrations` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "raider_registrations" DROP COLUMN "raider_verification",
ADD COLUMN     "raider_verificationFromAdmin" "RaiderVerification" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "raider_name" SET NOT NULL,
ALTER COLUMN "contact_number" SET NOT NULL,
ALTER COLUMN "email_address" SET NOT NULL,
ALTER COLUMN "dob" SET NOT NULL,
ALTER COLUMN "gender" SET NOT NULL,
DROP COLUMN "driver_photos",
ADD COLUMN     "driver_photos" TEXT[],
ALTER COLUMN "emergency_contact_name" SET NOT NULL,
ALTER COLUMN "emergency_contact_number" SET NOT NULL,
ALTER COLUMN "identity_card_number" SET NOT NULL,
ALTER COLUMN "nid_front_images" SET NOT NULL,
ALTER COLUMN "nid_front_images" SET DATA TYPE TEXT,
ALTER COLUMN "nid_back_images" SET NOT NULL,
ALTER COLUMN "nid_back_images" SET DATA TYPE TEXT,
ALTER COLUMN "driving_license_number" SET NOT NULL,
ALTER COLUMN "driving_license_issue_date" SET NOT NULL,
ALTER COLUMN "driving_license_expire_date" SET NOT NULL,
ALTER COLUMN "driving_license_front_images" SET NOT NULL,
ALTER COLUMN "driving_license_front_images" SET DATA TYPE TEXT,
ALTER COLUMN "driving_license_back_images" SET NOT NULL,
ALTER COLUMN "driving_license_back_images" SET DATA TYPE TEXT,
ALTER COLUMN "vehicle_plate_number" SET NOT NULL,
ALTER COLUMN "vehicle_type" SET NOT NULL,
ALTER COLUMN "vehicle_brand" SET NOT NULL,
ALTER COLUMN "registration_date" SET NOT NULL,
ALTER COLUMN "vehicle_front_images" SET NOT NULL,
ALTER COLUMN "vehicle_front_images" SET DATA TYPE TEXT,
ALTER COLUMN "vehicle_back_images" SET NOT NULL,
ALTER COLUMN "vehicle_back_images" SET DATA TYPE TEXT,
ALTER COLUMN "vehicle_driver_side_images" SET NOT NULL,
ALTER COLUMN "vehicle_driver_side_images" SET DATA TYPE TEXT,
ALTER COLUMN "vehicle_passenger_side_images" SET NOT NULL,
ALTER COLUMN "vehicle_passenger_side_images" SET DATA TYPE TEXT,
ALTER COLUMN "vehicle_log_number" SET NOT NULL,
ALTER COLUMN "vehicle_log_issue_date" SET NOT NULL,
ALTER COLUMN "vehicle_log_expire_date" SET NOT NULL,
ALTER COLUMN "vehicle_log_images" SET NOT NULL,
ALTER COLUMN "vehicle_log_images" SET DATA TYPE TEXT,
ALTER COLUMN "vehicle_policy_number" SET NOT NULL,
ALTER COLUMN "vehicle_policy_issue_date" SET NOT NULL,
ALTER COLUMN "vehicle_policy_expire_date" SET NOT NULL,
ALTER COLUMN "vehicle_policy_images" SET NOT NULL,
ALTER COLUMN "vehicle_policy_images" SET DATA TYPE TEXT,
ALTER COLUMN "current_address" SET NOT NULL,
ALTER COLUMN "current_apartment" SET NOT NULL,
ALTER COLUMN "current_state_province" SET NOT NULL,
ALTER COLUMN "current_city" SET NOT NULL,
ALTER COLUMN "current_country" SET NOT NULL,
ALTER COLUMN "current_zip_post_code" SET NOT NULL,
ALTER COLUMN "permanent_address" SET NOT NULL,
ALTER COLUMN "permanent_apartment" SET NOT NULL,
ALTER COLUMN "permanent_state_province" SET NOT NULL,
ALTER COLUMN "permanent_city" SET NOT NULL,
ALTER COLUMN "permanent_country" SET NOT NULL,
ALTER COLUMN "permanent_zip_post_code" SET NOT NULL,
ALTER COLUMN "bank_name" SET NOT NULL,
ALTER COLUMN "account_number" SET NOT NULL;

-- AlterTable
ALTER TABLE "raiders" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
