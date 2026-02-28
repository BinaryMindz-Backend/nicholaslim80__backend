import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiBearerAuth,
  ApiTags
} from '@nestjs/swagger';
import { PolicyService } from './policy_management.service';
import { Auth } from 'src/decorators/auth.decorator';
import { CreatePolicyDto } from './dto/create-policy_management.dto';
import { ApiResponses } from 'src/common/apiResponse';
import { UpdatePolicyDto } from './dto/update-policy_management.dto';
import { RequirePermission } from 'src/rbac/decorators/require-permission.decorator';
import { Module, Permission } from 'src/rbac/rbac.constants';


@ApiTags('Policy management')
@Controller('policy')
export class PolicyController {
  constructor(private policyService: PolicyService) { }

  // CREATE
  @Post()
  @Auth()
  @RequirePermission(Module.POLICIES, Permission.CREATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new policy (Admin only)' })
  async create(@Body() dto: CreatePolicyDto) {
    try {
      const res = await this.policyService.create(dto);
      return ApiResponses.success(res, 'Policy created successfully');
    } catch (err) {
      return ApiResponses.error(err);
    }
  }

  // GET ALL
  @Get()
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all policies (Public)' })
  async findAll() {
    try {
      const res = await this.policyService.findAll();
      return ApiResponses.success(res, 'Policies fetched successfully');
    } catch (err) {
      return ApiResponses.error(err);
    }
  }

  // GET BY ID
  @Get(':id')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get one policy by ID' })
  async findOne(@Param('id') id: string) {
    try {
      const res = await this.policyService.findOne(Number(id));
      return ApiResponses.success(res);
    } catch (err) {
      return ApiResponses.error(err);
    }
  }

  // UPDATE
  @Patch(':id')
  @Auth()
  @RequirePermission(Module.POLICIES, Permission.UPDATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update policy (Admin only)' })
  async update(@Param('id') id: string, @Body() dto: UpdatePolicyDto) {
    try {
      const res = await this.policyService.update(Number(id), dto);
      return ApiResponses.success(res, 'Policy updated successfully');
    } catch (err) {
      return ApiResponses.error(err);
    }
  }

  // PATCH: Update only Publish Status
  @Patch(':id/publish')
  @Auth()
  @RequirePermission(Module.POLICIES, Permission.UPDATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update publish status (Admin only)' })
  async updatePublish(
    @Param('id') id: string
  ) {
    try {
      const res = await this.policyService.updateStatus(Number(id));
      return ApiResponses.success(res, 'Publish status updated');
    } catch (err) {
      return ApiResponses.error(err);
    }
  }

  // DELETE
  @Delete(':id')
  @Auth()
  @RequirePermission(Module.POLICIES, Permission.DELETE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete policy (Admin only)' })
  async remove(@Param('id') id: string) {
    try {
      const res = await this.policyService.remove(Number(id));
      return ApiResponses.success(res, 'Policy deleted successfully');
    } catch (err) {
      return ApiResponses.error(err);
    }
  }

}
