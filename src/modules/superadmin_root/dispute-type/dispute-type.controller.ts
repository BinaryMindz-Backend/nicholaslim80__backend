import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { DisputeTypeService } from "./dispute-type.service";
import { ApiResponses } from "src/common/apiResponse";
import { CreateDisputeTypeDto } from "./dto/create-dispute-type.dto";
import { UpdateDisputeTypeDto } from "./dto/update-dispute-type.dto";
import { Auth } from "src/decorators/auth.decorator";
import { JwtAuthGuard } from "src/guards/jwt.guard";

@ApiTags('Admin - Dispute Type')
@UseGuards(JwtAuthGuard)
@Controller('admin/dispute-types')
export class DisputeTypeController {
  constructor(private readonly service: DisputeTypeService) {}

  @Post()
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create dispute type' })
  async create(@Body() dto: CreateDisputeTypeDto) {
    const res = await this.service.create(dto);
    return ApiResponses.success(res, 'Dispute type created');
  }

  @Get()
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all dispute types' })
  async findAll() {
    const res = await this.service.findAll();
    return ApiResponses.success(res);
  }

  @Get(':role')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get dispute types by role (USER / DRIVER)' })
  async findByRole(@Param('role') role: 'USER' | 'DRIVER') {
    const res = await this.service.findByRole(role);
    return ApiResponses.success(res);
  }

  @Patch(':id')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update dispute type' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDisputeTypeDto
  ) {
    const res = await this.service.update(id, dto);
    return ApiResponses.success(res, 'Updated successfully');
  }

  @Delete(':id')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete dispute type' })
  async remove(@Param('id') id: string) {
    const res = await this.service.remove(id);
    return ApiResponses.success(res, 'Removed successfully');
  }
}
