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
        raider_verificationFromAdmin: RaiderVerification.PENDING,
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
  // async verifyRiderProfile(id: number, verify: RaiderVerification, userId: number) {

  //   const r = await this.prisma.raider.findUnique({
  //     where: { id: Number(id) }
  //   });

  //   if (!r) {
  //     throw new NotFoundException('Rider profile not found');
  //   }

  //   const registration = await this.prisma.raiderRegistration.findFirst({
  //     where: { raiderId: Number(id) },
  //   });

  //   if (!registration) {
  //     throw new NotFoundException('Rider registration not found');
  //   }

  //   const before = {
  //     verification: r.raider_verificationFromAdmin,
  //     status: r.raider_status
  //   };

  //   let status: RaiderStatus = RaiderStatus.IN_ACTIVE;

  //   if (verify === RaiderVerification.APPROVED) {
  //     status = RaiderStatus.ACTIVE;
  //   }

  //   const updatedProfile = await this.prisma.raider.update({
  //     where: { id: r.id },
  //     data: {
  //       raider_verificationFromAdmin: verify,
  //       raider_status: status
  //     },
  //   });

  //   // LOG
  //   await this.prisma.activityLog.create({
  //     data: {
  //       action: 'UPDATE',
  //       entity_type: 'Raider',
  //       entity_id: r.id,
  //       user_id: userId,
  //       meta: {
  //         type: 'verify_rider',
  //         before,
  //         after: {
  //           verification: verify,
  //           status
  //         }
  //       },
  //     },
  //   });

  //   return updatedProfile;
  // }

  async verifyRiderProfile(id: number, verify: RaiderVerification, userId: number) {
  const raiderId = Number(id);

  const r = await this.prisma.raider.findUnique({ where: { id: raiderId } });
  if (!r) throw new NotFoundException('Rider profile not found');

  const registration = await this.prisma.raiderRegistration.findFirst({
    where: { raiderId }
  });
  if (!registration) throw new NotFoundException('Rider registration not found');

  const before = {
    verification: r.raider_verificationFromAdmin,
    status: r.raider_status
  };

  const status: RaiderStatus =
    verify === RaiderVerification.APPROVED ? RaiderStatus.ACTIVE : RaiderStatus.IN_ACTIVE;

  const updatedProfile = await this.prisma.raider.update({
    where: { id: raiderId },
    data: {
      raider_verificationFromAdmin: verify,
      raider_status: status
    },
  });

  // LOG (non-blocking)
  this.prisma.activityLog.create({
    data: {
      action: 'UPDATE',
      entity_type: 'Raider',
      entity_id: raiderId,
      user_id: userId,
      meta: {
        type: 'verify_rider',
        before,
        after: { verification: verify, status }
      },
    },
  }).catch(err => console.error('Activity log failed:', err));

  return updatedProfile;
}

  // 
  async update(id: number, dto: UpdateRidersProfileDto, userId: number) {

    const raider = await this.prisma.raider.findUnique({
      where: { userId: Number(id) },
    });

    if (!raider) {
      throw new NotFoundException('Rider profile not found');
    }

    const registration = await this.prisma.raiderRegistration.findFirst({
      where: { raiderId: raider.id },
    });

    if (!registration) {
      throw new NotFoundException('Rider registration not found');
    }

    const updated = await this.prisma.raiderRegistration.update({
      where: { id: registration.id },
      data: { ...dto },
    });

    // LOG
    await this.prisma.activityLog.create({
      data: {
        action: 'UPDATE',
        entity_type: 'Raider',
        entity_id: registration.id,
        user_id: userId,
        meta: {
          type: 'self_update',
          before: registration,
          after: updated,
        },
      },
    });

    return updated;
  }


  // 
  async remove(userId: number, adminId: number) {

    const record = await this.prisma.raider.findFirst({
      where: { userId }
    });

    if (!record) {
      throw new NotFoundException("User not found");
    }

    await this.prisma.raider.delete({
      where: { id: record.id },
    });

    // LOG
    await this.prisma.activityLog.create({
      data: {
        action: 'DELETE',
        entity_type: 'Raider',
        entity_id: record.id,
        user_id: adminId,
        meta: {
          type: 'delete_rider',
          userId,
        },
      },
    });

    return { message: "Rider deleted successfully" };
  }


  // 
  async suspendRiderProfile(id: number, dto: SuspendRiderProfileDto, userId: number) {

    const res = await this.prisma.raider.findUnique({
      where: { id: Number(id) },
    });

    if (!res) {
      throw new NotFoundException('Rider profile not found');
    }

    const updated = await this.prisma.raider.update({
      where: { id: res.id },
      data: {
        raider_status: RaiderStatus.IN_ACTIVE,
        isSuspended: true,
        suspendedDuration: dto.suspendedDuration,
        suspensionReason: dto.suspensionReason,
      },
    });

    // LOG
    await this.prisma.activityLog.create({
      data: {
        action: 'UPDATE',
        entity_type: 'Raider',
        entity_id: res.id,
        user_id: userId,
        meta: {
          type: 'suspend',
          reason: dto.suspensionReason,
          duration: dto.suspendedDuration,
        },
      },
    });

    return updated;
  }
  // Unsuspend a rider profile
  async unsuspendRiderProfile(id: number, userId: number) {

    const res = await this.prisma.raider.findUnique({
      where: { id: Number(id) },
    });

    if (!res) {
      throw new NotFoundException('Rider profile not found');
    }

    const updated = await this.prisma.raider.update({
      where: { id: res.id },
      data: {
        isSuspended: false,
        suspendedDuration: null,
        suspensionReason: null,
      },
    });

    // LOG
    await this.prisma.activityLog.create({
      data: {
        action: 'UPDATE',
        entity_type: 'Raider',
        entity_id: res.id,
        user_id: userId,
        meta: {
          type: 'unsuspend',
        },
      },
    });

    return updated;
  }


  //
  async adminCreateRiderProfile(dto: CreateRiderRegistrationDto, userId: number) {
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
          rank: dto.driver_rank,
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
      await tx.activityLog.create({
        data: {
          action: 'CREATE',
          entity_type: 'Raider',
          entity_id: raider.id,
          user_id: userId,
          meta: {
            type: 'admin_create_rider',
            user: {
              id: user.id,
              email: user.email,
            },
          },
        },
      });
      return { user, raider, registration };
    });
  }


  //
  async adminUpdateRiderProfile(id: number, dto: UpdateRidersProfileDto, userId: number) {

    const raider = await this.prisma.raider.findUnique({
      where: { id },
    });

    if (!raider) {
      throw new NotFoundException('Rider not found');
    }
    //  
    if (dto.driver_rank) {
      await this.prisma.raider.update({
        where: { id: raider.id },
        data: {
          rank: dto.driver_rank,
        },
      });
    }
    const registration = await this.prisma.raiderRegistration.findFirst({
      where: { raiderId: raider.id },
    });

    if (!registration) {
      throw new NotFoundException('Rider profile not found');
    }

    const { vehicle_type_id, driver_rank, password, ...rest } = dto as any;

    const updated = await this.prisma.raiderRegistration.update({
      where: { id: registration.id },
      data: {
        ...rest,
        ...(vehicle_type_id && {
          vehicle_type: {
            connect: { id: vehicle_type_id },
          },
        }),
      },
    });

    // LOG
    await this.prisma.activityLog.create({
      data: {
        action: 'UPDATE',
        entity_type: 'Raider',
        entity_id: registration.id,
        user_id: userId,
        meta: {
          type: 'admin_update',
          before: registration,
          after: { ...updated, vehicle_type_id, driver_rank },
        },
      },
    });

    return { ...updated, vehicle_type_id, driver_rank };
  }

}