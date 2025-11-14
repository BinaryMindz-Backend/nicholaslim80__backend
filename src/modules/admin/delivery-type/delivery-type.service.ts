import { Injectable } from '@nestjs/common';
import { CreateDeliveryTypeDto } from './dto/create-delivery-type.dto';
import { UpdateDeliveryTypeDto } from './dto/update-delivery-type.dto';

@Injectable()
export class DeliveryTypeService {
  create(createDeliveryTypeDto: CreateDeliveryTypeDto) {
    return 'This action adds a new deliveryType';
  }

  findAll() {
    return `This action returns all deliveryType`;
  }

  findOne(id: number) {
    return `This action returns a #${id} deliveryType`;
  }

  update(id: number, updateDeliveryTypeDto: UpdateDeliveryTypeDto) {
    return `This action updates a #${id} deliveryType`;
  }

  remove(id: number) {
    return `This action removes a #${id} deliveryType`;
  }
}
