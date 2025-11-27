import { Injectable } from '@nestjs/common';
import { CreatePlatformFeeDto } from './dto/create-platform_fee.dto';
import { UpdatePlatformFeeDto } from './dto/update-platform_fee.dto';

@Injectable()
export class PlatformFeeService {
  create(createPlatformFeeDto: CreatePlatformFeeDto) {
    return 'This action adds a new platformFee';
  }

  findAll() {
    return `This action returns all platformFee`;
  }

  findOne(id: number) {
    return `This action returns a #${id} platformFee`;
  }

  update(id: number, updatePlatformFeeDto: UpdatePlatformFeeDto) {
    return `This action updates a #${id} platformFee`;
  }

  remove(id: number) {
    return `This action removes a #${id} platformFee`;
  }
}
