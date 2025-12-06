import { Injectable, ConflictException, NotFoundException, BadRequestException, NotAcceptableException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import * as bcrypt from 'bcrypt';
import { OtpService } from 'src/modules/auth/otp.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ReferralUtils } from 'src/utils/referral.util';
import { IUser } from 'src/types';
import { UserRole } from '@prisma/client';
import { UserFilterDto, UserStatusFilter } from './dto/user-filter.dto';

// 
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService,
    private readonly otpService: OtpService,

  ) { }


  // ** Create new user // signup with otp verify
  async createUser(dto: { email?: string; password?: string; username?: string; phone: string, referral_code?: string, role?: UserRole }) {

    if (dto.role === UserRole.SUPER_ADMIN) {
      throw new NotAcceptableException("You can't create superadmin or admin by general login")
    }

    let referredByUser;

    if (dto.referral_code) {
      referredByUser = await this.prisma.user.findUnique({
        where: {
          referral_code: dto.referral_code
        }
      })
      // 
      if (!referredByUser) {
        throw new BadRequestException('Invalid referral code');
      }
      // 

    }
    // generate referral code and link
    const { code, link } = ReferralUtils.generateReferral(process.env.BASE_URL as string);
    //  
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.email },
          { phone: dto.phone }
        ]
      }
    });
    if (existing) throw new ConflictException('User already exists');
    // 
    let hashed: string | undefined = undefined;
    if (dto.password) {
      const salt = Number(process.env.SALT_ROUNDS ?? 10);
      hashed = await bcrypt.hash(dto.password, salt);
    }
    // 
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        phone: dto.phone,
        password: hashed,
        referral_code: code,
        referral_link: link,
        is_acc_refered: dto.referral_code ? true : false,
        role: dto.role
      },
    });


    if (dto.referral_code) {

      // if the user created by refer
      await this.prisma.refer.create({
        data: {
          refer_code: dto.referral_code,
          user_id: user.id
        }
      })
    }
    // if the user role is raider 
    if (user.role === UserRole.RAIDER) {
      await this.prisma.raider.create({
        data: {
          userId: user.id,
        }
      });
    }

    // pass to otp verify method
   const otp = await this.otpService.generateOtp(user.email, user.phone);
    // TODO:For Dev
    return {
      otp
    };
  }




  // 
  async findByEmailOrPhone(email?: string, phone?: string) {
    // 
    return await this.prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phone }
        ]
      },
    });
  }

  // 

  async updateUserRefreshToken(userId: number, token: string | null) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { refresh_token: token },
    });
  }




  // ** Get all users
  async findAllActiveUsers() {
    return this.prisma.user.findMany({
      where: { is_deleted: false, is_verified: true , role:UserRole.USER}, // only active users
      orderBy: { created_at: 'desc' },
    });
  }


  
  // 
  async findAllUsers(filterDto: UserFilterDto) {
  const {
    page = 1,
    limit = 10,
    status
  } = filterDto;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  // ---- Build WHERE filter ----
const where: any = {};

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
          break; // no filter
      }
    }


  // ---- Pagination + filtered users ----
  const users = await this.prisma.user.findMany({
    where,
    skip,
    take,
    orderBy: { created_at: 'desc' },
  });

  const userIds = users.map(u => u.id);

  // ---- Aggregation from orders ----
  const aggregated = await this.prisma.order.groupBy({
    by: ['userId'],
    where: {
      userId: { in: userIds }
    },
    _count: { id: true },
    _sum: { total_cost: true }
  });

  // ---- Build final result ----
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

    return this.prisma.user.findUnique({ where: { id, is_deleted: false } });
  }

  // ** Get user by user id
  async findMe(user: IUser) {
    if (!user.id) throw new NotFoundException("User id not found")
    return this.prisma.user.findFirst({ where: { id: Number(user.id), is_deleted: false }, include:{raiderProfile:true} });
  }




  // ** Get user by ID for admin
  async findDeletedOneuser(id: number) {
    if (!id) throw new NotFoundException("User id not found")

    return this.prisma.user.findUnique({ where: { id } });
  }



  // ** Update user
  async updateUser(id: number, updateUserDto: UpdateUserDto) {
    if (!id) throw new NotFoundException("User id not found")

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }


    // ** Update user active status
  async activeStatusChange(id: number) {
    if (!id) throw new NotFoundException("User id not found")

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id },
      data: {is_active:true}
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


  // ** add wallet
  async addMoneyToWallet(id: number, amount: number) {

    if (!id) {
      throw new NotFoundException("id not found")
    }

    const currentUser = await this.prisma.user.findUnique({
      where: {
        id
      }
    })

    if (!currentUser) {
      throw new NotFoundException("User not found")
    }

    if (currentUser.is_verified === false || currentUser.is_active === false) {
      throw new NotAcceptableException("For top-up/deposit user need to be verified through email/phone")
    }

    const currentBalance = (currentUser.balance)
    const newBalance = currentBalance + (amount * 100);  // amount in cent
    // 
    if (amount < 20) {
      throw new NotAcceptableException(`This ${amount} is not acceptable you need minimun 20 USD to added to wallet`)
    }
    // 
    const updatedWallet = await this.prisma.user.update({
      //  
      where: {
        id
      },
      data: {
        balance: newBalance,
      }
    })
    // TODO : need to add transaction 
    return updatedWallet;
  }



}
