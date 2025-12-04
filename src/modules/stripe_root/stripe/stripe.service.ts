import { Injectable } from '@nestjs/common';
import { CreateStripeDto } from './dto/create-stripe.dto';
import { UpdateStripeDto } from './dto/update-stripe.dto';
import { UpdatePaymentDataDto } from './dto/update-payment-data.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import { ApiResponses } from 'src/common/apiResponse';

@Injectable()
export class StripeService {
  constructor(
    private readonly prisma: PrismaService
  ) { }
  async updatePaymentData(userid: number, dto: UpdatePaymentDataDto) {
    const userExist = await this.prisma.user.findUnique({
      where: { id: userid },
    });

    if (!userExist) {
      return ApiResponses.error('User not found');
    }
    const dataUpdate = await this.prisma.user.update({
      where: { id: userid },
      data: {
        stripe_customer_id: dto.customerId,
        stripe_payment_method_id: dto.paymentMethodId,
      },
    });
    return {
      message: `Payment data for user ${userid} with customer ID ${dto.customerId} updated successfully with payment method ${dto.paymentMethodId}`,
      data: dataUpdate,
    };
  }



  create(createStripeDto: CreateStripeDto) {
    return 'This action adds a new stripe';
  }

  findAll() {
    return `This action returns all stripe`;
  }

  findOne(id: number) {
    return `This action returns a #${id} stripe`;
  }

  update(id: number, updateStripeDto: UpdateStripeDto) {
    return `This action updates a #${id} stripe`;
  }

  remove(id: number) {
    return `This action removes a #${id} stripe`;
  }
}
