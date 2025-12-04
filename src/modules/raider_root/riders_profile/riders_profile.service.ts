/* eslint-disable prefer-const */
import { Injectable } from '@nestjs/common';
import { CreateRidersProfileDto } from './dto/create-riders_profile.dto';
import { UpdateRidersProfileDto } from './dto/update-riders_profile.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import { RaiderVerification, UserRole } from '@prisma/client';

import { CreateUserDto } from 'src/modules/users_root/users/dto/create-user.dto';
import { ApiResponses } from 'src/common/apiResponse';

import * as bcrypt from 'bcrypt';
import { GetRidersQueryDto } from './dto/query-riders.dto';
import { SuspendRiderProfileDto } from './dto/suspendRider.dto';
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

  // async findAll() {
  //   const res = await this.prisma.raider.findMany({
  //         include:{
  //             registrations:true
  //         }
  //   });


  async findAll(query: GetRidersQueryDto) {
    const filter: any = {};

    if (query.raider_name) {
      filter.raider_name = {
        contains: query.raider_name,
        mode: 'insensitive',
      };
    }

    if (query.raiderId) {
      filter.id = Number(query.raiderId);
    }

    if (query.raider_verificationFromAdmin) {
      filter.raider_verificationFromAdmin = query.raider_verificationFromAdmin;
    }

    // if (query.signInPortal) {
    //   filter.signInPortal = query.signInPortal;
    // }

    let orderBy: any = {};

    if (query.type) {
      // Accept both the DTO's 'asc'/'desc' values and legacy 'first'/'last' for compatibility
      const orderType = String(query.type).toLowerCase();
      if (orderType === 'asc' || orderType === 'first') {
        orderBy.createdAt = 'asc';
      } else if (orderType === 'desc' || orderType === 'last') {
        orderBy.createdAt = 'desc';
      }
    }

    const res = await this.prisma.raider.findMany({
      where: filter,
      orderBy: orderBy,
      include: {
        registrations: true
      }
    });
    //
    return res;
  }


  // 
  async findOne(id: string) {
    const res = await this.prisma.raider.findUnique({
      where: { id: Number(id) },
      include: { registrations: true },
    });
    return res;
  }


  // 
  async verifyRiderProfile(id: number, verify: RaiderVerification) {

    const r = await this.prisma.raider.findUnique({
      where: { id: Number(id) }
    });

    if (!r) {
      throw new Error('Rider profile not found');
    }

    const registration = await this.prisma.raiderRegistration.findFirst({
      where: { raiderId: Number(id) },
    });

    if (!registration) {
      throw new Error('Rider registration not found for this rider');
    }

    const updatedProfile = await this.prisma.raider.update({
      where: { id: r.id },
      data: {
        raider_verificationFromAdmin: verify,
      },
    });

    return updatedProfile;
  }


  // 
  async update(id: number, updateRidersProfileDto: UpdateRidersProfileDto) {

    const raiderExists = await this.prisma.raider.findUnique({
      where: { userId: Number(id) },
    });

    if (!raiderExists) {
      throw new Error('Rider profile not found');
    }

    // find the registration for this raider
    const registration = await this.prisma.raiderRegistration.findFirst({
      where: { raiderId: Number(raiderExists.id) },
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


  // 
  async remove(id: string) {
    const res = await this.prisma.raiderRegistration.delete({
      where: { id: Number(id) },
    });
    return res;
  }



  // 
  async suspendRiderProfile(id: number, dto: SuspendRiderProfileDto) {
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

    const updatedProfile = await this.prisma.raider.update({
      where: { id: registration.id },
      data: {
        suspendedDuration: dto.suspendedDuration,
        suspensionReason: dto.suspensionReason,
      },
    });

    return updatedProfile;
  }


  //TODO:need to check
  async adminCreateRiderProfile(createRidersProfileDto: CreateRidersProfileDto) {
    // If DTO contains a raiderId, connect the existing raider relation; otherwise use the DTO as-is.
    const { raiderId, ...rest } = createRidersProfileDto as any;
    const data = raiderId
      ? { ...rest, raider: { connect: { id: Number(raiderId) } } }
      : { ...createRidersProfileDto };
    // make the user first and then create the profile
    const raidersDefaultPassword = process.env.RAIDER_DEFAULT_PASSWORD || '123456';

    if (!raidersDefaultPassword) {
      throw new Error(' Default raider password is not set in environment variables');
    }
    const hashed = await bcrypt.hash(raidersDefaultPassword, 10);
    const userExists = await this.prisma.user.findUnique({
      where: {
        email: createRidersProfileDto.email_address,
      },
    });

    if (userExists) {
      return ApiResponses.error('User with this email already exists');
    }
    const user = await this.prisma.user.create({
      data: {
        email: createRidersProfileDto.email_address,
        password: hashed,
        role: UserRole.RAIDER,
        phone: createRidersProfileDto.contact_number,
        is_verified: true,
      },
    });

    const raider = await this.prisma.raider.create({
      data: {
        userId: user.id,
      },
    });

    data['raiderId'] = raider.id;

    const res = await this.prisma.raiderRegistration.create({
      data,
    });
    return res;
  }


  // TODO:need to fix
  async adminUpdateRiderProfile(id: number, updateRidersProfileDto: UpdateRidersProfileDto) {
    const userExists = await this.prisma.raiderRegistration.findUnique({
      where: { id: Number(id) },
    });

    if (!userExists) {
      return ApiResponses.error('Rider profile not found');
    }

    // find the registration for this raider
    const registration = await this.prisma.raiderRegistration.findFirst({
      where: { raiderId: Number(userExists.id) },
    });

    if (!registration) {
      return ApiResponses.error('Rider registration not found for this rider');
    }

    const res = await this.prisma.raiderRegistration.update({
      where: { id: registration.id },
      data: { ...updateRidersProfileDto },
    });
    return res;
  }

  // TODO:need to fix
  async adminCreateUser(dto: CreateUserDto) {
    try {
      const uuserExists = await this.prisma.user.findUnique({
        where: {
          email: dto.email,
        },
      });

      if (uuserExists) {
        return ApiResponses.error('User with this email already exists');
      }
      const defaultpassword = process.env.RAIDER_DEFAULT_PASSWORD

      if (!defaultpassword) {
        throw new Error('Default password is not set in environment variables');
      }
      const hashed = await bcrypt.hash(defaultpassword, 10);
      const res = await this.prisma.user.create({
        data: {
          email: dto.email,
          password: hashed,
          role: UserRole.USER,
          phone: dto.phone,
          is_verified: true,
        },
      });
      return res;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return ApiResponses.error(message);
    }
  }
}