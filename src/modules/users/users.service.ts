import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { OtpService } from '../auth/otp.service';




// 
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService,
              private readonly otpService: OtpService,

      ) {}


  // ** Create new user // signup with otp verify
  async createUser(dto: { email?: string; password?: string; username?: string; phone: string }) {
    //  
    const existing = await this.prisma.user.findFirst({ where: {OR:[
            { email: dto.email },
            {phone:dto.phone}
    ]} });

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
              },
            });
    
    // pass to otp verify method
    await this.otpService.generateOtp(user.email ,user.phone);      

    return user;
  }
  


  // 
async findByEmailOrPhone(email?: string, phone?: string) {
  // 
  return this.prisma.user.findFirst({
    where: { OR: [
        {email},
        {phone}
    ] },
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
        where: { is_deleted: false,is_verified:true }, // only active users
        orderBy: { created_at: 'desc' },
      });
    }


  // ** Get all users
    async findAllUsers() {
      return this.prisma.user.findMany({
        orderBy: { created_at: 'desc' },
      });
    }


  // ** Get user by ID
  async findOneuser(id: number) {
    if(!id) throw new NotFoundException("User id not found")

    return this.prisma.user.findUnique({ where: { id , is_deleted:false} });
  }


    // ** Get user by ID for admin
  async findDeletedOneuser(id: number) {
      if(!id) throw new NotFoundException("User id not found")

    return this.prisma.user.findUnique({ where: { id } });
  }



  // ** Update user
  async updateUser(id: number, updateUserDto: UpdateUserDto) {
      if(!id) throw new NotFoundException("User id not found")

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  // ** Soft delete user
async softDeleteMultiple(ids: number[]) {
  if (!ids || ids.length === 0) {
    throw new BadRequestException("No user IDs provided");
  }
    // 
    const users = await this.prisma.user.findMany({
      where:{id:{in:ids}}
    })

  if (users.length === 0) {
    throw new NotFoundException("No users found for given IDs");
  }
  // 
  return this.prisma.user.updateMany({
    where: { id: { in: ids } },
    data: {
      is_deleted: true,
      status: false,
      is_verified:false,
      refresh_token:null,
    },
  });
}



// permanent remove user
async deleteMultiple(ids: number[]) {
  if (!ids || ids.length === 0) {
    throw new BadRequestException("No user IDs provided");
  }

  const users = await this.prisma.user.findMany({
      where:{id:{in:ids}}
  })

  if (users.length === 0) {
    throw new NotFoundException("No users found for given IDs");
  }

  return this.prisma.user.deleteMany({
    where: { id: { in: ids } },
  });
}



}
