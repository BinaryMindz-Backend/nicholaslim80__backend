import { Injectable } from '@nestjs/common';
import { CreateStripeRootDto } from './dto/create-stripe_root.dto';
import { UpdateStripeRootDto } from './dto/update-stripe_root.dto';

@Injectable()
export class StripeRootService {
  create(createStripeRootDto: CreateStripeRootDto) {
    return 'This action adds a new stripeRoot';
  }

  findAll() {
    return `This action returns all stripeRoot`;
  }

  findOne(id: number) {
    return `This action returns a #${id} stripeRoot`;
  }

  update(id: number, updateStripeRootDto: UpdateStripeRootDto) {
    return `This action updates a #${id} stripeRoot`;
  }

  remove(id: number) {
    return `This action removes a #${id} stripeRoot`;
  }
}
