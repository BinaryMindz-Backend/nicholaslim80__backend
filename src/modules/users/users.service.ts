import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';



// 
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // ** Create new user
  async createUser(createUserDto: CreateUserDto) {
    const { password, ...restDto } = createUserDto;

    const existingUser = await this.prisma.user.findFirst({
      where: { email: createUserDto.email },
    });
    if (existingUser) throw new ConflictException('User already exists');

    if (!password) throw new NotFoundException('Password is required');
    const saltRounds = Number(process.env.SALT_ROUNDS ?? 10);
    if (isNaN(saltRounds) || saltRounds <= 0) throw new NotFoundException('Invalid salt rounds');

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    return this.prisma.user.create({
      data: {
        ...restDto,
        password: hashedPassword,
      },
    });
  }

  // ** Get all users
    async findAllUsers() {
      return this.prisma.user.findMany({
        where: { is_deleted: false }, // only active users
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
async removeUser(id: number) {
    if(!id) throw new NotFoundException("User id not found")
  const user = await this.prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundException('User not found');

  // Soft delete
  return this.prisma.user.update({
    where: { id },
    data: { is_deleted: true, status: false },
  });
}

  // **TODO: Add token verification, auth, and other security methods
}
