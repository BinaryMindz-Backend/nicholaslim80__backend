
import { ApiProperty } from '@nestjs/swagger';
import { Gender, VehicleTypeEnum, RaiderVerification } from '@prisma/client';

export class CreateRidersProfileDto {
  // --- Raider Info ---
  @ApiProperty({ example: 12 })
  raiderId: number;

  @ApiProperty({ example: RaiderVerification.PENDING })
  raider_verificationFromAdmin: RaiderVerification;

  // --- Personal ---
  @ApiProperty({ example: "Shariar Rahman" })
  raider_name: string;

  @ApiProperty({ example: "01712345678" })
  contact_number: string;

  @ApiProperty({ example: "shariar@gmail.com" })
  email_address: string;

  @ApiProperty({ example: "2004-05-12T00:00:00.000Z" })
  dob: Date;

  @ApiProperty({ example: Gender.MALE })
  gender: Gender;

  @ApiProperty({ example: ["driver1.jpg", "driver2.jpg"] })
  driver_photos: string[];

  @ApiProperty({ example: "Abdul Karim" })
  emergency_contact_name: string;

  @ApiProperty({ example: "01812345678" })
  emergency_contact_number: string;

  // --- Identity ---
  @ApiProperty({ example: "1234567890" })
  identity_card_number: string;

  @ApiProperty({ example: "nid_front.jpg" })
  nid_front_images: string;

  @ApiProperty({ example: "nid_back.jpg" })
  nid_back_images: string;

  @ApiProperty({ example: "DL-589623" })
  driving_license_number: string;

  @ApiProperty({ example: "2020-01-10T00:00:00.000Z" })
  driving_license_issue_date: Date;

  @ApiProperty({ example: "2030-01-10T00:00:00.000Z" })
  driving_license_expire_date: Date;

  @ApiProperty({ example: "dl_front.jpg" })
  driving_license_front_images: string;

  @ApiProperty({ example: "dl_back.jpg" })
  driving_license_back_images: string;

  // --- Vehicle ---
  @ApiProperty({ example: "DHA-12345" })
  vehicle_plate_number: string;

  @ApiProperty({ example: VehicleTypeEnum.MOTORCYCLE })
  vehicle_type: VehicleTypeEnum;

  @ApiProperty({ example: "Honda" })
  vehicle_brand: string;

  @ApiProperty({ example: "2024-02-15T00:00:00.000Z" })
  registration_date: Date;

  @ApiProperty({ example: "vehicle_front.jpg" })
  vehicle_front_images: string;

  @ApiProperty({ example: "vehicle_back.jpg" })
  vehicle_back_images: string;

  @ApiProperty({ example: "vehicle_driver_side.jpg" })
  vehicle_driver_side_images: string;

  @ApiProperty({ example: "vehicle_passenger_side.jpg" })
  vehicle_passenger_side_images: string;

  // --- Log & Insurance ---
  @ApiProperty({ example: "LOG-872364" })
  vehicle_log_number: string;

  @ApiProperty({ example: "2023-05-01T00:00:00.000Z" })
  vehicle_log_issue_date: Date;

  @ApiProperty({ example: "2025-05-01T00:00:00.000Z" })
  vehicle_log_expire_date: Date;

  @ApiProperty({ example: "log.jpg" })
  vehicle_log_images: string;

  @ApiProperty({ example: "POLICY-21343" })
  vehicle_policy_number: string;

  @ApiProperty({ example: "2024-01-01T00:00:00.000Z" })
  vehicle_policy_issue_date: Date;

  @ApiProperty({ example: "2026-01-01T00:00:00.000Z" })
  vehicle_policy_expire_date: Date;

  @ApiProperty({ example: "policy.jpg" })
  vehicle_policy_images: string;

  // --- Current Address ---
  @ApiProperty({ example: "House 12, Road 5" })
  current_address: string;

  @ApiProperty({ example: "Apartment 4B" })
  current_apartment: string;

  @ApiProperty({ example: "Dhaka Division" })
  current_state_province: string;

  @ApiProperty({ example: "Dhaka" })
  current_city: string;

  @ApiProperty({ example: "Bangladesh" })
  current_country: string;

  @ApiProperty({ example: "1205" })
  current_zip_post_code: string;

  // --- Permanent Address ---
  @ApiProperty({ example: "Village Road 3" })
  permanent_address: string;

  @ApiProperty({ example: "N/A" })
  permanent_apartment: string;

  @ApiProperty({ example: "Rajshahi Division" })
  permanent_state_province: string;

  @ApiProperty({ example: "Rajshahi" })
  permanent_city: string;

  @ApiProperty({ example: "Bangladesh" })
  permanent_country: string;

  @ApiProperty({ example: "6201" })
  permanent_zip_post_code: string;

  // --- Bank ---
  @ApiProperty({ example: "Dutch-Bangla Bank" })
  bank_name: string;

  @ApiProperty({ example: "01123456789" })
  account_number: string;
}
