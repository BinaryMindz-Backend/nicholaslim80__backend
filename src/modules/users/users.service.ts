/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-misused-promises */
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class UsersService {
    // 
    constructor(
           private readonly prisma:PrismaService
    ){}

    // ** created new user
  async createUser(createUserDto: CreateUserDto) {
        //  TODO(nodeNinjar) : Need to add user all type of validation
        const isUserExist = await this.prisma.user.findFirst({
          where: {
            email: createUserDto.email
          }
        })
        // console.log(isUserExist);
       if(isUserExist){
           throw new ConflictException("User Already exist")
       }
       
       const ceratedUser = this.prisma.user.create({
            data:createUserDto
         })

    return ceratedUser ;
  }

  // ** get all user by id
  async findAllUsers() {
      // 
    const users = await this.prisma.user.findMany({
          orderBy:{
              created_at:"desc"
          }
    });

    return users;
  }
  

  // ** find user by id
  async findOneuser(id: number) {
    if(!id){
       throw new NotFoundException("Id not found")
    }
    // 
    const user = await this.prisma.user.findUniqueOrThrow({
          where:{
              id
          }
      });
     
     return user 
       
  }
  
  // 
  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
