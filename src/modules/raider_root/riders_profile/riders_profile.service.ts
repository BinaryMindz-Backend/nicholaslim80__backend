/* eslint-disable @typescript-eslint/no-unused-vars */
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateRidersProfileDto } from './dto/create-riders_profile.dto';
import { UpdateRidersProfileDto } from './dto/update-riders_profile.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import { LoginType, Prisma, RaiderStatus, RaiderVerification, UserRole, VehicleTypeEnum } from '@prisma/client';
import { ApiResponses } from 'src/common/apiResponse';
import { GetRidersQueryDto } from './dto/query-riders.dto';
import { SuspendRiderProfileDto } from './dto/suspendRider.dto';
import bcrypt from "bcrypt"
import { contains } from 'class-validator';


// 
@Injectable()
export class RidersProfileService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  // create
  async create(userId: number, createRidersProfileDto: CreateRidersProfileDto) {

     const keys = Object.values(VehicleTypeEnum).filter(value=> typeof value === 'string')
     const isAvailable  = keys.includes(createRidersProfileDto.vehicle_type) 
     if(!isAvailable){
        throw new NotFoundException("Vechicle type not found")
     }
    // 
    const riderExists = await this.prisma.raider.findFirst({
      where: {
        userId: userId,
      },
    });
    //  
    if (!riderExists) {
      throw new NotFoundException('Rider not found for the given user ID');
    }
    // 
    const r = await this.prisma.raiderRegistration.findFirst({
         where:{
             email_address:createRidersProfileDto.email_address
         }
    })
    // 
    if(r){
        throw new ConflictException("Raider profile already exist")
    }
    const {password, ...dto} = createRidersProfileDto;

    const res = await this.prisma.raiderRegistration.create({
      data: {
        raiderId: riderExists.id,
        ...dto,
      },
    });
    return res;
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
              : 0,
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
      include: { registrations: true, locations:true, raider_ratings:true,  followers: { where: { is_fav: true } }, },
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
        : 0;

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
    console.log(dto);
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
    async adminCreateRiderProfile(dto: CreateRidersProfileDto) {
      // Ensure role exists
      const role = await this.prisma.role.findUnique({
        where: { name: UserRole.RAIDER },
      });

      if (!role) {
        throw new NotFoundException('Role not found');
      }

      // Check if user already exists
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

      // Transaction
      const createdRaider = await this.prisma.$transaction(async (tx) => {
        const defaultPassword = dto.password;

        if (!defaultPassword) {
          throw new NotFoundException(
            'Default password is not set in environment variables',
          );
        }

        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        // Create user
        const user = await tx.user.create({
          data: {
            username: dto.raider_name,
            email: dto.email_address,
            phone: dto.contact_number,
            roles:{
              connect:{id:role.id}
            },
            regi_status: LoginType.ADMIN_SIGNIN,
            is_active: true,
            is_verified: true,
            password: hashedPassword,
          },
        });

        // Create raider
        const raider = await tx.raider.create({
          data: {
            userId: user.id,
            LoginType: LoginType.ADMIN_SIGNIN,
            raider_verificationFromAdmin: RaiderVerification.APPROVED,
            raider_status: RaiderStatus.ACTIVE,
          },
        });
        
        // 
        const {password , ...registrationData } = dto;
        // Create raider registration
        const registration = await tx.raiderRegistration.create({
          data: {
            ...registrationData,
            raiderId: raider.id,
          },
        });

        return {
          user,
          raider,
          registration,
        };
      });

      return createdRaider;
    }


  //
  async adminUpdateRiderProfile(id: number, updateRidersProfileDto: UpdateRidersProfileDto) {
    const raiderExists = await this.prisma.raider.findFirst({
      where: {
        id: Number(id)
      },
    });
    // console.log({ raiderExists });
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