-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'SUPER_ADMIN', 'RAIDER', 'ADMIN');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('ADMIN', 'MODERATOR', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "Rank" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'PREMIUM');

-- CreateEnum
CREATE TYPE "NotificationSentRole" AS ENUM ('USER', 'RAIDER');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ORDER_UPDATE', 'PROMOTION', 'GENERAL', 'PUSH_NOTIFICATION', 'EMAIL', 'SMS', 'WEB_ANNOUNCEMENT');

-- CreateEnum
CREATE TYPE "RewardType" AS ENUM ('SHARE', 'COMPLETED', 'REFER', 'DAILY_LOGIN', 'FIRST_SIGNUP');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('COMPLETED', 'CANCELLED', 'PENDING', 'PROGRESS', 'ONGOING', 'FAILED', 'DISPUTE');

-- CreateEnum
CREATE TYPE "DestinationType" AS ENUM ('SENDER', 'RECEIVER');

-- CreateEnum
CREATE TYPE "RouteType" AS ENUM ('ONE_WAY', 'ROUND');

-- CreateEnum
CREATE TYPE "CollectTime" AS ENUM ('ASAP', 'SCHEDULED');

-- CreateEnum
CREATE TYPE "DeliveryQuality" AS ENUM ('EXCELLENT', 'GOOD', 'AVERAGE', 'POOR');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('ON_TIME', 'LATE', 'DAMAGED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PAID', 'PENDING', 'FAILED');

-- CreateEnum
CREATE TYPE "StopType" AS ENUM ('PICKUP', 'DROP');

-- CreateEnum
CREATE TYPE "StopStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('BOOK_ORDER', 'REFUND', 'ADD_FUND', 'WITHDRAW', 'PROMO', 'DISPUTE_REFUND', 'DISPUTE_COMPENSATION', 'TIP');

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
CREATE TYPE "DeliveryTypeName" AS ENUM ('STANDARD', 'EXPRESS', 'STACKED', 'SCHEDULED');

-- CreateEnum
CREATE TYPE "PermissionAction" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE');

-- CreateEnum
CREATE TYPE "IncentiveType" AS ENUM ('PERFORMANCE', 'TIME_BASED', 'REFERRAL');

-- CreateEnum
CREATE TYPE "IncentiveStatus" AS ENUM ('COMPLETED', 'ONGOING', 'ENDED');

-- CreateEnum
CREATE TYPE "CoinEvent" AS ENUM ('FIRST_SIGNUP', 'DAILY_LOGIN', 'SHARE_ON_SOCIAL', 'REFERRAL', 'COMPLETED_ORDER');

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
CREATE TYPE "FeeAppliesType" AS ENUM ('ALL_ORDERS', 'ORDER_LESS', 'EXPRESS_ORDERS', 'SCHEDULED_ORDERS', 'STACKED_ORDERS', 'STANDARD_ORDERS');

-- CreateEnum
CREATE TYPE "Condition" AS ENUM ('HIGH_DEMAND', 'VERY_HIGH_DEMAND', 'WEEKEND');

