import { Controller, Delete, Get, Param } from '@nestjs/common';
import { ReferloyalityService } from './referloyality.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/decorators/auth.decorator';
import { Roles } from 'src/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiResponses } from 'src/common/apiResponse';

@ApiTags("Refer and loyality (only for user)")
@Controller('referloyality')
export class ReferloyalityController {
  constructor(private readonly referloyalityService: ReferloyalityService) {}

  // FIND ALL
  @Get()
  @Auth()
  @Roles(UserRole.USER, UserRole.SUPER_ADMIN) // TODO:need to correct the role
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all referrals' })
  async findAll() {
    try {
      const result = await this.referloyalityService.findAll();
      return ApiResponses.success(result, 'referrals retrieved successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to retrieve referrals');
    }
  }
  
  // find one
  @Get(":id")
  @Auth()
  @Roles(UserRole.USER, UserRole.SUPER_ADMIN) // TODO:need to correct the role
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get referral details' })
  async findOne(@Param("id") id:string) {
    try {
      const result = await this.referloyalityService.findOne(+id);
      return ApiResponses.success(result, 'referral retrieved successfully');
    } catch (err) {
      return ApiResponses.error(err, 'Failed to retrieve referral');
    }
  }


  @Delete(":id")
  @ApiOperation({ summary: 'Temporarry' })
  async delete(@Param("id") id:string){
       await this.referloyalityService.delete(+id)
  }

}
