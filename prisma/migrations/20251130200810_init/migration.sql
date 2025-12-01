-- CreateEnum
CREATE TYPE "ApplicableTyp" AS ENUM ('RAIDER', 'USER');

-- CreateEnum
CREATE TYPE "FeeAppliesType" AS ENUM ('ALL_ORDERS', 'ORDERLESS15', 'EXPRESS_ORDERS');

-- CreateEnum
CREATE TYPE "Condition" AS ENUM ('HIGH_DEMAND', 'VERY_HIGH_DEMAND', 'WEEKEND');

-- CreateTable
CREATE TABLE "StandardCommissionRate" (
    "id" SERIAL NOT NULL,
    "applicable_user" "ApplicableTyp" NOT NULL,
    "role_name" VARCHAR(100) NOT NULL,
    "commission_rate_delivery_fee" INTEGER NOT NULL DEFAULT 0,
    "service_area" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StandardCommissionRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaiderCompensationRole" (
    "id" SERIAL NOT NULL,
    "applicable_user" "ApplicableTyp" NOT NULL,
    "scenario" VARCHAR(100) NOT NULL,
    "commission_rate_delivery_fee" INTEGER NOT NULL DEFAULT 0,
    "service_area" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RaiderCompensationRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaiderDeductionFee" (
    "id" SERIAL NOT NULL,
    "applicable_user" "ApplicableTyp" NOT NULL,
    "deduction_name" VARCHAR(100) NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "service_area" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RaiderDeductionFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFeeStructure" (
    "id" SERIAL NOT NULL,
    "applicable_user" "ApplicableTyp" NOT NULL,
    "fee_name" VARCHAR(100) NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "service_area" VARCHAR(100) NOT NULL,
    "applies_to" "FeeAppliesType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserFeeStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDynamicSurge" (
    "id" SERIAL NOT NULL,
    "applicable_user" "ApplicableTyp" NOT NULL,
    "role_name" VARCHAR(100) NOT NULL,
    "price_multiplier" INTEGER NOT NULL DEFAULT 0,
    "condition" "Condition" NOT NULL,
    "time_range" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserDynamicSurge_pkey" PRIMARY KEY ("id")
);
