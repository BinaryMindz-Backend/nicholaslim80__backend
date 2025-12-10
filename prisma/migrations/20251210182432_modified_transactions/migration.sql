-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'SUPER_ADMIN', 'RAIDER');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('ADMIN', 'MODERATOR', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "NotificationSentRole" AS ENUM ('USER', 'RAIDER');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ORDER_UPDATE', 'PROMOTION', 'GENERAL', 'PUSH_NOTIFICATION', 'EMAIL', 'SMS', 'WEB_ANNOUNCEMENT');

-- CreateEnum
CREATE TYPE "RewardType" AS ENUM ('SHARE', 'COMPLETED', 'REFER', 'DAILY_LOGIN', 'FIRST_SIGNUP');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('COMPLETED', 'CANCELLED', 'PENDING', 'PROGRESS', 'ONGOING', 'SCHEDULED');

-- CreateEnum
CREATE TYPE "DestinationType" AS ENUM ('SENDER', 'RECEIVER');

-- CreateEnum
CREATE TYPE "RouteType" AS ENUM ('ONE_WAY', 'ROUND');

-- CreateEnum
CREATE TYPE "DeliveryQuality" AS ENUM ('EXCELLENT', 'GOOD', 'AVERAGE', 'POOR');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('ON_TIME', 'LATE', 'DAMAGED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PAID', 'PENDING', 'FAILED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('BOOK_ORDER', 'REFUND', 'ADD_FUND', 'WITHDRAW', 'PROMO');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "PayType" AS ENUM ('COD', 'WALLET', 'ONLINE_PAY');

-- CreateEnum
CREATE TYPE "RaiderVerification" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "VehicleTypeEnum" AS ENUM ('CAR', 'TRUCK', 'MOTORCYCLE', 'BUS', 'VAN', 'BICYCLE', 'SUV', 'TRACTOR', 'ELECTRIC_SCOOTER', 'OTHER');

-- CreateEnum
CREATE TYPE "DeliveryTypeName" AS ENUM ('STANDARD', 'EXPRESS', 'STACKED');

-- CreateEnum
CREATE TYPE "PermissionAction" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE');

-- CreateEnum
CREATE TYPE "IncentiveType" AS ENUM ('PERFORMANCE', 'TIME_BASED', 'REFERRAL');

-- CreateEnum
CREATE TYPE "IncentiveStatus" AS ENUM ('COMPLETED', 'ONGOING', 'ENDED');

-- CreateEnum
CREATE TYPE "CoinEvent" AS ENUM ('FIRST_SIGNUP', 'DAILY_LOGIN', 'SHARE_ON_SOCIAL', 'REFERRAL', 'COMPLETED20_ORDER');

-- CreateEnum
CREATE TYPE "CoinHistoryType" AS ENUM ('ACCUMULATION', 'APPLICATION');

-- CreateEnum
CREATE TYPE "QuesType" AS ENUM ('MULTIPLE', 'BOOLEAN');

-- CreateEnum
CREATE TYPE "QuesDeficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "QuesCategory" AS ENUM ('SAFETY_PROCUDURE', 'GENERAL', 'IQ');

-- CreateEnum
CREATE TYPE "ApplicableTyp" AS ENUM ('RAIDER', 'USER');

-- CreateEnum
CREATE TYPE "FeeAppliesType" AS ENUM ('ALL_ORDERS', 'ORDERLESS15', 'EXPRESS_ORDERS');

-- CreateEnum
CREATE TYPE "Condition" AS ENUM ('HIGH_DEMAND', 'VERY_HIGH_DEMAND', 'WEEKEND');

-- CreateEnum
CREATE TYPE "RaiderStatus" AS ENUM ('ACTIVE', 'IN_ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "LoginType" AS ENUM ('DIRECT_SIGNIN', 'ADMIN_SIGNIN');

-- CreateEnum
CREATE TYPE "ContentManagementType" AS ENUM ('TERMSANDCONDITION', 'PRIVANCYPOLICY', 'CANCELLATIONANDWAITINGPOLICY', 'FAQ', 'HELPARTICLES', 'ABOUTUS');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'PDF');

-- CreateTable
CREATE TABLE "admins" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "is_seed_admin" BOOLEAN NOT NULL DEFAULT true,
    "role" "AdminRole" NOT NULL DEFAULT 'SUPER_ADMIN',
    "role_id" INTEGER,
    "vehicle_type_id" INTEGER,
    "delivery_type_id" INTEGER,
    "first_name" TEXT,
    "last_name" TEXT,
    "email" TEXT,
    "phone_number" TEXT,
    "password" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coins" (
    "id" SERIAL NOT NULL,
    "event_triggered" "CoinEvent" NOT NULL,
    "coin_amount" DECIMAL(12,2),
    "expire_date" TIMESTAMP(3),
    "coin_value_in_cent" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coin_history" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "username" TEXT,
    "total_coin_acc" DECIMAL(12,2),
    "type" "CoinHistoryType" NOT NULL,
    "total_coin_apply" DECIMAL(12,2),
    "current_coin_balance" DECIMAL(12,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coin_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentManagement" (
    "id" SERIAL NOT NULL,
    "contenttype" "ContentManagementType" NOT NULL,
    "description" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL,
    "version" INTEGER,

    CONSTRAINT "ContentManagement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_types" (
    "id" SERIAL NOT NULL,
    "name" "DeliveryTypeName" NOT NULL,
    "percentage" DECIMAL(6,2),
    "pickup_duration" INTEGER,
    "delivery_duration" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "admin_id" INTEGER NOT NULL,

    CONSTRAINT "delivery_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "destinations" (
    "id" SERIAL NOT NULL,
    "address" VARCHAR(255),
    "floor_unit" VARCHAR(100),
    "contact_name" VARCHAR(100),
    "contact_number" VARCHAR(20),
    "note_to_driver" TEXT,
    "is_saved" BOOLEAN NOT NULL DEFAULT false,
    "type" "DestinationType",
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "accuracy" DOUBLE PRECISION,
    "user_id" INTEGER NOT NULL,
    "order_id" INTEGER,

    CONSTRAINT "destinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" SERIAL NOT NULL,
    "case_id" INTEGER NOT NULL,
    "username" TEXT,
    "issueType" TEXT,
    "issue_date" TIMESTAMP(3),
    "service_area_latitude" DECIMAL(10,7),
    "service_area_longitude" DECIMAL(10,7),
    "category" TEXT,
    "priority" TEXT,
    "notes" TEXT,
    "isRefund" BOOLEAN NOT NULL DEFAULT false,
    "total" DECIMAL(12,2),
    "evidence_attach" JSONB,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incentives" (
    "id" SERIAL NOT NULL,
    "adminId" INTEGER,
    "incentive_name" TEXT,
    "type" "IncentiveType" NOT NULL,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "incentive_amount" INTEGER DEFAULT 0,
    "status" "IncentiveStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incentives_pkey" PRIMARY KEY ("id")
);

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
CREATE TABLE "my_raiders" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "is_fav" BOOLEAN NOT NULL DEFAULT false,
    "find_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "my_raiders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(255),
    "message" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "send_immediately" BOOLEAN NOT NULL DEFAULT false,
    "schedule_to_send" TIMESTAMP(3),
    "target_role" "NotificationSentRole",
    "is_from_admin" BOOLEAN NOT NULL DEFAULT false,
    "mark_as_read_id" INTEGER[],

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "route_type" "RouteType" NOT NULL DEFAULT 'ONE_WAY',
    "delivery_type" "DeliveryTypeName" NOT NULL DEFAULT 'EXPRESS',
    "pay_type" "PayType" NOT NULL DEFAULT 'WALLET',
    "vehicle_type_id" INTEGER NOT NULL,
    "total_cost" DECIMAL(12,2) NOT NULL,
    "has_additional_services" BOOLEAN NOT NULL DEFAULT false,
    "is_promo_used" BOOLEAN NOT NULL DEFAULT false,
    "notify_favorite_raider" BOOLEAN NOT NULL DEFAULT false,
    "payment_method_id" INTEGER,
    "assign_rider_id" INTEGER,
    "raider_confirmation" BOOLEAN NOT NULL DEFAULT false,
    "is_reviewed" BOOLEAN NOT NULL DEFAULT false,
    "is_placed" BOOLEAN NOT NULL DEFAULT false,
    "is_pickup" BOOLEAN NOT NULL DEFAULT false,
    "order_status" "OrderStatus" NOT NULL DEFAULT 'PROGRESS',
    "is_out_for_delivery" BOOLEAN NOT NULL DEFAULT false,
    "pick_up_items" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_methods" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "card_number" VARCHAR(50),
    "expiry_date" TIMESTAMP(3),
    "cvv" VARCHAR(10),
    "card_name" VARCHAR(100),

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "places" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" VARCHAR(255),
    "location" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "places_pkey" PRIMARY KEY ("id")
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
    "time_range" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserDynamicSurge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Policy" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "desc" TEXT NOT NULL,
    "isPublist" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" SERIAL NOT NULL,
    "quizId" INTEGER NOT NULL,
    "quesType" "QuesType" NOT NULL,
    "quesCategory" "QuesCategory" NOT NULL,
    "quesDeficulty" "QuesDeficulty" NOT NULL,
    "question_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "options" (
    "id" SERIAL NOT NULL,
    "questionId" INTEGER NOT NULL,
    "option_text" VARCHAR(255) NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quizzes" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "QuizOption" JSONB,
    "description" TEXT,
    "category" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raiders" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "is_online" BOOLEAN NOT NULL DEFAULT false,
    "is_available" BOOLEAN NOT NULL DEFAULT false,
    "raider_status" "RaiderStatus" NOT NULL DEFAULT 'IN_ACTIVE',
    "LoginType" "LoginType" NOT NULL DEFAULT 'DIRECT_SIGNIN',
    "raider_verificationFromAdmin" "RaiderVerification" NOT NULL DEFAULT 'PENDING',
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    "suspendedDuration" TIMESTAMP(3),
    "suspensionReason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raiders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raider_locations" (
    "id" SERIAL NOT NULL,
    "raiderId" INTEGER NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "heading" DOUBLE PRECISION,
    "speed" DOUBLE PRECISION,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raider_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raider_location_history" (
    "id" SERIAL NOT NULL,
    "raiderId" INTEGER NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raider_location_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raider_quizzes" (
    "id" SERIAL NOT NULL,
    "raiderId" INTEGER NOT NULL,
    "quizId" INTEGER NOT NULL,
    "total_questions" INTEGER NOT NULL DEFAULT 0,
    "correct_answers" INTEGER NOT NULL DEFAULT 0,
    "score" INTEGER NOT NULL DEFAULT 0,
    "attempt_count" INTEGER NOT NULL DEFAULT 1,
    "completed_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raider_quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raider_answers" (
    "id" SERIAL NOT NULL,
    "raider_quiz_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,
    "selected_option_id" INTEGER,
    "is_correct" BOOLEAN NOT NULL,

    CONSTRAINT "raider_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raider_registrations" (
    "id" SERIAL NOT NULL,
    "raiderId" INTEGER NOT NULL,
    "raider_name" TEXT NOT NULL,
    "contact_number" TEXT NOT NULL,
    "email_address" TEXT NOT NULL,
    "dob" TIMESTAMP(3) NOT NULL,
    "gender" "Gender" NOT NULL,
    "driver_photos" TEXT[],
    "emergency_contact_name" TEXT NOT NULL,
    "emergency_contact_number" TEXT NOT NULL,
    "identity_card_number" TEXT NOT NULL,
    "nid_front_images" TEXT NOT NULL,
    "nid_back_images" TEXT NOT NULL,
    "driving_license_number" TEXT NOT NULL,
    "driving_license_issue_date" TIMESTAMP(3) NOT NULL,
    "driving_license_expire_date" TIMESTAMP(3) NOT NULL,
    "driving_license_front_images" TEXT NOT NULL,
    "driving_license_back_images" TEXT NOT NULL,
    "vehicle_plate_number" TEXT NOT NULL,
    "vehicle_type" "VehicleTypeEnum" NOT NULL,
    "vehicle_brand" TEXT NOT NULL,
    "registration_date" TIMESTAMP(3) NOT NULL,
    "vehicle_front_images" TEXT NOT NULL,
    "vehicle_back_images" TEXT NOT NULL,
    "vehicle_driver_side_images" TEXT NOT NULL,
    "vehicle_passenger_side_images" TEXT NOT NULL,
    "vehicle_log_number" TEXT NOT NULL,
    "vehicle_log_issue_date" TIMESTAMP(3) NOT NULL,
    "vehicle_log_expire_date" TIMESTAMP(3) NOT NULL,
    "vehicle_log_images" TEXT NOT NULL,
    "vehicle_policy_number" TEXT NOT NULL,
    "vehicle_policy_issue_date" TIMESTAMP(3) NOT NULL,
    "vehicle_policy_expire_date" TIMESTAMP(3) NOT NULL,
    "vehicle_policy_images" TEXT NOT NULL,
    "current_address" TEXT NOT NULL,
    "current_apartment" TEXT NOT NULL,
    "current_state_province" TEXT NOT NULL,
    "current_city" TEXT NOT NULL,
    "current_country" TEXT NOT NULL,
    "current_zip_post_code" TEXT NOT NULL,
    "permanent_address" TEXT NOT NULL,
    "permanent_apartment" TEXT NOT NULL,
    "permanent_state_province" TEXT NOT NULL,
    "permanent_city" TEXT NOT NULL,
    "permanent_country" TEXT NOT NULL,
    "permanent_zip_post_code" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "raider_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refers" (
    "id" SERIAL NOT NULL,
    "how_its_work" TEXT,
    "refer_code" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "raiderId" INTEGER,
    "delivery_quality" "DeliveryQuality" NOT NULL,
    "delivery_status" "DeliveryStatus" NOT NULL,
    "rating_star" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rewards" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "achieved_coins" INTEGER NOT NULL DEFAULT 0,
    "reward_type" "RewardType" NOT NULL,
    "coin_history_id" INTEGER,
    "redeemed_coin" DECIMAL(12,2),
    "valid_until" TIMESTAMP(3),
    "expired_coin" DECIMAL(12,2),
    "order_id" INTEGER,
    "refer_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" TEXT,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" SERIAL NOT NULL,
    "module" VARCHAR(100) NOT NULL,
    "action" "PermissionAction" NOT NULL,
    "description" TEXT,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" SERIAL NOT NULL,
    "roleId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tips" (
    "id" SERIAL NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "raiderId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "orderId" INTEGER,

    CONSTRAINT "tips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" SERIAL NOT NULL,
    "transaction_code" VARCHAR(100),
    "payment_status" "PaymentStatus" DEFAULT 'PENDING',
    "payment_method_id" INTEGER,
    "delivery_fee" DECIMAL(12,2),
    "additional_fee" DECIMAL(12,2),
    "total_fee" DECIMAL(12,2),
    "base_fee" DECIMAL(12,2),
    "redeemed_coin" DECIMAL(12,2),
    "type" "TransactionType" NOT NULL,
    "pay_type" TEXT,
    "tx_status" "TransactionStatus" DEFAULT 'PENDING',
    "userId" INTEGER,
    "orderId" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(50),
    "email" VARCHAR(200),
    "phone" VARCHAR(20) NOT NULL,
    "password" VARCHAR(255),
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "balance" INTEGER NOT NULL DEFAULT 0,
    "reward_points" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "refresh_token" VARCHAR(500),
    "is_acc_refered" BOOLEAN NOT NULL DEFAULT false,
    "referral_code" TEXT,
    "referral_link" TEXT,
    "regi_status" "LoginType" NOT NULL DEFAULT 'DIRECT_SIGNIN',
    "stripe_customer_id" VARCHAR(100),
    "stripe_payment_method_id" VARCHAR(100),
    "stripe_balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reset_pass" BOOLEAN NOT NULL DEFAULT false,
    "fcmToken" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_types" (
    "id" SERIAL NOT NULL,
    "vehicle_type" "VehicleTypeEnum" NOT NULL,
    "base_price" DECIMAL(12,2),
    "per_km_price" DECIMAL(12,2),
    "peak_pricing" BOOLEAN NOT NULL DEFAULT false,
    "dimension" TEXT,
    "max_load" DECIMAL(12,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "admin_id" INTEGER NOT NULL,

    CONSTRAINT "vehicle_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AdminToRole" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AdminToRole_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

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

-- CreateIndex
CREATE INDEX "orders_userId_idx" ON "orders"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "raiders_userId_key" ON "raiders"("userId");

-- CreateIndex
CREATE INDEX "raider_locations_raiderId_idx" ON "raider_locations"("raiderId");

-- CreateIndex
CREATE INDEX "raider_locations_latitude_longitude_idx" ON "raider_locations"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "raider_location_history_raiderId_idx" ON "raider_location_history"("raiderId");

-- CreateIndex
CREATE UNIQUE INDEX "raider_answers_question_id_key" ON "raider_answers"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "raider_answers_selected_option_id_key" ON "raider_answers"("selected_option_id");

-- CreateIndex
CREATE UNIQUE INDEX "raider_registrations_raiderId_key" ON "raider_registrations"("raiderId");

-- CreateIndex
CREATE INDEX "rewards_userId_idx" ON "rewards"("userId");

-- CreateIndex
CREATE INDEX "rewards_refer_id_idx" ON "rewards"("refer_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_roleId_permissionId_key" ON "role_permissions"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_referral_code_key" ON "users"("referral_code");

-- CreateIndex
CREATE UNIQUE INDEX "users_referral_link_key" ON "users"("referral_link");

-- CreateIndex
CREATE INDEX "_AdminToRole_B_index" ON "_AdminToRole"("B");

-- AddForeignKey
ALTER TABLE "admins" ADD CONSTRAINT "admins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coin_history" ADD CONSTRAINT "coin_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_types" ADD CONSTRAINT "delivery_types_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "destinations" ADD CONSTRAINT "destinations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "destinations" ADD CONSTRAINT "destinations_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incentives" ADD CONSTRAINT "incentives_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "my_raiders" ADD CONSTRAINT "my_raiders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_vehicle_type_id_fkey" FOREIGN KEY ("vehicle_type_id") REFERENCES "vehicle_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_assign_rider_id_fkey" FOREIGN KEY ("assign_rider_id") REFERENCES "raiders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "places" ADD CONSTRAINT "places_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "options" ADD CONSTRAINT "options_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raiders" ADD CONSTRAINT "raiders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raider_locations" ADD CONSTRAINT "raider_locations_raiderId_fkey" FOREIGN KEY ("raiderId") REFERENCES "raiders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raider_location_history" ADD CONSTRAINT "raider_location_history_raiderId_fkey" FOREIGN KEY ("raiderId") REFERENCES "raiders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raider_quizzes" ADD CONSTRAINT "raider_quizzes_raiderId_fkey" FOREIGN KEY ("raiderId") REFERENCES "raiders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raider_quizzes" ADD CONSTRAINT "raider_quizzes_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raider_answers" ADD CONSTRAINT "raider_answers_raider_quiz_id_fkey" FOREIGN KEY ("raider_quiz_id") REFERENCES "raider_quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raider_answers" ADD CONSTRAINT "raider_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raider_answers" ADD CONSTRAINT "raider_answers_selected_option_id_fkey" FOREIGN KEY ("selected_option_id") REFERENCES "options"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raider_registrations" ADD CONSTRAINT "raider_registrations_raiderId_fkey" FOREIGN KEY ("raiderId") REFERENCES "raiders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refers" ADD CONSTRAINT "refers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_raiderId_fkey" FOREIGN KEY ("raiderId") REFERENCES "raiders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_coin_history_id_fkey" FOREIGN KEY ("coin_history_id") REFERENCES "coin_history"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_refer_id_fkey" FOREIGN KEY ("refer_id") REFERENCES "refers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tips" ADD CONSTRAINT "tips_raiderId_fkey" FOREIGN KEY ("raiderId") REFERENCES "raiders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tips" ADD CONSTRAINT "tips_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tips" ADD CONSTRAINT "tips_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_types" ADD CONSTRAINT "vehicle_types_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AdminToRole" ADD CONSTRAINT "_AdminToRole_A_fkey" FOREIGN KEY ("A") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AdminToRole" ADD CONSTRAINT "_AdminToRole_B_fkey" FOREIGN KEY ("B") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
