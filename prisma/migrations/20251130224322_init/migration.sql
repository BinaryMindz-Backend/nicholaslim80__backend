/*
  Warnings:

  - You are about to alter the column `score` on the `raider_quizzes` table. The data in that column could be lost. The data in that column will be cast from `Decimal(6,2)` to `Integer`.
  - Made the column `score` on table `raider_quizzes` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "ApplicableTyp" AS ENUM ('RAIDER', 'USER');

-- CreateEnum
CREATE TYPE "FeeAppliesType" AS ENUM ('ALL_ORDERS', 'ORDERLESS15', 'EXPRESS_ORDERS');

-- CreateEnum
CREATE TYPE "Condition" AS ENUM ('HIGH_DEMAND', 'VERY_HIGH_DEMAND', 'WEEKEND');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'PDF');

-- AlterTable
ALTER TABLE "raider_quizzes" ADD COLUMN     "attempt_count" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "total_questions" SET DEFAULT 0,
ALTER COLUMN "correct_answers" SET DEFAULT 0,
ALTER COLUMN "score" SET NOT NULL,
ALTER COLUMN "score" SET DEFAULT 0,
ALTER COLUMN "score" SET DATA TYPE INTEGER;

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "user1Id" INTEGER NOT NULL,
    "user2Id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "content" TEXT,
    "messageType" "MessageType" NOT NULL DEFAULT 'TEXT',
    "fileUrl" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

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

-- CreateIndex
CREATE INDEX "Conversation_user1Id_idx" ON "Conversation"("user1Id");

-- CreateIndex
CREATE INDEX "Conversation_user2Id_idx" ON "Conversation"("user2Id");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_user1Id_user2Id_key" ON "Conversation"("user1Id", "user2Id");

-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- CreateIndex
CREATE INDEX "Message_receiverId_idx" ON "Message"("receiverId");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_user1Id_fkey" FOREIGN KEY ("user1Id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_user2Id_fkey" FOREIGN KEY ("user2Id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
