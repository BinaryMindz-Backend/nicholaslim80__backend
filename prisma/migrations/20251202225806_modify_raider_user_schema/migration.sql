-- CreateEnum
CREATE TYPE "RaiderStatus" AS ENUM ('ACTIVE', 'IN_ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "LoginType" AS ENUM ('DIRECT_SIGNIN', 'ADMIN_SIGNIN');

-- AlterTable
ALTER TABLE "raiders" ADD COLUMN     "LoginType" "LoginType" NOT NULL DEFAULT 'DIRECT_SIGNIN',
ADD COLUMN     "raider_status" "RaiderStatus" NOT NULL DEFAULT 'IN_ACTIVE';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "regi_status" "LoginType" NOT NULL DEFAULT 'DIRECT_SIGNIN';
