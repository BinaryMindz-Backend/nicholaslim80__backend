/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import { Injectable, ConflictException, NotFoundException, BadRequestException, NotAcceptableException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import * as bcrypt from 'bcrypt';
import { OtpService } from 'src/modules/auth/otp.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ReferralUtils } from 'src/utils/referral.util';
import { CoinEvent, IUser } from 'src/types';
import { CoinHistoryType, LoginType, UserRole } from '@prisma/client';
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
          username: dto.username!,
          phone: dto.phone,
          password: hashed,
          referral_code: code,
          referral_link: link,
          is_acc_refered: dto.referral_code ? true : false,
          roles: {
            connect: {
              id: role.id,
            }
          }
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
        title: 'Welcome to Zipbee!',
        body: `Hello ${result.username ?? 'User'}, welcome to Zipbee!`,
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
        roles: true,
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
      include: {
        roles: true
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


  async findAllWebPortalUsers(filterDto: UserFilterDto) {
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

    const where: any = { regi_status: LoginType.ADMIN_SIGNIN };

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
      include: {
        roles: true,
      },
      orderBy: { [safeSortBy]: safeSortOrder },
    });
    // 
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
        is_deleted: u.is_deleted,
        role: u.roles?.map(r => r.name) ?? [],
        regi_status: u.regi_status
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

  // 

  async findAllOnlyUsers(filterDto: UserFilterDto) {
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

    const where: any = { roles: { some: { name: UserRole.USER } }, regi_status: LoginType.DIRECT_SIGNIN };

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
      include: {
        roles: true,
      },
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
        is_deleted: u.is_deleted,
        role: u.roles?.map(r => r.name) ?? [],
        regi_status: u.regi_status,
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
  //  find admin
  async findAllAdminUsers() {
    const user = await this.prisma.user.findFirst({
      where: { email: process.env.SUPER_ADMIN_EMAIL, roles: { some: { name: UserRole.ADMIN } }, regi_status: LoginType.ADMIN_SIGNIN },
      select: {
        id: true,
        username: true,
        roles: true
      }
    });
    return user;
  }



  // ** Get user by ID
  async findOneuser(id: number) {
    if (!id) throw new NotFoundException("User id not found")

    const res = await this.prisma.user.findUnique({
      where: { id, is_deleted: false },
      include: { raiderProfile: true, roles: true, adminProfiles: true }
    });

    // 
    if (!res) throw new NotFoundException("User not found");
    // 
    const basePoint = await this.prisma.coin.aggregate({
      _avg: { coin_value_in_cent: true, },
    });
    // 
    const basePriceIncent = Number((basePoint._avg.coin_value_in_cent ?? 0));
    const basePrice = basePriceIncent / 100

    // Initialize response object
    let responseData: any = {
      ...res,
    };

    // Check if user has RAIDER role
    const isRaider = res.roles?.map(r => r.name === 'RAIDER') || res.roles.map(r => r.name === 'raider');

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
        total_raiderRatings: avgRating._count.id || 0
      };
    }

    // Check if user has CUSTOMER/USER role (or get customer ratings for all users)
    const isCustomer = res.roles?.map(r => r.name === 'CUSTOMER') || res.roles?.map(r => r.name === 'USER') || res.roles?.map(r => r.name === 'customer') || res.roles?.map(r => r.name === 'user');

    if (isCustomer || !isRaider) {
      // Get customer rating average
      const useravgRating = await this.prisma.rateCustomer.aggregate({
        where: {
          user_id: id
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
        rewardMoney: basePrice * Number(res.reward_points) || 0,
      };
    }

    return responseData;
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
        profile: true,
        raiderProfile: {
          include: {
            registrations: true
          }
        },
        roles: true,
        adminProfiles: true,
      }
    });
    // 
    if (!res) throw new NotFoundException("User not found");
    // 
    const basePoint = await this.prisma.coin.aggregate({
      _avg: { coin_value_in_cent: true, },
    });
    // 
    const basePriceIncent = Number((basePoint._avg.coin_value_in_cent ?? 0));
    const basePrice = basePriceIncent / 100

    // Initialize response object
    let responseData: any = {
      ...res,
    };

    // Check if user has RAIDER role
    const isRaider = res.roles?.map(r => r.name === 'RAIDER') || res.roles?.map(r => r.name === 'raider');

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
        total_raiderRatings: avgRating._count.id || 0
      };
    }

    // Check if user has CUSTOMER/USER role (or get customer ratings for all users)
    const isCustomer = res.roles?.map(r => r.name === 'CUSTOMER') || res.roles?.map(r => r.name === 'USER') || res.roles?.map(r => r.name === 'customer') || res.roles?.map(r => r.name === 'user');

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
        rewardMoney: basePrice * Number(res.reward_points) || 0,
      };
    }

    return responseData;
  }




  // ** Get user by ID for admin
  async findDeletedOneuser(id: number) {
    if (!id) throw new NotFoundException("User id not found")

    return await this.prisma.user.findUnique({ where: { id } });
  }


  async updateUser(id: number, updateUserDto: UpdateUserDto) {
    if (!id) {
      throw new NotFoundException('User id not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { raiderProfile: true, profile: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 1. Destructure all profile-specific fields
    const {
      raider,
      dob,
      bank_account_num,
      bank_name,
      firstName,
      lastName,
      ...userData
    } = updateUserDto;

    return await this.prisma.user.update({
      where: { id },
      data: {
        ...userData, // Updates username, email, phone, etc. on the User model

        // 2. Nested Profile Update (Upsert logic)
        profile: {
          ...(user.profile
            ? {
              update: {
                firstName,
                lastName,
                bank_account_num,
                bank_name,
                avatarUrl: updateUserDto.image,
                ...(dob && { dob: new Date(dob) }),
              },
            }
            : {
              create: {
                firstName,
                lastName,
                bank_account_num,
                bank_name,
                avatarUrl: updateUserDto.image,
                ...(dob && { dob: new Date(dob) }),
              },
            }),
        },

        // 3. Nested Raider Profile Update
        ...(raider && {
          raiderProfile: user.raiderProfile
            ? { update: { rank: raider.rank } }
            : { create: { rank: raider.rank } },
        }),
      },
      include: {
        profile: true,
        raiderProfile: true
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



  // create user by admin
  async adminCreateUser(dto: CreateUserDto) {
    return this.prisma.$transaction(async (tx) => {

      //  Get existing roles
      let existingRoles = await tx.role.findMany({
        where: {
          name: {
            in: [...new Set(dto.custom_role_name)],
          },
        },
      });

      //  Determine missing role names
      const existingNames = new Set(existingRoles.map(r => r.name));
      const missingNames = [...new Set(dto.custom_role_name)].filter(
        name => !existingNames.has(name),
      );

      // Create missing roles
      if (missingNames.length > 0) {
        await tx.role.createMany({
          data: missingNames.map(name => ({ name })),
          skipDuplicates: true, // optional but safe
        });
      }

      // Re-fetch all roles (so you have Role[] for connecting)
      existingRoles = await tx.role.findMany({
        where: {
          name: {
            in: [...new Set(dto.custom_role_name)],
          },
        },
      });

      // Check existing user
      const userExists = await tx.user.findFirst({
        where: {
          OR: [
            { email: dto.email },
            { phone: dto.phone },
          ],
        },
      });

      if (userExists) {
        throw new ConflictException('User already exists');
      }

      //  Hash password
      const hashedPass = await bcrypt.hash(
        dto.password!,
        Number(process.env.SALT_ROUNDS ?? 10),
      );

      // Get signup coin
      const coin = await tx.coin.findFirst({
        where: { key: CoinEvent.FIRST_SIGNUP },
      });

      //  Create user + roles 
      const user = await tx.user.create({
        data: {
          username: dto.username!,
          email: dto.email,
          phone: dto.phone,
          password: hashedPass,
          image: dto.image,
          is_verified: true,
          is_active: true,
          regi_status: LoginType.ADMIN_SIGNIN,
          total_coin_acc: Number(coin?.coin_amount) || 0,
          current_coin_balance: Number(coin?.coin_amount) || 0,
          roles: {
            connect: existingRoles.map(r => ({ id: r.id })),
          },
        },
        include: {
          roles: true,
        },
      });

      // Coin history
      await tx.coinHistory.create({
        data: {
          userId: user.id,
          type: CoinHistoryType.ACCUMULATION,
          role_triggered: CoinEvent.FIRST_SIGNUP,
          coin_acc_amount: Number(coin?.coin_amount) || 0,
        },
      });

      // Admin profile
      const adminProfile = await tx.admin.create({
        data: {
          userId: user.id,
          first_name: dto.username,
          email: dto.email,
          phone_number: dto.phone,
          password: hashedPass,
          role_id: user.roles[0].id,
        },
      });

      return { user, adminProfile };
    });
  }

  async checkUsername(username: string) {
    const normalized = username.toLowerCase();

    const exactUser = await this.prisma.user.findUnique({
      where: { username: normalized },
    });

    // If exact username does NOT exist
    if (!exactUser) {
      return {
        available: true,
        suggestions: [],
      };
    }

    // Only generate suggestions if base exists
    const suggestions = await this.generateSequentialSuggestions(normalized);

    return {
      available: false,
      message: 'Username already exists',
      suggestions,
    };
  }

  //  generate username 
  private async generateSequentialSuggestions(base: string): Promise<string[]> {
    const MAX_SUGGESTIONS = 5;

    //  Fetch all similar usernames
    const similarUsers = await this.prisma.user.findMany({
      where: {
        username: {
          startsWith: base,
        },
      },
      select: { username: true },
    });

    /*
      Example DB result:
      [
        { username: "admin" },
        { username: "admin1" },
        { username: "admin2" },
        { username: "admin5" }
      ]
    */

    // Extract numeric suffixes
    const suffixNumbers: number[] = [];

    for (const user of similarUsers) {
      const match = user.username.match(
        new RegExp(`^${base}(\\d+)$`)
      );

      if (match) {
        suffixNumbers.push(parseInt(match[1], 10));
      }
    }

    /*
      suffixNumbers = [1, 2, 5]
    */

    // Determine next available numbers
    const suggestions: string[] = [];
    let counter = 1;

    while (suggestions.length < MAX_SUGGESTIONS) {
      if (!suffixNumbers.includes(counter)) {
        suggestions.push(`${base}${counter}`);
      }
      counter++;
    }

    /*
      Result:
      ["admin3", "admin4", "admin6", "admin7", "admin8"]
    */

    return suggestions;
  }


}
