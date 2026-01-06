/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import { Injectable, ConflictException, NotFoundException, BadRequestException, NotAcceptableException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import * as bcrypt from 'bcrypt';
import { OtpService } from 'src/modules/auth/otp.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ReferralUtils } from 'src/utils/referral.util';
import { CoinEvent, IUser } from 'src/types';
import { CoinHistoryType, LoginType,  UserRole } from '@prisma/client';
import { UserFilterDto, UserStatusFilter } from './dto/user-filter.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { startOfDay, endOfDay, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { CoinUtils } from 'src/utils/coin.utils';
import { EmailQueueService } from 'src/modules/queue/services/email-queue.service';

// 
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService,
    private readonly otpService: OtpService,
    private readonly emailQueueService: EmailQueueService,

  ) { }


  // ** Create new user // signup with otp verify
 async createUser(dto: { 
      email?: string; 
      password?: string; 
      username?: string; 
      phone: string, 
      referral_code?: string, 
      role_name: string 
    }) {
      // Pre-transaction validations (same as before)
      if (dto.role_name === UserRole.SUPER_ADMIN) {
        throw new NotAcceptableException("You can't create superadmin or admin by general login");
      }

      const role = await this.prisma.role.findFirst({
        where: { name: dto.role_name }
      });

      if (!role) {
        throw new NotFoundException("Role not found");
      }

      let referredByUser;
      if (dto.referral_code) {
        referredByUser = await this.prisma.user.findUnique({
          where: { referral_code: dto.referral_code }
        });

        if (!referredByUser) {
          throw new BadRequestException('Invalid referral code');
        }
      }

      const existing = await this.prisma.user.findFirst({
        where: {
          OR: [
            { email: dto.email },
            { phone: dto.phone }
          ]
        }
      });

      if (existing) {
        throw new ConflictException('User already exists');
      }

      let hashed: string | undefined = undefined;
      if (dto.password) {
        const salt = Number(process.env.SALT_ROUNDS ?? 10);
        hashed = await bcrypt.hash(dto.password, salt);
      }

      const { code, link } = ReferralUtils.generateReferral(process.env.BASE_URL as string);

      const coin = await this.prisma.coin.findFirst({
        where: { key: CoinEvent.FIRST_SIGNUP }
      });

      // Transaction
      const result = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: dto.email,
            username: dto.username,
            phone: dto.phone,
            password: hashed,
            referral_code: code,
            referral_link: link,
            is_acc_refered: dto.referral_code ? true : false,
            roleId: role.id,
          },
        });

        const coinUtils = new CoinUtils(tx as any);
        await coinUtils.earnCoin(
          user.id, 
          coin ? Number(coin.coin_amount) : 0, 
          CoinEvent.FIRST_SIGNUP
        );

        if (dto.referral_code) {
          await tx.refer.create({
            data: {
              refer_code: dto.referral_code,
              user_id: user.id
            }
          });
        }

        if (role.name === UserRole.RAIDER) {
          await tx.raider.create({
            data: { userId: user.id }
          });
        }

        return user;
      });

      // Generate OTP
      const otp = await this.otpService.generateOtp(result.email, result.phone);
            // Queue welcome email
        if (result.email) {
          await this.emailQueueService.queueWelcomeEmail({
            userId: result.id,
            email: result.email,
            username: result.username ?? undefined,
            referralCode: result.referral_code ?? undefined,
          });
        }

        // Queue push notification
        if (result.fcmToken) {
          await this.emailQueueService.queuePushNotification({
            userId: result.id,
            fcmToken: result.fcmToken,
            title: 'Welcome to NodeNINJAr!',
            body: `Hello ${result.username ?? 'User'}, welcome!`,
          });
        }

        return { otp };

  }

  // 
  async findByEmailOrPhone(email?: string, phone?: string) {
    // 
   const res = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phone }
        ]
      },
      include: {
        role: true,
      }
    });
    return res
  }

  // 

  async updateUserRefreshToken(userId: number, token: string | null) {
    return await this.prisma.user.update({
      where: { id: userId },
      data: { refresh_token: token },
    });
  }




  // ** Get all users
  async findAllActiveUsers() {
    return await this.prisma.user.findMany({
      where: { is_deleted: false },
      orderBy: { created_at: 'desc' },
      include:{
          role:true
      }
    });
  }



  // 
  async findAllUsers(filterDto: UserFilterDto) {
    const {
      page = 1,
      limit = 10,
      status,
      sortBy = 'created_at',
      sortOrder = 'desc',
      dateFilter
    } = filterDto;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {};

    // ==========================
    if (status) {
      switch (status) {
        case UserStatusFilter.ACTIVE:
          where.is_active = true;
          break;
        case UserStatusFilter.VERIFIED:
          where.is_verified = true;
          break;
        case UserStatusFilter.DELETED:
          where.is_deleted = true;
          break;
        case UserStatusFilter.ALL:
          break;
      }
    }

    // DATE FILTER

    if (dateFilter) {
      const now = new Date();

      switch (dateFilter) {
        case 'today':
          where.created_at = {
            gte: startOfDay(now),
            lte: endOfDay(now),
          };
          break;

        case 'yesterday': {
          const yStart = startOfDay(subDays(now, 1));
          const yEnd = endOfDay(subDays(now, 1));
          where.created_at = {
            gte: yStart,
            lte: yEnd,
          };
          break;
        }

        case 'last_7_days':
          where.created_at = {
            gte: subDays(now, 7),
          };
          break;

        case 'last_30_days':
          where.created_at = {
            gte: subDays(now, 30),
          };
          break;

        case 'last_month': {
          const firstDayPrevMonth = startOfMonth(subMonths(now, 1));
          const lastDayPrevMonth = endOfMonth(subMonths(now, 1));
          where.created_at = {
            gte: firstDayPrevMonth,
            lte: lastDayPrevMonth,
          };
          break;
        }
      }
    }

    // SAFE SORTING
    const allowedSortFields = [
      'created_at',
      'username',
      'email',
      'phone',
      'is_active',
      'is_verified'
    ];

    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const safeSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

    // FETCH USERS

    const users = await this.prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { [safeSortBy]: safeSortOrder },
    });

    const userIds = users.map(u => u.id);

    // AGGREGATION

    const aggregated = await this.prisma.order.groupBy({
      by: ['userId'],
      where: {
        userId: { in: userIds }
      },
      _count: { id: true },
      _sum: { total_cost: true }
    });

    const result = users.map(u => {
      const stat = aggregated.find(a => a.userId === u.id);
      return {
        id: u.id,
        name: u.username,
        contactNum: u.phone,
        contactEmail: u.email,
        totalOrders: stat?._count?.id ?? 0,
        totalCost: stat?._sum?.total_cost ?? 0,
        joiningDate: u.created_at,
        activeStatus: u.is_active,
        is_verified: u.is_verified,
        is_deleted: u.is_deleted
      };
    });

    const total = await this.prisma.user.count({ where });

    return {
      page: Number(page),
      limit: Number(limit),
      total,
      data: result
    };
  }





  // ** Get user by ID
    async findOneuser(id: number) {
      if (!id) throw new NotFoundException("User id not found")

      return await this.prisma.user.findUnique({ where: { id, is_deleted: false }, include: { raiderProfile: true, role: true, adminProfiles: true } });
    }

    // ** Get user by user id
    async findMe(user: IUser) {
    if (!user.id) throw new NotFoundException("User id not found");

    // Fetch user data
    const res = await this.prisma.user.findFirst({
      where: { 
        id: Number(user.id), 
        is_deleted: false 
      },
      include: {
        raiderProfile:{
             include:{
                registrations:true
             }
        },
        role: true,
        adminProfiles: true,
      }
    });
    // 
    if (!res) throw new NotFoundException("User not found");
    // 
    const basePoint = await this.prisma.coin.aggregate({
      _avg: { coin_value_in_cent: true,},
    });
    // 
    const basePrice = Number(basePoint._avg.coin_value_in_cent ?? 0 / 100);


    // Initialize response object
    let responseData: any = {
      ...res,
    };

    // Check if user has RAIDER role
    const isRaider = res.role?.name === 'RAIDER' || res.role?.name === 'raider';
    
    if (isRaider && res.raiderProfile?.id) {
      // Get follower count for raider
      const follower = await this.prisma.myRaider.count({
        where: {
          raiderId: res.raiderProfile.id
        }
      });

      // Get raider rating average
      const avgRating = await this.prisma.rateRaider.aggregate({
        where: {
          raiderId: res.raiderProfile.id
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

      responseData = {
        ...responseData,
        follower: follower || 0,
        avg_raiderRating: formattedAverage,
        total_raiderRatings: avgRating._count.id || 0,
        rewardMoney:basePrice * res.reward_points,
      };
    }

    // Check if user has CUSTOMER/USER role (or get customer ratings for all users)
    const isCustomer = res.role?.name === 'CUSTOMER' || res.role?.name === 'USER' || res.role?.name === 'customer' || res.role?.name === 'user';
    
    if (isCustomer || !isRaider) {
      // Get customer rating average
      const useravgRating = await this.prisma.rateCustomer.aggregate({
        where: {
          user_id: user.id
        },
        _avg: {
          rating_star: true
        },
        _count: {
          id: true
        }
      });

      const formattedAverageUser = useravgRating._avg.rating_star 
        ? Number(useravgRating._avg.rating_star.toFixed(2)) 
        : 0;

      responseData = {
        ...responseData,
        avg_customerRating: formattedAverageUser,
        total_customerRatings: useravgRating._count.id || 0,
      };
    }

    return responseData;
  }




  // ** Get user by ID for admin
  async findDeletedOneuser(id: number) {
    if (!id) throw new NotFoundException("User id not found")

    return await this.prisma.user.findUnique({ where: { id } });
  }



  // ** Update user
async updateUser(id: number, updateUserDto: UpdateUserDto) {
  if (!id) {
    throw new NotFoundException('User id not found');
  }

  const user = await this.prisma.user.findUnique({
    where: { id },
    include: { raiderProfile: true },
  });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  const { raider, ...userData } = updateUserDto;

  return await this.prisma.user.update({
    where: { id },
    data: {
      ...userData,

      ...(raider && {
        raiderProfile: user.raiderProfile
          ? {
              update: {
                rank: raider.rank,
              },
            }
          : {
              create: {
                rank: raider.rank,
              },
            },
      }),
    },
    include:{
       raiderProfile:true
    }
  });
}



  // ** Update user active status
  async activeStatusChange(id: number) {
    if (!id) throw new NotFoundException("User id not found")

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    // 
    let is_active = true
    if (user.is_active === true) {
      is_active = false
    }

    // 
    return this.prisma.user.update({
      where: { id },
      data: { is_active }
    });
  }



  // ** Soft delete user
  async softDeleteMultiple(ids: number[]) {
    if (!ids || ids.length === 0) {
      throw new BadRequestException("No user IDs provided");
    }
    // 
    const users = await this.prisma.user.findMany({
      where: { id: { in: ids } }
    })

    if (users.length === 0) {
      throw new NotFoundException("No users found for given IDs");
    }
    // 
    return this.prisma.user.updateMany({
      where: { id: { in: ids } },
      data: {
        is_deleted: true,
        is_active: false,
        is_verified: false,
        refresh_token: null,
      },
    });
  }



  // permanent remove user
  async deleteMultiple(ids: number[]) {
    if (!ids || ids.length === 0) {
      throw new BadRequestException("No user IDs provided");
    }

    const users = await this.prisma.user.findMany({
      where: { id: { in: ids } }
    })

    if (users.length === 0) {
      throw new NotFoundException("No users found for given IDs");
    }

    return this.prisma.user.deleteMany({
      where: { id: { in: ids } },
    });
  }


  // ** add wallet //DEPRECATED
  // async addMoneyToWallet(id: number, amount: number) {

  //   if (!id) {
  //     throw new NotFoundException("id not found")
  //   }

  //   const currentUser = await this.prisma.user.findUnique({
  //     where: {
  //       id
  //     }
  //   })

  //   if (!currentUser) {
  //     throw new NotFoundException("User not found")
  //   }

  //   if (currentUser.is_verified === false || currentUser.is_active === false) {
  //     throw new NotAcceptableException("For top-up/deposit user need to be verified through email/phone")
  //   }

  //   const currentBalance = (currentUser.balance)
  //   const newBalance = currentBalance + (amount * 100);  // amount in cent
  //   // 
  //   if (amount < 20) {
  //     throw new NotAcceptableException(`This ${amount} is not acceptable you need minimun 20 USD to added to wallet`)
  //   }
  //   // 
  //   const updatedWallet = await this.prisma.user.update({
  //     //  
  //     where: {
  //       id
  //     },
  //     data: {
  //       balance: newBalance,
  //     }
  //   })
  //   // TODO : need to add transaction 
  //   return updatedWallet;
  // }


  // create user by admin
  async adminCreateUser(dto: CreateUserDto) {

    //  
    const res = await this.prisma.$transaction(async (tx) => {
      // 
      let role = await tx.role.findFirst({
        where: {
          name: dto.role_name
        }
      })
      // 
      if (!role) {
        role = await tx.role.create({
          data: {
            name: dto.role_name!
          }
        })
      }
      // 
      const hasedPass = await bcrypt.hash(dto.password!, Number(process.env.SALT_ROUNDS ?? 10));
      // 
      const userExists = await tx.user.findFirst({
        where: {
          OR: [
            { email: dto.email },
            { phone: dto.phone }
          ]
        },
      });

      // 
      if (userExists) {
        throw new ConflictException("User already exist")
      }

      //
      const coin = await tx.coin.findFirst({
        where: {
          key: CoinEvent.FIRST_SIGNUP
        }
      })
      // 
      const user = await tx.user.create({
        data: {
          username: dto.username,
          email: dto.email,
          roleId: role.id,
          phone: dto.phone,
          is_verified: true,
          is_active: true,
          regi_status: LoginType.ADMIN_SIGNIN,
          password: hasedPass,
          image: dto.image,
          total_coin_acc: Number(coin?.coin_amount) || 0,
          current_coin_balance: Number(coin?.coin_amount) || 0,
        },
        include: {
          role: true
        }
      });

      //
      // 
      await tx.coinHistory.create({
        data: {
          userId: user.id,
          type: CoinHistoryType.ACCUMULATION,
          role_triggered:CoinEvent.FIRST_SIGNUP,
          coin_acc_amount: Number(coin?.coin_amount) || 0,
        }
      })

      const adminProfile = await tx.admin.create({
        data: {
          userId: user.id,
          first_name: dto.username,
          email: dto.email,
          phone_number: dto.phone,
          password: hasedPass,
          role_id: role.id,

        }
      })
      return {
        user,
        adminProfile
      };
    })

    return res;
  }
  // 



}
