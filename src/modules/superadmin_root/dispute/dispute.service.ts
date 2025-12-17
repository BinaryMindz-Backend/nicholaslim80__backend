import { Injectable } from '@nestjs/common';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { UpdateDisputeDto } from './dto/update-dispute.dto';

@Injectable()
export class DisputeService {
  create(createDisputeDto: CreateDisputeDto) {
    try {
      return 'This action adds a new dispute';
    } catch (error) {
      return error.message;
    }
  }

  findAll() {
    try {
      return `This action returns all dispute`;
    } catch (error) {
      return error.message;
    }
  }

  findOne(id: number) {
    try {
      return `This action returns a #${id} dispute`;
    } catch (error) {
      return error.message;
    }
  }

  update(id: number, updateDisputeDto: UpdateDisputeDto) {

    try {
      return `This action updates a #${id} dispute`;
    } catch (error) {
      return error.message;
    }
  }

  remove(id: number) {
    try {

    } catch (error) {
      return error.message;
    }
  }
}
