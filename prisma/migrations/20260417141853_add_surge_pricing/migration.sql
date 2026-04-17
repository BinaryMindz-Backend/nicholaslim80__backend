-- CreateEnum
CREATE TYPE "SurgePricingStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "surge_pricing_rules" (
    "id" SERIAL NOT NULL,
    "ruleName" TEXT NOT NULL,
    "ratioFrom" DECIMAL(10,4) NOT NULL,
    "ratioTo" DECIMAL(10,4) NOT NULL,
    "priceMultiplier" DECIMAL(10,4) NOT NULL,
    "maxCap" DECIMAL(10,4),
    "status" "SurgePricingStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "surge_pricing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "surge_pricing_rule_zones" (
    "surgePricingRuleId" INTEGER NOT NULL,
    "serviceZoneId" INTEGER NOT NULL,

    CONSTRAINT "surge_pricing_rule_zones_pkey" PRIMARY KEY ("surgePricingRuleId","serviceZoneId")
);

-- CreateTable
CREATE TABLE "surge_pricing_rule_delivery_types" (
    "surgePricingRuleId" INTEGER NOT NULL,
    "deliveryTypeId" INTEGER NOT NULL,

    CONSTRAINT "surge_pricing_rule_delivery_types_pkey" PRIMARY KEY ("surgePricingRuleId","deliveryTypeId")
);

-- CreateIndex
CREATE INDEX "surge_pricing_rules_status_ratioFrom_ratioTo_idx" ON "surge_pricing_rules"("status", "ratioFrom", "ratioTo");

-- AddForeignKey
ALTER TABLE "surge_pricing_rule_zones" ADD CONSTRAINT "surge_pricing_rule_zones_surgePricingRuleId_fkey" FOREIGN KEY ("surgePricingRuleId") REFERENCES "surge_pricing_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surge_pricing_rule_zones" ADD CONSTRAINT "surge_pricing_rule_zones_serviceZoneId_fkey" FOREIGN KEY ("serviceZoneId") REFERENCES "serviceZone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surge_pricing_rule_delivery_types" ADD CONSTRAINT "surge_pricing_rule_delivery_types_surgePricingRuleId_fkey" FOREIGN KEY ("surgePricingRuleId") REFERENCES "surge_pricing_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surge_pricing_rule_delivery_types" ADD CONSTRAINT "surge_pricing_rule_delivery_types_deliveryTypeId_fkey" FOREIGN KEY ("deliveryTypeId") REFERENCES "delivery_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
