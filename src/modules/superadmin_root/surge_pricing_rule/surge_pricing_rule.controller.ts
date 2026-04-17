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
  create(@Body() dto: CreateSurgePricingRuleDto) {
    return this.service.create(dto);
  }

  @Get()
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.SURGE_PRICING_ROLE, Permission.READ)
  @ApiOperation({ summary: 'List all surge pricing rules with optional filters' })
  @ApiResponse({ status: 200, description: 'Paginated list of rules' })
  findAll(@Query() query: SurgePricingRuleQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.SURGE_PRICING_ROLE, Permission.GET_ONE)
  @ApiOperation({ summary: 'Get a single surge pricing rule by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Rule details' })
  @ApiResponse({ status: 404, description: 'Rule not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.SURGE_PRICING_ROLE, Permission.UPDATE)
  @ApiOperation({ summary: 'Update a surge pricing rule' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Rule updated successfully' })
  @ApiResponse({ status: 404, description: 'Rule not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSurgePricingRuleDto,
  ) {
    return this.service.update(id, dto);
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
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  @Patch(':id/toggle-status')
  @Auth()
  @ApiBearerAuth()
  @RequirePermission(Module.SURGE_PRICING_ROLE, Permission.UPDATE)
  @ApiOperation({ summary: 'Toggle rule status between ACTIVE and INACTIVE' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Status toggled' })
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.service.toggleStatus(id);
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
  resolve(@Body() dto: ResolveSurgeDto) {
    return this.service.resolveSurge(dto);
  }
}