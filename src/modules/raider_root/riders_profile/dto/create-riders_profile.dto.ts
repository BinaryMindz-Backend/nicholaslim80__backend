
import { ApiProperty } from '@nestjs/swagger';
import { Gender, VehicleTypeEnum } from '@prisma/client';
import { IsNotEmpty } from 'class-validator';

export class CreateRidersProfileDto {

  // --- Personal ---
  @ApiProperty({ example: "Shariar Rahman" })
  @IsNotEmpty()
  raider_name: string;

  @ApiProperty({ example: "01712345678" })
  @IsNotEmpty()
  contact_number: string;

  @ApiProperty({ example: "shariar@gmail.com" })
  @IsNotEmpty()
  email_address: string;

  @ApiProperty({ example: "2004-05-12T00:00:00.000Z" })
  @IsNotEmpty()
  dob: Date;

  @ApiProperty({ example: Gender.MALE })
  @IsNotEmpty()
  gender: Gender;

  @ApiProperty({ example: ["driver1.jpg", "driver2.jpg"] })
  @IsNotEmpty()
  driver_photos: string[];

  @ApiProperty({ example: "Abdul Karim" })
  @IsNotEmpty()
  emergency_contact_name: string;

  @ApiProperty({ example: "01812345678" })
  @IsNotEmpty()
  emergency_contact_number: string;

  // --- Identity ---
  @ApiProperty({ example: "1234567890" })
  @IsNotEmpty()
  identity_card_number: string;

  @ApiProperty({ example: "nid_front.jpg" })
  @IsNotEmpty()
  nid_front_images: string;

  @ApiProperty({ example: "nid_back.jpg" })
  @IsNotEmpty()
  nid_back_images: string;

  @ApiProperty({ example: "DL-589623" })
  @IsNotEmpty()
  driving_license_number: string;

  @ApiProperty({ example: "2020-01-10T00:00:00.000Z" })
  @IsNotEmpty()
  driving_license_issue_date: Date;

  @ApiProperty({ example: "2030-01-10T00:00:00.000Z" })
  @IsNotEmpty()
  driving_license_expire_date: Date;

  @ApiProperty({ example: "dl_front.jpg" })
  @IsNotEmpty()
  driving_license_front_images: string;

  @ApiProperty({ example: "dl_back.jpg" })
  @IsNotEmpty()
  driving_license_back_images: string;

  // --- Vehicle ---
  @ApiProperty({ example: "DHA-12345" })
  @IsNotEmpty()
  vehicle_plate_number: string;

  @ApiProperty({ example: VehicleTypeEnum.MOTORCYCLE })
  @IsNotEmpty()
  vehicle_type: VehicleTypeEnum;

  @ApiProperty({ example: "Honda" })
  @IsNotEmpty()
  vehicle_brand: string;

  @ApiProperty({ example: "2024-02-15T00:00:00.000Z" })
  @IsNotEmpty()
  registration_date: Date;

  @ApiProperty({ example: "vehicle_front.jpg" })
  @IsNotEmpty()
  vehicle_front_images: string;

  @ApiProperty({ example: "vehicle_back.jpg" })
  @IsNotEmpty()
  vehicle_back_images: string;

  @ApiProperty({ example: "vehicle_driver_side.jpg" })
  @IsNotEmpty()
  vehicle_driver_side_images: string;

  @ApiProperty({ example: "vehicle_passenger_side.jpg" })
  @IsNotEmpty()
  vehicle_passenger_side_images: string;

  // --- Log & Insurance ---
  @ApiProperty({ example: "LOG-872364" })
  @IsNotEmpty()
  vehicle_log_number: string;

  @ApiProperty({ example: "2023-05-01T00:00:00.000Z" })
  @IsNotEmpty()
  vehicle_log_issue_date: Date;

  @ApiProperty({ example: "2025-05-01T00:00:00.000Z" })
  @IsNotEmpty()
  vehicle_log_expire_date: Date;

  @ApiProperty({ example: "log.jpg" })
  @IsNotEmpty()
  vehicle_log_images: string;

  @ApiProperty({ example: "POLICY-21343" })
  @IsNotEmpty()
  vehicle_policy_number: string;

  @ApiProperty({ example: "2024-01-01T00:00:00.000Z" })
  @IsNotEmpty()
  vehicle_policy_issue_date: Date;

  @ApiProperty({ example: "2026-01-01T00:00:00.000Z" })
  @IsNotEmpty()
  vehicle_policy_expire_date: Date;

  @ApiProperty({ example: "policy.jpg" })
  @IsNotEmpty()
  vehicle_policy_images: string;

  // --- Current Address ---
  @ApiProperty({ example: "House 12, Road 5" })
  @IsNotEmpty()
  current_address: string;

  @ApiProperty({ example: "Apartment 4B" })
  @IsNotEmpty()
  current_apartment: string;

  @ApiProperty({ example: "Dhaka Division" })
  @IsNotEmpty()
  current_state_province: string;

  @ApiProperty({ example: "Dhaka" })
  @IsNotEmpty()
  current_city: string;

  @ApiProperty({ example: "Bangladesh" })
  @IsNotEmpty()
  current_country: string;

  @ApiProperty({ example: "1205" })
  @IsNotEmpty()
  current_zip_post_code: string;

  // --- Permanent Address ---
  @ApiProperty({ example: "Village Road 3" })
  @IsNotEmpty()
  permanent_address: string;

  @ApiProperty({ example: "N/A" })
  @IsNotEmpty()
  permanent_apartment: string;

  @ApiProperty({ example: "Rajshahi Division" })
  @IsNotEmpty()
  permanent_state_province: string;

  @ApiProperty({ example: "Rajshahi" })
  @IsNotEmpty()
  permanent_city: string;

  @ApiProperty({ example: "Bangladesh" })
  @IsNotEmpty()
  permanent_country: string;

  @ApiProperty({ example: "6201" })
  @IsNotEmpty()
  permanent_zip_post_code: string;

  // --- Bank ---
  @ApiProperty({ example: "Dutch-Bangla Bank" })
  @IsNotEmpty()
  bank_name: string;

  @ApiProperty({ example: "01123456789" })
  @IsNotEmpty()
  account_number: string;
}
