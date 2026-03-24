/* eslint-disable @typescript-eslint/no-unused-vars */
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateRiderRegistrationDto } from './dto/create-riders_profile.dto';
import { UpdateRidersProfileDto } from './dto/update-riders_profile.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import { LoginType, Prisma, RaiderStatus, RaiderVerification, UserRole, VehicleTypeEnum } from '@prisma/client';
import { GetRidersQueryDto } from './dto/query-riders.dto';
import { SuspendRiderProfileDto } from './dto/suspendRider.dto';
import bcrypt from "bcrypt"


// 
@Injectable()
export class RidersProfileService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  // create
  async create(userId: number, dto: CreateRiderRegistrationDto) {

    // 1. Check rider exists
    const rider = await this.prisma.raider.findUnique({
      where: { userId },
    });

    if (!rider) {
      throw new NotFoundException('Rider not found');
    }

    // 2. Check vehicle type exists
    const vehicleType = await this.prisma.vehicleType.findUnique({
      where: { id: dto.vehicle_type_id },
    });

    if (!vehicleType) {
      throw new NotFoundException('Vehicle type not found');
    }

    // 3. Check duplicate registration
    const existing = await this.prisma.raiderRegistration.findFirst({
      where: {
        OR: [
          { email_address: dto.email_address },
          { raiderId: rider.id },
        ],
      },
    });

    if (existing) {
      throw new ConflictException('Rider profile already exists');
    }

    // 4. Create registration
    const { vehicle_type_id, ...registrationFields } = dto;
    return this.prisma.raiderRegistration.create({
      data: {
        ...registrationFields,
        raiderId: rider.id,
        vehicle_type_id,
      },
    });
  }

  // 
  async findAll(query: GetRidersQueryDto) {
    const {
      raiderId,
      loginType,
      raider_verificationFromAdmin,
      type = 'desc',
      page = 1,
      limit = 10,
      search,
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.RaiderWhereInput = {};

    if (raiderId) {
      where.id = raiderId;
    }

    if (loginType) {
      where.LoginType = loginType;
    }

    if (raider_verificationFromAdmin) {
      where.raider_verificationFromAdmin = raider_verificationFromAdmin;
    }

    if (search) {
      where.registrations = {
        some: {
          OR: [
            {
              raider_name: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              email_address: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
        },
      };
    }

    const orderBy: Prisma.RaiderOrderByWithRelationInput = {
      created_at: type,
    };

    const [total, data] = await Promise.all([
      this.prisma.raider.count({ where }),

      this.prisma.raider.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          registrations: true,
          raider_ratings: true,
        },
      }),
    ]);

    // Add average rating per raider
    const formattedData = await Promise.all(
      data.map(async (raider) => {
        const avgRating = await this.prisma.rateRaider.aggregate({
          where: {
            raiderId: raider.id,
          },
          _avg: {
            rating_star: true,
          },
          _count: {
            id: true,
          },
        });

        return {
          ...raider,
          avgRating: avgRating._avg.rating_star
            ? Number(avgRating._avg.rating_star.toFixed(2))
            : 5,
          totalRatings: avgRating._count.id,
        };
      })
    );

    return {
      data: formattedData,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }


  // 
  async findOne(id: string) {
    const res = await this.prisma.raider.findUnique({
      where: { id: Number(id) },
      include: { registrations: true, locations: true, raider_ratings: true, followers: { where: { is_fav: true } }, },
    });
    // Get raider rating average
    const avgRating = await this.prisma.rateRaider.aggregate({
      where: {
        raiderId: res?.id
      },
      _avg: {
        rating_star: true
      },
      _count: {
        id: true
      }
    });

    const formattedAverage = avgRating._avg.rating_star
      ? Number(avgRating._avg.rating_star.toFixed(2))
      : 5;

    // 
    return {
      ...res,
      rank: res?.rank,
      rankScore: res?.rankScore || 0,
      rating: res?.reviews_count || 0,
      followers: res?.followers.length || 0,
      formattedAverage
    };
  }


  // 
  async verifyRiderProfile(id: number, verify: RaiderVerification) {

    const r = await this.prisma.raider.findUnique({
      where: { id: Number(id) }
    });

    if (!r) {
      throw new NotFoundException('Rider profile not found');
    }

    const registration = await this.prisma.raiderRegistration.findFirst({
      where: { raiderId: Number(id) },
    });

    if (!registration) {
      throw new NotFoundException('Rider registration not found for this rider');
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
      throw new NotFoundException('Rider profile not found');
    }
    console.log(raiderExists);
    // find the registration for this raider
    const registration = await this.prisma.raiderRegistration.findFirst({
      where: { raiderId: Number(raiderExists.id) },
    });
    console.log({ registration });
    if (!registration) {
      throw new NotFoundException('Rider registration not found for this rider');
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

    const res = await this.prisma.raider.findUnique({
      where: { id: Number(id) },
      include: { registrations: true },
    });
    if (!res) {
      throw new NotFoundException('Rider profile not found');
    }
    const updatedProfile = await this.prisma.raider.update({
      where: { id: res.id },
      data: {
        isSuspended: true,
        suspendedDuration: dto.suspendedDuration,
        suspensionReason: dto.suspensionReason,
      },
    });

    return updatedProfile;
  }
  // Unsuspend a rider profile
  async unsuspendRiderProfile(id: number) {

    const res = await this.prisma.raider.findUnique({
      where: { id: Number(id) },
      include: { registrations: true },
    });
    // console.log({ res });
    if (!res) {
      throw new NotFoundException('Rider profile not found');
    }

    const updatedProfile = await this.prisma.raider.update({
      where: { id: res.id },
      data: {
        isSuspended: false,
        suspendedDuration: null,
        suspensionReason: null,
      },
    });

    return updatedProfile;
  }


  //
  async adminCreateRiderProfile(dto: CreateRiderRegistrationDto) {
    // 1. Role check
    const role = await this.prisma.role.findUnique({
      where: { name: UserRole.RAIDER },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // 2. Duplicate user check
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.email_address },
          { phone: dto.contact_number },
        ],
      },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // 3. Transaction
    return this.prisma.$transaction(async (tx) => {
      const hashedPassword = await bcrypt.hash(dto.password || '12345678', 10);

      // Create user
      const user = await tx.user.create({
        data: {
          username: dto.raider_name,
          email: dto.email_address,
          phone: dto.contact_number,
          password: hashedPassword,
          regi_status: LoginType.ADMIN_SIGNIN,
          is_active: true,
          is_verified: true,
          roles: {
            connect: { id: role.id },
          },
        },
      });

      // Create raider
      const raider = await tx.raider.create({
        data: {
          userId: user.id,
          raider_status: RaiderStatus.ACTIVE,
          raider_verificationFromAdmin: RaiderVerification.APPROVED,
          rank:dto.driver_rank,
        },
      });

      // Clean DTO
      const { password, driver_rank, ...registrationData } = dto;

      // Create registration
      const registration = await tx.raiderRegistration.create({
        data: {
          ...registrationData,
          raiderId: raider.id,
        },
      });

      return { user, raider, registration };
    });
  }


  //
  async adminUpdateRiderProfile(id: number, dto: UpdateRidersProfileDto) {
    // 1. Check rider
    const raider = await this.prisma.raider.findUnique({
      where: { id },
    });

    if (!raider) {
      throw new NotFoundException('Rider not found');
    }

    // 2. Get registration
    const registration = await this.prisma.raiderRegistration.findFirst({
      where: { raiderId: raider.id },
    });

    if (!registration) {
      throw new NotFoundException('Rider profile not found');
    }

    // 3. Update
    return this.prisma.raiderRegistration.update({
      where: { id: registration.id },
      data: {
        ...dto,
      },
    });
  }

}