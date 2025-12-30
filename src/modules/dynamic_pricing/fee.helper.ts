/* eslint-disable @typescript-eslint/no-unsafe-return */
import { DeliveryTypeName, FeeAppliesType } from '@prisma/client';

export function mapDeliveryType(
  type: DeliveryTypeName,
): FeeAppliesType {
  switch (type) {
    case 'STANDARD':
      return FeeAppliesType.STANDARD_ORDERS;
    case 'EXPRESS':
      return FeeAppliesType.EXPRESS_ORDERS;
    case 'SCHEDULED':
      return FeeAppliesType.SCHEDULED_ORDERS;
    case 'STACKED':
      return FeeAppliesType.STACKED_ORDERS;
    default:
      throw new Error('Unsupported delivery type');
  }
}
