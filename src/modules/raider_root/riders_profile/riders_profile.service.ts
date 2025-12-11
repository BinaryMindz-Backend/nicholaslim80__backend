/* eslint-disable prefer-const */
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRidersProfileDto } from './dto/create-riders_profile.dto';
import { UpdateRidersProfileDto } from './dto/update-riders_profile.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import { LoginType, RaiderStatus, RaiderVerification, UserRole } from '@prisma/client';
import { ApiResponses } from 'src/common/apiResponse';
import { GetRidersQueryDto } from './dto/query-riders.dto';
import { SuspendRiderProfileDto } from './dto/suspendRider.dto';
import bcrypt from "bcrypt"


// 
@Injectable()
export class RidersProfileService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  async create(userId: number, createRidersProfileDto: CreateRidersProfileDto) {


    // 
    const riderExists = await this.prisma.raider.findFirst({
      where: {
        userId: userId,
      },
    });
    //  
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

    if (verify === RaiderVerification.APPROVED) {
      // 
      const updatedProfile = await this.prisma.raider.update({
        where: { id: r.id },
        data: {
          raider_verificationFromAdmin: verify,
          raider_status: RaiderStatus.ACTIVE
        },
      });

      return updatedProfile;
    }

    //  
    if (verify === RaiderVerification.PENDING) {
      // 
      const updatedProfile = await this.prisma.raider.update({
        where: { id: r.id },
        data: {
          raider_verificationFromAdmin: verify,
          raider_status: RaiderStatus.IN_ACTIVE
        },
      });

      return updatedProfile;
    }
    // 

    if (verify === RaiderVerification.REJECTED) {
      // 
      const updatedProfile = await this.prisma.raider.update({
        where: { id: r.id },
        data: {
          raider_verificationFromAdmin: verify,
          raider_status: RaiderStatus.IN_ACTIVE
        },
      });

      return updatedProfile;
    }

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
    console.log({ registration });
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
  async remove(userId: number) {
    // 
    const record = await this.prisma.raider.findFirst({
      where: {
        userId
      }
    })
    // 
    if (!record) {
      throw new NotFoundException("User not found")
    }
    // 

    const res = await this.prisma.raider.delete({
      where: { id: record.id },
    });
    return res;
    // 
  }



  // 
  async suspendRiderProfile(id: number, dto: SuspendRiderProfileDto) {
    console.log(dto);
    const res = await this.prisma.raider.findUnique({
      where: { id: Number(id) },
      include: { registrations: true },
    });
    console.log({ res });
    if (!res) {
      throw new Error('Rider profile not found');
    }

    const registration = await this.prisma.raiderRegistration.findFirst({
      where: { raiderId: Number(id) },
    });
    console.log({ registration });
    if (!registration) {
      throw new Error('Rider registration not found for this rider');
    }

    const updatedProfile = await this.prisma.raider.update({
      where: { id: registration.id },
      data: {
        isSuspended: true,
        suspendedDuration: dto.suspendedDuration,
        suspensionReason: dto.suspensionReason,
      },
    });

    return updatedProfile;
  }


  //
  async adminCreateRiderProfile(dto: CreateRidersProfileDto) {

    // 
    const record = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.email_address },
          { phone: dto.contact_number }
        ]
      }
    })
    const registration = await this.prisma.raiderRegistration.findFirst({
      where: {
        OR: [
          { contact_number: dto.contact_number },
          { email_address: dto.email_address }
        ]
      }
    })
    // 
    if (record || registration) {
      throw new NotFoundException("record already exist")
    }
    // 
    const cteatedRaider = await this.prisma.$transaction(async (tx) => {
      // 
      const defaultpassword = process.env.RAIDER_DEFAULT_PASSWORD;
      // 
      if (!defaultpassword) {
        throw new NotFoundException('Default password is not set in environment variables');
      }
      const hashedPass = await bcrypt.hash(defaultpassword, 10);
      // 
      const user = await tx.user.create({
        data: {
          username: dto.raider_name,
          email: dto.email_address,
          phone: dto.contact_number,
          role: UserRole.RAIDER,
          regi_status: LoginType.ADMIN_SIGNIN,
          is_active: true,
          is_verified: true,
          password: hashedPass
        }
      })
      //  
      const raider = await tx.raider.create({
        data: {
          userId: user?.id,
          LoginType: LoginType.ADMIN_SIGNIN,
          raider_verificationFromAdmin: RaiderVerification.APPROVED,
          raider_status: RaiderStatus.ACTIVE
        }
      })
      // 
      const reg = await tx.raiderRegistration.create({
        data: {
          ...dto,
          raiderId: raider?.id
        }
      })


      return {
        user,
        raider,
        reg
      }

    })
    //  send res
    return cteatedRaider
  }





  //
  async adminUpdateRiderProfile(id: number, updateRidersProfileDto: UpdateRidersProfileDto) {
    const raiderExists = await this.prisma.raider.findFirst({
      where: {
        OR: [
          { id: Number(id) }
        ]
      },
    });

    if (!raiderExists) {
      return ApiResponses.error('Rider not found');
    }

    // find the registration for this raider
    const registration = await this.prisma.raiderRegistration.findFirst({
      where: { raiderId: Number(raiderExists.id) },
    });

    if (!registration) {
      return ApiResponses.error('Rider profile not found for this rider');
    }

    const res = await this.prisma.raiderRegistration.update({
      where: { id: registration.id },
      data: { ...updateRidersProfileDto },
    });
    return res;
  }

}