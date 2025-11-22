import { Injectable } from '@nestjs/common';
import { CreateRidersProfileDto } from './dto/create-riders_profile.dto';
import { UpdateRidersProfileDto } from './dto/update-riders_profile.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import { RaiderVerification } from '@prisma/client';


@Injectable()
export class RidersProfileService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }
  async create(userId: number, createRidersProfileDto: CreateRidersProfileDto) {
    const riderExists = await this.prisma.raider.findFirst({
      where: {
        userId: userId,
      },
    });

    if (!riderExists) {
      throw new Error('Rider not found for the given user ID');
    }

    const res = await this.prisma.raiderRegistration.create({
      data: {
        raiderId: riderExists.id,
        ...createRidersProfileDto,
      },
    });
    return res;
  }

  async findAll() {
    const res = await this.prisma.raider.findMany();
    return res;
  }

  async findOne(id: string) {
    const res = await this.prisma.raider.findUnique({
      where: { id: Number(id) },
      include: { registrations: true },
    });
    return res;
  }
  async verifyRiderProfile(id: number, verify: RaiderVerification) {
    const res = await this.prisma.raider.findUnique({
      where: { id: Number(id) },
      include: { registrations: true },
    });
    if (!res) {
      throw new Error('Rider profile not found');
    }

    const registration = await this.prisma.raiderRegistration.findFirst({
      where: { raiderId: Number(id) },
    });

    if (!registration) {
      throw new Error('Rider registration not found for this rider');
    }

    const updatedProfile = await this.prisma.raiderRegistration.update({
      where: { id: registration.id },
      data: {
        raider_verificationFromAdmin: verify,
      },
    });

    return updatedProfile;
  }
  async update(id: number, updateRidersProfileDto: UpdateRidersProfileDto) {

    const userExists = await this.prisma.raider.findUnique({
      where: { userId: Number(id) },
    });

    if (!userExists) {
      throw new Error('Rider profile not found');
    }

    // find the registration for this raider
    const registration = await this.prisma.raiderRegistration.findFirst({
      where: { raiderId: Number(userExists.id) },
    });

    if (!registration) {
      throw new Error('Rider registration not found for this rider');
    }

    const res = await this.prisma.raiderRegistration.update({
      where: { id: registration.id },
      data: { ...updateRidersProfileDto },
    });
    return res;
  }


}
