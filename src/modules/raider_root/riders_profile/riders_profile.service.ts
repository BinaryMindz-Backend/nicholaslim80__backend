import { Injectable } from '@nestjs/common';
import { CreateRidersProfileDto } from './dto/create-riders_profile.dto';
import { UpdateRidersProfileDto } from './dto/update-riders_profile.dto';

@Injectable()
export class RidersProfileService {
  create(createRidersProfileDto: CreateRidersProfileDto) {
    return 'This action adds a new ridersProfile';
  }

  findAll() {
    return `This action returns all ridersProfile`;
  }

  findOne(id: number) {
    return `This action returns a #${id} ridersProfile`;
  }

  update(id: number, updateRidersProfileDto: UpdateRidersProfileDto) {
    return `This action updates a #${id} ridersProfile`;
  }

  remove(id: number) {
    return `This action removes a #${id} ridersProfile`;
  }
}
