-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OrderStatus" ADD VALUE 'ONGOING';
ALTER TYPE "OrderStatus" ADD VALUE 'SCHEDULED';

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

-- AddForeignKey
ALTER TABLE "my_raiders" ADD CONSTRAINT "my_raiders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
