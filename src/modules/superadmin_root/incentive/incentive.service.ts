import { ConflictException, Injectable, NotFoundException} from '@nestjs/common';
import { CreateIncentiveDto } from './dto/create-incentive.dto';
import { UpdateIncentiveDto } from './dto/update-incentive.dto';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class IncentiveService {
   
  constructor(private readonly prisma:PrismaService){}
  
  // 
  async create(dto: CreateIncentiveDto) {
        // 
    const record = await this.prisma.incentive.findFirst({
        where:{
          OR:[
             {start_date:dto.start_date},
             { end_date:dto.end_date}
          ]
        }
    })
    
    if(record){ 
        throw new ConflictException("Incentive record not found")
    }
    
    // 
    const res = await this.prisma.incentive.create({
         data:dto
    })
    return res
  }
   
  // 
  async findAll() {
     const res = await this.prisma.incentive.findMany({})
    return res;
  }
   
  // 
  async findOne(id: number) {
    // 
    const res  = await this.prisma.incentive.findFirst({
         where:{
            id
         }
    })
    return res;
  }

  async update(id: number, updateIncentiveDto: UpdateIncentiveDto) {
         // 
    const rec  = await this.prisma.incentive.findFirst({
         where:{
            id
         }
    })
    // 
    if(!rec) throw new NotFoundException("Incentive not found")
    
    // 
    const updateIncentive = await this.prisma.incentive.update({
         where:{
           id
         },
         data:updateIncentiveDto,
    })
    // 
    return updateIncentive;
  }
  // ** status update
  async statusUpdate(id: number, dto: UpdateIncentiveDto) {
         // 
    const rec  = await this.prisma.incentive.findFirst({
         where:{
            id
         }
    })
    // 
    if(!rec) throw new NotFoundException("Incentive not found")
      // 
    if(rec.status === dto.status) throw new NotFoundException("Incentive status is up to date")

    
    // 
    const updateIncentive = await this.prisma.incentive.update({
         where:{
           id
         },
         data:{
            status:dto.status
         },
    })
    // 
    return updateIncentive;
  }



  // /
  async remove(id: number) {
              // 
    const rec  = await this.prisma.incentive.findFirst({
         where:{
            id
         }
    })
    // 
    if(!rec) throw new NotFoundException("Incentive not found");

    
       return await this.prisma.incentive.delete({
        where:{
            id
        }
    })


  }
}