-- CreateEnum
CREATE TYPE "RaiderStatus" AS ENUM ('ACTIVE', 'IN_ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "LoginType" AS ENUM ('DIRECT_SIGNIN', 'ADMIN_SIGNIN');

-- CreateEnum
CREATE TYPE "ContentManagementType" AS ENUM ('TERMSANDCONDITION', 'PRIVANCYPOLICY', 'CANCELLATIONANDWAITINGPOLICY', 'FAQ', 'HELPARTICLES', 'ABOUTUS');

-- CreateEnum
CREATE TYPE "Advertisementfor" AS ENUM ('USER', 'RAIDER');

-- CreateEnum
CREATE TYPE "OrderConfirmationRatioType" AS ENUM ('GENIUNE', 'MANUAL_CHECK', 'SUSPICIOUS');

-- CreateEnum
CREATE TYPE "WalletTransactionType" AS ENUM ('PAYOUT', 'PAYMENT', 'REFUND', 'DEDUCTION', 'EARNING');

-- CreateEnum
CREATE TYPE "WalletTransactionStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('PAYMENT', 'ADD_MONEY');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'AWAITING_INFO', 'RESOLVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DisputeCreatedBy" AS ENUM ('USER', 'RIDER');

-- CreateEnum
CREATE TYPE "DisputeIssueType" AS ENUM ('CUSTOMER_UNREACHABLE', 'WAITING_CHARGE', 'PICKUP_LOCATION_INCORRECT', 'DROPOFF_LOCATION_INCORRECT', 'SAFETY_ACCESS_ISSUE', 'ORDER_NOT_RECEIVED', 'WRONG_ITEM', 'DAMAGED_ITEM', 'PARTIAL_DELIVERY', 'MISDELIVERED', 'PAYMENT_DISPUTE', 'CUSTOMER_BEHAVIOR', 'CHARGED_AFTER_CANCEL');

-- CreateEnum
CREATE TYPE "DisputePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "FeeLogType" AS ENUM ('STANDARD_COMMISSION_RATE', 'RAIDER_COMPENSATION_ROLE', 'RAIDER_DEDUCTION_FEE', 'USER_FEE_STRUCTURE', 'USER_DYNAMIC_SURGE');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'PDF');

-- CreateTable
CREATE TABLE "AboutUs" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "faq_for" "UserRole" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AboutUs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdditionalServices" (
    "id" SERIAL NOT NULL,
    "service_name" TEXT NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "desc" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "DashboardPopup" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "desc" TEXT NOT NULL,
    "redirect_link" TEXT NOT NULL,
    "image_link" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "admins" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "is_seed_admin" BOOLEAN NOT NULL DEFAULT true,
    "role_id" INTEGER,
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
CREATE TABLE "Advertise" (
    "id" SERIAL NOT NULL,
    "create_for" TEXT NOT NULL,
    "ad_title" TEXT NOT NULL,
    "ad_image" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT false,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "redirect_link" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Advertise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdvertiseAnalytics" (
    "id" SERIAL NOT NULL,
    "advertiseId" INTEGER NOT NULL,
    "impression" INTEGER NOT NULL DEFAULT 0,
    "click" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdvertiseAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advertise_logs" (
    "id" SERIAL NOT NULL,
    "advertiseId" INTEGER NOT NULL,
    "createFor" TEXT NOT NULL,
    "adTitle" TEXT NOT NULL,
    "adImage" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "changedByRole" TEXT NOT NULL,
    "changedByUserId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "advertise_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "faq_for" "UserRole" NOT NULL DEFAULT 'USER',
    "content" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coin_logs" (
    "id" SERIAL NOT NULL,
    "coinId" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "coinAmount" INTEGER NOT NULL,
    "condition" JSONB,
    "expireDays" INTEGER,
    "coinValueInCent" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL,
    "changedByRole" TEXT NOT NULL,
    "changedByUserId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coin_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coins" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "coin_amount" INTEGER NOT NULL,
    "condition" JSONB,
    "expire_days" INTEGER,
    "coin_value_in_cent" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coin_acc_history" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "role_triggered" TEXT NOT NULL,
    "coin_amount" INTEGER NOT NULL,
    "edited_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coin_acc_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coin_history" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "role_triggered" TEXT,
    "coin_acc_amount" INTEGER NOT NULL,
    "edited_by" TEXT,
    "type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coin_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collected_incentives" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "incentiveId" INTEGER,
    "amount" INTEGER DEFAULT 0,
    "is_collected" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collected_incentives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_management_logs" (
    "id" SERIAL NOT NULL,
    "contentId" INTEGER NOT NULL,
    "contentType" "ContentManagementType" NOT NULL,
    "faqFor" "UserRole" NOT NULL,
    "description" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL,
    "version" INTEGER,
    "changedByRole" TEXT NOT NULL,
    "changedByUserId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_management_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentManagement" (
    "id" SERIAL NOT NULL,
    "contenttype" "ContentManagementType" NOT NULL,
    "faq_for" "UserRole" NOT NULL DEFAULT 'USER',
    "description" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL,
    "version" INTEGER,

    CONSTRAINT "ContentManagement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerOrderConfirmationLog" (
    "id" SERIAL NOT NULL,
    "customerOrderConfirmationId" INTEGER NOT NULL,
    "isNewCustomerWeight" INTEGER NOT NULL,
    "completedOrdersWeight" INTEGER NOT NULL,
    "followersWeight" INTEGER NOT NULL,
    "changedByRole" TEXT NOT NULL,
    "changedByUserId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerOrderConfirmationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer_order_confirmation" (
    "id" SERIAL NOT NULL,
    "is_new_customer_weight" INTEGER NOT NULL DEFAULT 0,
    "completed_orders_weight" INTEGER NOT NULL DEFAULT 0,
    "followers_weight" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_order_confirmation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer_order_confirmation_ratio_logs" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER,
    "raider_id" INTEGER,
    "confirmation_ratio_type" "OrderConfirmationRatioType" NOT NULL,
    "is_auto_confirm" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_order_confirmation_ratio_logs_pkey" PRIMARY KEY ("id")
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
    "address" TEXT,
    "addressFromApr" TEXT,
    "postal_code" TEXT,
    "floor_unit" VARCHAR(100),
    "contact_name" VARCHAR(100),
    "contact_number" VARCHAR(20),
    "note_to_driver" TEXT,
    "is_saved" BOOLEAN NOT NULL DEFAULT false,
    "type" "DestinationType",
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "additionalInfo" TEXT,
    "userId" INTEGER NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "service_zoneId" INTEGER,

    CONSTRAINT "destinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER,
    "createdByType" "DisputeCreatedBy" NOT NULL,
    "createdById" INTEGER NOT NULL,
    "issueType" "DisputeIssueType" NOT NULL,
    "description" TEXT,
    "priority" "DisputePriority" NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'PENDING',
    "evidence" TEXT[],
    "refundType" TEXT,
    "refundAmount" DECIMAL(12,2),
    "companyPercent" INTEGER,
    "riderPercent" INTEGER,
    "resolvedByAdminId" INTEGER,
    "resolvedAt" TIMESTAMP(3),
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Driver_order_competition" (
    "id" SERIAL NOT NULL,
    "rank_weight" INTEGER NOT NULL DEFAULT 0,
    "rating_weight" INTEGER NOT NULL DEFAULT 0,
    "followers_weight" INTEGER NOT NULL DEFAULT 0,
    "total_weights" INTEGER NOT NULL DEFAULT 0,
    "challenges_timeout" INTEGER NOT NULL DEFAULT 0,
    "max_users_to_join" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Driver_order_competition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Driver_order_competition_change_logs" (
    "id" SERIAL NOT NULL,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "rating" INTEGER NOT NULL DEFAULT 0,
    "followers_weight" INTEGER NOT NULL DEFAULT 0,
    "challenges_timeout" INTEGER NOT NULL DEFAULT 0,
    "max_users_to_join" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER NOT NULL,

    CONSTRAINT "Driver_order_competition_change_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FAQ" (
    "id" SERIAL NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "faq_for" "UserRole" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FAQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incentive_logs" (
    "id" SERIAL NOT NULL,
    "incentiveId" INTEGER NOT NULL,
    "incentiveName" TEXT,
    "type" "IncentiveType" NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "incentiveAmount" INTEGER,
    "status" "IncentiveStatus" NOT NULL,
    "changedByRole" TEXT NOT NULL,
    "changedByAdminId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incentive_logs_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "UserLogin" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "loginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT,
    "device" TEXT,

    CONSTRAINT "UserLogin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "user1Id" INTEGER NOT NULL,
    "user2Id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "orderId" TEXT,

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
    "raiderId" INTEGER NOT NULL,
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
    "orderId" INTEGER,
    "mark_as_read_id" INTEGER[],

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" SERIAL NOT NULL,
    "serviceZoneId" INTEGER,
    "userId" INTEGER,
    "route_type" "RouteType" NOT NULL DEFAULT 'ONE_WAY',
    "delivery_type" "DeliveryTypeName" NOT NULL DEFAULT 'EXPRESS',
    "pay_type" "PayType" NOT NULL DEFAULT 'WALLET',
    "collect_time" "CollectTime" NOT NULL DEFAULT 'ASAP',
    "scheduled_time" TIMESTAMP(3),
    "vehicle_type_id" INTEGER,
    "useCoins" BOOLEAN NOT NULL DEFAULT false,
    "originalCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "coinsRedeemed" INTEGER NOT NULL DEFAULT 0,
    "promoCode" TEXT,
    "promoDiscount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_cost" DECIMAL(12,2) NOT NULL,
    "total_fee" DECIMAL(12,2),
    "additional_cost" DECIMAL(12,2),
    "commission" DECIMAL(12,2),
    "refund_amount" DECIMAL(12,2),
    "has_additional_services" BOOLEAN NOT NULL DEFAULT false,
    "notify_favorite_raider" BOOLEAN NOT NULL DEFAULT false,
    "payment_method_id" INTEGER,
    "compititor_id" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "competition_started_at" TIMESTAMP(3),
    "competition_closed" BOOLEAN NOT NULL DEFAULT false,
    "assign_rider_id" INTEGER,
    "isPriorited" BOOLEAN NOT NULL DEFAULT false,
    "priorityAt" TIMESTAMP(3),
    "raider_confirmation" BOOLEAN NOT NULL DEFAULT false,
    "is_auto_confirmation" BOOLEAN NOT NULL DEFAULT false,
    "is_reviewed" BOOLEAN NOT NULL DEFAULT false,
    "is_placed" BOOLEAN NOT NULL DEFAULT false,
    "is_pickup" BOOLEAN NOT NULL DEFAULT false,
    "order_status" "OrderStatus" NOT NULL DEFAULT 'PROGRESS',
    "is_out_for_delivery" BOOLEAN NOT NULL DEFAULT false,
    "isFixed" BOOLEAN NOT NULL DEFAULT true,
    "isDispute" BOOLEAN NOT NULL DEFAULT false,
    "isBulk" BOOLEAN NOT NULL DEFAULT false,
    "total_distance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "pick_up_items" TEXT[],
    "additional_services" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_declines" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "raiderId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_declines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "add_money_for_order_priority" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'sgd',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "add_money_for_order_priority_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_stops" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "destinationId" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "additionalInfo" TEXT,
    "type" "StopType" NOT NULL,
    "sequence" INTEGER NOT NULL,
    "status" "StopStatus" NOT NULL DEFAULT 'PENDING',
    "proofs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "arrivedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_methods" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "stripeMethodId" TEXT NOT NULL,
    "type" TEXT,
    "last4" TEXT,
    "expMonth" INTEGER,
    "expYear" INTEGER,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,

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
CREATE TABLE "fee_configuration_logs" (
    "id" SERIAL NOT NULL,
    "log_type" "FeeLogType" NOT NULL,
    "reference_id" INTEGER NOT NULL,
    "applicable_user" "ApplicableTyp" NOT NULL,
    "service_area" VARCHAR(100),
    "snapshot" JSONB NOT NULL,
    "changed_by_role" TEXT NOT NULL,
    "changed_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fee_configuration_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StandardCommissionRate" (
    "id" SERIAL NOT NULL,
    "applicable_user" "ApplicableTyp" NOT NULL,
    "role_name" VARCHAR(100) NOT NULL,
    "commission_rate_delivery_fee" INTEGER NOT NULL DEFAULT 0,
    "service_area_id" INTEGER,
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
    "service_area_id" INTEGER,
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
    "service_area_id" INTEGER,
    "applies_to" "FeeAppliesType" NOT NULL,
    "condition_value" DOUBLE PRECISION,
    "condition_unit" VARCHAR(20),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
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
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserDynamicSurge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Policy" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "desc" TEXT NOT NULL,
    "faq_for" "UserRole" NOT NULL DEFAULT 'USER',
    "isPublist" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromoCode" (
    "id" SERIAL NOT NULL,
    "promoCode" TEXT NOT NULL,
    "discountType" "DiscountType" NOT NULL,
    "discountValue" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromaCodeUses" (
    "id" SERIAL NOT NULL,
    "promoCodeId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "orderId" INTEGER NOT NULL,
    "discounttype" "DiscountType" NOT NULL,
    "discountAmount" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromaCodeUses_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "quiz_logs" (
    "id" SERIAL NOT NULL,
    "quizId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "quizOption" JSONB,
    "description" TEXT,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL,
    "changedByRole" TEXT NOT NULL,
    "changedByAdminId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_logs_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "Raider" (
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
    "hasBranding" BOOLEAN NOT NULL DEFAULT false,
    "hasAdDecal" BOOLEAN NOT NULL DEFAULT false,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "rank" "Rank" NOT NULL DEFAULT 'BRONZE',
    "rankScore" INTEGER,
    "reviews_count" INTEGER DEFAULT 0,
    "completed_orders" INTEGER DEFAULT 0,
    "active_days" INTEGER DEFAULT 0,
    "cancellation_rate" DOUBLE PRECISION DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Raider_pkey" PRIMARY KEY ("id")
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
    "latitude" INTEGER NOT NULL,
    "longitude" INTEGER NOT NULL,
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
CREATE TABLE "rate_customers" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "raiderId" INTEGER,
    "user_id" INTEGER,
    "rating_star" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "rate_customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_raiders" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "raiderId" INTEGER,
    "user_id" INTEGER,
    "delivery_quality" "DeliveryQuality" NOT NULL,
    "delivery_status" "DeliveryStatus" NOT NULL,
    "rating_star" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "rate_raiders_pkey" PRIMARY KEY ("id")
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
    "name" TEXT NOT NULL,
    "is_static" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" SERIAL NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "roleId" INTEGER NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceConfig" (
    "id" SERIAL NOT NULL,
    "service_email" TEXT NOT NULL,
    "service_number" TEXT NOT NULL,

    CONSTRAINT "ServiceConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "serviceZone" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "zoneName" TEXT NOT NULL,
    "coordinates" JSONB NOT NULL,
    "deliveryFee" DOUBLE PRECISION NOT NULL,
    "priority" INTEGER,
    "color" TEXT,
    "minOrderAmmount" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "serviceZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stop_payments" (
    "id" SERIAL NOT NULL,
    "orderStopId" INTEGER NOT NULL,
    "payType" "PayType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "discount" DECIMAL(65,30) DEFAULT 0,
    "collectedAt" TIMESTAMP(3),
    "collectedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stop_payments_pkey" PRIMARY KEY ("id")
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
    "transaction_code" VARCHAR(300),
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
    "login_id" VARCHAR(20),
    "phone" VARCHAR(20) NOT NULL,
    "password" VARCHAR(255),
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
    "totalWalletBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentWalletBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stripeCustomerId" TEXT,
    "stripeAccountId" TEXT,
    "total_coin_acc" INTEGER NOT NULL DEFAULT 0,
    "current_coin_balance" INTEGER NOT NULL DEFAULT 0,
    "reset_pass" BOOLEAN NOT NULL DEFAULT false,
    "fcmToken" TEXT,
    "image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "dob" DATE,
    "bank_account_num" VARCHAR(30),
    "bank_name" VARCHAR(100),
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_types" (
    "id" SERIAL NOT NULL,
    "vehicle_type" TEXT NOT NULL,
    "base_price" DECIMAL(12,2),
    "per_km_price" DECIMAL(12,2),
    "peak_pricing" BOOLEAN NOT NULL DEFAULT false,
    "dimension" TEXT,
    "max_load" DECIMAL(12,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "admin_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletHistory" (
    "id" SERIAL NOT NULL,
    "transactionId" TEXT NOT NULL,
    "transactionType" "WalletTransactionType" NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "status" "WalletTransactionStatus" NOT NULL,
    "currency" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RoleToUser" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_RoleToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdditionalServices_id_key" ON "AdditionalServices"("id");

-- CreateIndex
CREATE UNIQUE INDEX "DashboardPopup_id_key" ON "DashboardPopup"("id");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE INDEX "advertise_logs_advertiseId_idx" ON "advertise_logs"("advertiseId");

-- CreateIndex
CREATE INDEX "advertise_logs_createdAt_idx" ON "advertise_logs"("createdAt");

-- CreateIndex
CREATE INDEX "coin_logs_coinId_idx" ON "coin_logs"("coinId");

-- CreateIndex
CREATE INDEX "coin_logs_createdAt_idx" ON "coin_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "coins_key_key" ON "coins"("key");

-- CreateIndex
CREATE UNIQUE INDEX "coin_acc_history_userId_key" ON "coin_acc_history"("userId");

-- CreateIndex
CREATE INDEX "content_management_logs_contentId_idx" ON "content_management_logs"("contentId");

-- CreateIndex
CREATE INDEX "content_management_logs_createdAt_idx" ON "content_management_logs"("createdAt");

-- CreateIndex
CREATE INDEX "CustomerOrderConfirmationLog_customerOrderConfirmationId_idx" ON "CustomerOrderConfirmationLog"("customerOrderConfirmationId");

-- CreateIndex
CREATE INDEX "CustomerOrderConfirmationLog_createdAt_idx" ON "CustomerOrderConfirmationLog"("createdAt");

-- CreateIndex
CREATE INDEX "destinations_userId_lastUsedAt_idx" ON "destinations"("userId", "lastUsedAt");

-- CreateIndex
CREATE INDEX "destinations_userId_useCount_idx" ON "destinations"("userId", "useCount");

-- CreateIndex
CREATE UNIQUE INDEX "disputes_orderId_key" ON "disputes"("orderId");

-- CreateIndex
CREATE INDEX "disputes_orderId_idx" ON "disputes"("orderId");

-- CreateIndex
CREATE INDEX "disputes_createdById_idx" ON "disputes"("createdById");

-- CreateIndex
CREATE INDEX "incentive_logs_incentiveId_idx" ON "incentive_logs"("incentiveId");

-- CreateIndex
CREATE INDEX "incentive_logs_createdAt_idx" ON "incentive_logs"("createdAt");

-- CreateIndex
CREATE INDEX "UserLogin_userId_loginAt_idx" ON "UserLogin"("userId", "loginAt");

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
CREATE INDEX "orders_userId_order_status_idx" ON "orders"("userId", "order_status");

-- CreateIndex
CREATE UNIQUE INDEX "order_declines_orderId_raiderId_key" ON "order_declines"("orderId", "raiderId");

-- CreateIndex
CREATE INDEX "order_stops_orderId_sequence_idx" ON "order_stops"("orderId", "sequence");

-- CreateIndex
CREATE INDEX "order_stops_orderId_status_idx" ON "order_stops"("orderId", "status");

-- CreateIndex
CREATE INDEX "fee_configuration_logs_log_type_idx" ON "fee_configuration_logs"("log_type");

-- CreateIndex
CREATE INDEX "fee_configuration_logs_reference_id_idx" ON "fee_configuration_logs"("reference_id");

-- CreateIndex
CREATE INDEX "fee_configuration_logs_created_at_idx" ON "fee_configuration_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_promoCode_key" ON "PromoCode"("promoCode");

-- CreateIndex
CREATE INDEX "quiz_logs_quizId_idx" ON "quiz_logs"("quizId");

-- CreateIndex
CREATE INDEX "quiz_logs_createdAt_idx" ON "quiz_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Raider_userId_key" ON "Raider"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "raider_locations_raiderId_key" ON "raider_locations"("raiderId");

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
CREATE UNIQUE INDEX "rate_customers_orderId_key" ON "rate_customers"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "rate_raiders_orderId_key" ON "rate_raiders"("orderId");

-- CreateIndex
CREATE INDEX "rewards_userId_idx" ON "rewards"("userId");

-- CreateIndex
CREATE INDEX "rewards_refer_id_idx" ON "rewards"("refer_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "stop_payments_orderStopId_key" ON "stop_payments"("orderStopId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_login_id_key" ON "users"("login_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_referral_code_key" ON "users"("referral_code");

-- CreateIndex
CREATE UNIQUE INDEX "users_referral_link_key" ON "users"("referral_link");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WalletHistory_transactionId_key" ON "WalletHistory"("transactionId");

-- CreateIndex
CREATE INDEX "_RoleToUser_B_index" ON "_RoleToUser"("B");

-- AddForeignKey
ALTER TABLE "admins" ADD CONSTRAINT "admins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvertiseAnalytics" ADD CONSTRAINT "AdvertiseAnalytics_advertiseId_fkey" FOREIGN KEY ("advertiseId") REFERENCES "Advertise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advertise_logs" ADD CONSTRAINT "advertise_logs_advertiseId_fkey" FOREIGN KEY ("advertiseId") REFERENCES "Advertise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coin_logs" ADD CONSTRAINT "coin_logs_coinId_fkey" FOREIGN KEY ("coinId") REFERENCES "coins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coin_history" ADD CONSTRAINT "coin_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collected_incentives" ADD CONSTRAINT "collected_incentives_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collected_incentives" ADD CONSTRAINT "collected_incentives_incentiveId_fkey" FOREIGN KEY ("incentiveId") REFERENCES "incentives"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_management_logs" ADD CONSTRAINT "content_management_logs_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "ContentManagement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerOrderConfirmationLog" ADD CONSTRAINT "CustomerOrderConfirmationLog_customerOrderConfirmationId_fkey" FOREIGN KEY ("customerOrderConfirmationId") REFERENCES "Customer_order_confirmation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_types" ADD CONSTRAINT "delivery_types_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "destinations" ADD CONSTRAINT "destinations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "destinations" ADD CONSTRAINT "destinations_service_zoneId_fkey" FOREIGN KEY ("service_zoneId") REFERENCES "serviceZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver_order_competition_change_logs" ADD CONSTRAINT "Driver_order_competition_change_logs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incentive_logs" ADD CONSTRAINT "incentive_logs_incentiveId_fkey" FOREIGN KEY ("incentiveId") REFERENCES "incentives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incentives" ADD CONSTRAINT "incentives_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLogin" ADD CONSTRAINT "UserLogin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "my_raiders" ADD CONSTRAINT "my_raiders_raiderId_fkey" FOREIGN KEY ("raiderId") REFERENCES "Raider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_serviceZoneId_fkey" FOREIGN KEY ("serviceZoneId") REFERENCES "serviceZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_vehicle_type_id_fkey" FOREIGN KEY ("vehicle_type_id") REFERENCES "vehicle_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_assign_rider_id_fkey" FOREIGN KEY ("assign_rider_id") REFERENCES "Raider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_declines" ADD CONSTRAINT "order_declines_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_declines" ADD CONSTRAINT "order_declines_raiderId_fkey" FOREIGN KEY ("raiderId") REFERENCES "Raider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "add_money_for_order_priority" ADD CONSTRAINT "add_money_for_order_priority_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_stops" ADD CONSTRAINT "order_stops_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_stops" ADD CONSTRAINT "order_stops_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "destinations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "places" ADD CONSTRAINT "places_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandardCommissionRate" ADD CONSTRAINT "StandardCommissionRate_service_area_id_fkey" FOREIGN KEY ("service_area_id") REFERENCES "serviceZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaiderCompensationRole" ADD CONSTRAINT "RaiderCompensationRole_service_area_id_fkey" FOREIGN KEY ("service_area_id") REFERENCES "serviceZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFeeStructure" ADD CONSTRAINT "UserFeeStructure_service_area_id_fkey" FOREIGN KEY ("service_area_id") REFERENCES "serviceZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromaCodeUses" ADD CONSTRAINT "PromaCodeUses_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "options" ADD CONSTRAINT "options_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_logs" ADD CONSTRAINT "quiz_logs_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Raider" ADD CONSTRAINT "Raider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raider_locations" ADD CONSTRAINT "raider_locations_raiderId_fkey" FOREIGN KEY ("raiderId") REFERENCES "Raider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raider_location_history" ADD CONSTRAINT "raider_location_history_raiderId_fkey" FOREIGN KEY ("raiderId") REFERENCES "Raider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raider_quizzes" ADD CONSTRAINT "raider_quizzes_raiderId_fkey" FOREIGN KEY ("raiderId") REFERENCES "Raider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raider_quizzes" ADD CONSTRAINT "raider_quizzes_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raider_answers" ADD CONSTRAINT "raider_answers_raider_quiz_id_fkey" FOREIGN KEY ("raider_quiz_id") REFERENCES "raider_quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raider_answers" ADD CONSTRAINT "raider_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raider_answers" ADD CONSTRAINT "raider_answers_selected_option_id_fkey" FOREIGN KEY ("selected_option_id") REFERENCES "options"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raider_registrations" ADD CONSTRAINT "raider_registrations_raiderId_fkey" FOREIGN KEY ("raiderId") REFERENCES "Raider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rate_customers" ADD CONSTRAINT "rate_customers_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rate_customers" ADD CONSTRAINT "rate_customers_raiderId_fkey" FOREIGN KEY ("raiderId") REFERENCES "Raider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rate_customers" ADD CONSTRAINT "rate_customers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rate_raiders" ADD CONSTRAINT "rate_raiders_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rate_raiders" ADD CONSTRAINT "rate_raiders_raiderId_fkey" FOREIGN KEY ("raiderId") REFERENCES "Raider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rate_raiders" ADD CONSTRAINT "rate_raiders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refers" ADD CONSTRAINT "refers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "stop_payments" ADD CONSTRAINT "stop_payments_orderStopId_fkey" FOREIGN KEY ("orderStopId") REFERENCES "order_stops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tips" ADD CONSTRAINT "tips_raiderId_fkey" FOREIGN KEY ("raiderId") REFERENCES "Raider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_types" ADD CONSTRAINT "vehicle_types_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletHistory" ADD CONSTRAINT "WalletHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoleToUser" ADD CONSTRAINT "_RoleToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoleToUser" ADD CONSTRAINT "_RoleToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
