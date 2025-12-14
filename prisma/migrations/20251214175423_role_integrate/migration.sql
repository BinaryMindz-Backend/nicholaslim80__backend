/*
  Warnings:

  - You are about to drop the column `permissionId` on the `role_permissions` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `roles` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `_AdminToRole` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `permissions` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name]` on the table `roles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `action` to the `role_permissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `module` to the `role_permissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `roles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role_id` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_AdminToRole" DROP CONSTRAINT "_AdminToRole_A_fkey";

-- DropForeignKey
ALTER TABLE "_AdminToRole" DROP CONSTRAINT "_AdminToRole_B_fkey";

-- DropForeignKey
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_permissionId_fkey";

-- DropIndex
DROP INDEX "role_permissions_roleId_permissionId_key";

-- AlterTable
ALTER TABLE "role_permissions" DROP COLUMN "permissionId",
ADD COLUMN     "action" TEXT NOT NULL,
ADD COLUMN     "module" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "roles" DROP COLUMN "description",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "is_static" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "name" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "role",
ADD COLUMN     "role_id" INTEGER NOT NULL;

-- DropTable
DROP TABLE "_AdminToRole";

-- DropTable
DROP TABLE "permissions";

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
