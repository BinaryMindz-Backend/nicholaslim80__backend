import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  CreateSurgePricingRuleDto,
  ResolveSurgeDto,
  SurgePricingRuleQueryDto,
  UpdateSurgePricingRuleDto,
} from './dto/index';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { SurgePricingRuleService } from './surge_pricing_rule.service';
import { Auth } from 'src/decorators/auth.decorator';
import { RequirePermission } from 'src/rbac/decorators/require-permission.decorator';
import { Module, Permission } from 'src/rbac/rbac.constants';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import type { IUser } from 'src/types';

@ApiTags('Surge Pricing Rules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/surge-pricing-rules')
export class SurgePricingRuleController {
  constructor(private readonly service: SurgePricingRuleService) {}

  // ─── Admin CRUD ────────────────────────────────────────────────────────────

  @Post()
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.SURGE_PRICING_ROLE, Permission.CREATE)
  @ApiOperation({ summary: 'Create a new surge pricing rule' })
  @ApiResponse({ status: 201, description: 'Rule created successfully' })
  @ApiResponse({ status: 400, description: 'Ratio range overlaps existing rule' })
  async create(@Body() dto: CreateSurgePricingRuleDto,@CurrentUser() user:IUser) {
    return await this.service.create(dto, user.id);
  }

  @Get()
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.SURGE_PRICING_ROLE, Permission.READ)
  @ApiOperation({ summary: 'List all surge pricing rules with optional filters' })
  @ApiResponse({ status: 200, description: 'Paginated list of rules' })
  async findAll(@Query() query: SurgePricingRuleQueryDto) {
    return await this.service.findAll(query);
  }

  @Get(':id')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.SURGE_PRICING_ROLE, Permission.GET_ONE)
  @ApiOperation({ summary: 'Get a single surge pricing rule by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Rule details' })
  @ApiResponse({ status: 404, description: 'Rule not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.service.findOne(id);
  }

  @Patch(':id')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.SURGE_PRICING_ROLE, Permission.UPDATE)
  @ApiOperation({ summary: 'Update a surge pricing rule' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Rule updated successfully' })
  @ApiResponse({ status: 404, description: 'Rule not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSurgePricingRuleDto,
    @CurrentUser() user:IUser
  ) {
    return await this.service.update(id, dto, user.id);
  }

  @Delete(':id')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.SURGE_PRICING_ROLE, Permission.DELETE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a surge pricing rule' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Rule deleted successfully' })
  @ApiResponse({ status: 404, description: 'Rule not found' })
  async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user:IUser) {
    return await this.service.remove(id, user.id);
  }

  @Patch(':id/toggle-status')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.SURGE_PRICING_ROLE, Permission.UPDATE)
  @ApiOperation({ summary: 'Toggle rule status between ACTIVE and INACTIVE' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Status toggled' })
  async toggleStatus(@Param('id', ParseIntPipe) id: number, @CurrentUser() user:IUser) {
    return await this.service.toggleStatus(id, user.id);
  }

  // ─── Surge Engine ──────────────────────────────────────────────────────────

  @Post('resolve')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.SURGE_PRICING_ROLE, Permission.CREATE)
  @ApiOperation({
    summary: 'Resolve surge multiplier for a given demand-to-driver ratio',
    description:
      'Finds the best matching active rule for the provided ratio, service area, and delivery type. Returns multiplier=1.0 if no rule matches.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns matched rule and effective multiplier',
    schema: {
      example: {
        matched: true,
        multiplier: 1.1,
        rule: {
          id: 1,
          ruleName: 'High Demand Level 1',
          ratioFrom: '1.0',
          ratioTo: '1.5',
          priceMultiplier: '1.1',
          maxCap: '2.0',
          status: 'ACTIVE',
        },
      },
    },
  })
  async resolve(@Body() dto: ResolveSurgeDto) {
    return await this.service.resolveSurge(dto);
  }
}