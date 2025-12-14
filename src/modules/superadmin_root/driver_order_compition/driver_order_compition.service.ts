import { Injectable } from '@nestjs/common';
import { CreateDriverOrderCompitionDto } from './dto/create-driver_order_compition.dto';
import { UpdateDriverOrderCompitionDto } from './dto/update-driver_order_compition.dto';

@Injectable()
export class DriverOrderCompitionService {
  create(createDriverOrderCompitionDto: CreateDriverOrderCompitionDto) {
    return 'This action adds a new driverOrderCompition';
  }

  findAll() {
    return `This action returns all driverOrderCompition`;
  }

  findOne(id: number) {
    return `This action returns a #${id} driverOrderCompition`;
  }

  update(id: number, updateDriverOrderCompitionDto: UpdateDriverOrderCompitionDto) {
    return `This action updates a #${id} driverOrderCompition`;
  }

  remove(id: number) {
    return `This action removes a #${id} driverOrderCompition`;
  }
}
