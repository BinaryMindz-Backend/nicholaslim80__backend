-- AlterTable
ALTER TABLE "AboutUs" ADD COLUMN     "faq_for" "UserRole" NOT NULL DEFAULT 'USER';

-- AlterTable
ALTER TABLE "ContentManagement" ADD COLUMN     "faq_for" "UserRole" NOT NULL DEFAULT 'USER';

-- AlterTable
ALTER TABLE "Policy" ADD COLUMN     "faq_for" "UserRole" NOT NULL DEFAULT 'USER';

-- AlterTable
ALTER TABLE "article" ADD COLUMN     "faq_for" "UserRole" NOT NULL DEFAULT 'USER';

-- AlterTable
ALTER TABLE "destinations" ADD COLUMN     "postal_code" TEXT;
