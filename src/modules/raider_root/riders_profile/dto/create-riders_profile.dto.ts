import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsDateString,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Gender, LicenseClass } from '@prisma/client';


export class CreateRiderRegistrationDto {

  // ---------------- PERSONAL ----------------
  @ApiProperty({ example: "Shariar Rahman" })
  @IsString()
  @IsNotEmpty()
  raider_name: string;

  @ApiProperty({ example: "01712345678" })
  @IsString()
  @IsNotEmpty()
  contact_number: string;

  @ApiProperty({ example: "shariar@gmail.com" })
  @IsString()
  @IsNotEmpty()
  email_address: string;

  @ApiProperty({ example: "2004-05-12T00:00:00.000Z" })
  @IsDateString()
  dob: Date;

  @ApiProperty({ enum: Gender, example: Gender.MALE })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ example: ["driver1.jpg", "driver2.jpg"] })
  @IsArray()
  driver_photos: string[];

  @ApiProperty({ example: "Abdul Karim" })
  @IsString()
  emergency_contact_name: string;

  @ApiProperty({ example: "01812345678" })
  @IsString()
  emergency_contact_number: string;

  // ---------------- IDENTITY ----------------
  @ApiProperty({ example: "S1234567A" })
  @IsString()
  identity_card_number: string;

  @ApiProperty({ example: "2020-01-01T00:00:00.000Z" })
  @IsDateString()
  identity_card_issue_date: Date;

  @ApiProperty({ example: "nric_front.jpg" })
  @IsString()
  nric_front_images: string;

  @ApiProperty({ example: "nric_back.jpg" })
  @IsString()
  nric_back_images: string;

  // ---------------- DRIVING LICENSE ----------------
  @ApiProperty({ example: "DL-589623" })
  @IsString()
  driving_license_number: string;

  @ApiProperty({ example: "2020-01-10T00:00:00.000Z" })
  @IsDateString()
  driving_license_issue_date: Date;

  @ApiProperty({ example: "2030-01-10T00:00:00.000Z" })
  @IsDateString()
  driving_license_expire_date: Date;

  @ApiProperty({ enum: LicenseClass, example: LicenseClass.CLASS_3 })
  @IsEnum(LicenseClass)
  license_class: LicenseClass;

  @ApiProperty({ example: "dl_front.jpg" })
  @IsString()
  driving_license_front_images: string;

  @ApiProperty({ example: "dl_back.jpg" })
  @IsString()
  driving_license_back_images: string;

  // ---------------- VEHICLE ----------------
  @ApiProperty({ example: "DHA-12345" })
  @IsString()
  vehicle_plate_number: string;

  @ApiProperty({ example: 1, description: "Vehicle Type ID from admin" })
  @Type(() => Number)
  @IsNumber()
  vehicle_type_id: number;

  @ApiProperty({ example: "Honda" })
  @IsString()
  vehicle_brand: string;

  @ApiProperty({ example: "Civic 2022" })
  @IsString()
  vehicle_model: string;

  @ApiProperty({ example: "2024-02-15T00:00:00.000Z" })
  @IsDateString()
  registration_date: Date;

  @ApiProperty({ example: "vehicle_front.jpg" })
  @IsString()
  vehicle_front_images: string;

  @ApiProperty({ example: "vehicle_back.jpg" })
  @IsString()
  vehicle_back_images: string;

  @ApiProperty({ example: "driver_side.jpg" })
  @IsString()
  vehicle_driver_side_images: string;

  @ApiProperty({ example: "passenger_side.jpg" })
  @IsString()
  vehicle_passenger_side_images: string;

  // ---------------- LOG ----------------
  @ApiProperty({ example: "CHS-123456789" })
  @IsString()
  chassis_number: string;

  @ApiProperty({ example: "log_card.jpg" })
  @IsString()
  vehicle_log_images: string;

  // ---------------- INSURANCE ----------------
  @ApiProperty({ example: "POLICY-12345" })
  @IsString()
  insurance_policy_number: string;

  @ApiProperty({ example: "2024-01-01T00:00:00.000Z" })
  @IsDateString()
  insurance_issue_date: Date;

  @ApiProperty({ example: "2026-01-01T00:00:00.000Z" })
  @IsDateString()
  insurance_expiry_date: Date;

  @ApiProperty({ example: "insurance.jpg" })
  @IsString()
  insurance_policy_images: string;

  // ---------------- CURRENT ADDRESS ----------------
  @ApiProperty({ example: "1205" })
  @IsString()
  current_postal_code: string;

  @ApiProperty({ example: "Block 123, Street 45" })
  @IsString()
  current_address: string;

  @ApiPropertyOptional({ example: "Unit 12-05" })
  @IsOptional()
  @IsString()
  current_unit?: string;

  @ApiPropertyOptional({ example: "Singapore", default: "Singapore" })
  @IsOptional()
  @IsString()
  current_country?: string = 'Singapore';

  // ---------------- PERMANENT ADDRESS ----------------
  @ApiProperty({ example: "6201" })
  @IsString()
  permanent_postal_code: string;

  @ApiProperty({ example: "Permanent Address" })
  @IsString()
  permanent_address: string;

  @ApiPropertyOptional({ example: "Unit 5A" })
  @IsOptional()
  @IsString()
  permanent_unit?: string;

  @ApiPropertyOptional({ example: "Singapore", default: "Singapore" })
  @IsOptional()
  @IsString()
  permanent_country?: string = 'Singapore';

  // ---------------- BANK ----------------
  @ApiPropertyOptional({ example: "DBS Bank" })
  @IsOptional()
  @IsString()
  bank_name?: string;

  @ApiPropertyOptional({ example: "1234567890" })
  @IsOptional()
  @IsString()
  account_number?: string;

  @ApiPropertyOptional({ example: "1234567890" })
  @IsOptional()
  @IsString()
  password?: string;
}