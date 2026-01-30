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
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "AdditionalServices_id_key" ON "AdditionalServices"("id");

-- CreateIndex
CREATE UNIQUE INDEX "DashboardPopup_id_key" ON "DashboardPopup"("id");
