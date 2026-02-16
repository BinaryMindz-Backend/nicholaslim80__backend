/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreateStandardCommissionRateDto } from './dto/create-commission_rate.dto';
import { UpdateStandardCommissionRateDto } from './dto/update-platform_fee.dto';
import { ApplicableTyp, FeeLogType } from '@prisma/client';


// 
@Injectable()
export class StandardCommissionRateService {
  constructor(private readonly prisma: PrismaService) { }

  // Create a new record
  async create(data: CreateStandardCommissionRateDto,
    changedByRole: string,
    changedById: number) {
    //  
    const record = await this.prisma.standardCommissionRate.findFirst({
      where: {
        role_name: data.role_name
      }
    })
    // 
    if (record) {
      throw new ConflictException("Record all ready exist")
    }

    const res = await this.prisma.standardCommissionRate.create({ data });
    const zone = await this.prisma.serviceZone.findUnique({ where: { id: data.service_area_id } });
    // 
    await this.createFeeLog({
      logType: FeeLogType.STANDARD_COMMISSION_RATE,
      referenceId: res.id,
      applicableUser: res.applicable_user,
      serviceArea: zone?.name,
      snapshot: res,
      changedByRole,
      changedById,
    });

    return res
  }

  // Get all records
  async findAll() {
    return await this.prisma.standardCommissionRate.findMany({
      include: {
        serviceArea: true,
      },
      orderBy: { created_at: 'desc' }, // optional: latest first
    });
  }

  // Get a single record by ID
  async findOne(id: number) {
    const record = await this.prisma.standardCommissionRate.findUnique({
      where: { id },
      include: {
        serviceArea: true,
      },
    });
    if (!record) throw new NotFoundException('Standard Commission Rate not found');
    return record;
  }

  // Update a record by ID
  async update(id: number,
    data: UpdateStandardCommissionRateDto,
    changedByRole: string,
    changedById: number
  ) {
    await this.findOne(id); // ensure exists
    const updated = await this.prisma.standardCommissionRate.update({
      where: { id },
      data,
    });
    const zone = await this.prisma.serviceZone.findUnique({ where: { id: data.service_area_id } });
    // 
    await this.createFeeLog({
      logType: FeeLogType.USER_FEE_STRUCTURE,
      referenceId: updated.id,
      applicableUser: updated.applicable_user,
      serviceArea: zone?.name,
      snapshot: updated,
      changedByRole,
      changedById,

    });

    return updated
  }

  // Delete a record by ID
  async remove(id: number) {
    await this.findOne(id); // ensure exists
    return this.prisma.standardCommissionRate.delete({ where: { id } });
  }
  // re-useable logger for platform fee 
  async createFeeLog(params: {
    logType: FeeLogType;
    referenceId: number;
    applicableUser: ApplicableTyp;
    serviceArea?: string;
    snapshot: any;
    changedByRole: string;
    changedById?: number;
  }) {
    return await this.prisma.feeConfigurationLog.create({
      data: {
        log_type: params.logType,
        reference_id: params.referenceId,
        applicable_user: params.applicableUser,
        service_area: params.serviceArea,
        snapshot: params.snapshot,
        changed_by_role: params.changedByRole,
        changed_by_id: params.changedById,
      },
    });
  }


  async getLogs(
    logType?: FeeLogType,
    fromDate?: string,
    toDate?: string,
  ) {
    return await this.prisma.feeConfigurationLog.findMany({
      where: {
        log_type: logType,
        created_at: {
          gte: fromDate ? new Date(fromDate) : undefined,
          lte: toDate ? new Date(toDate) : undefined,
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  // get logs by references 
  async getLogsByReference(
    logType: FeeLogType,
    referenceId: number,
  ) {
    return await this.prisma.feeConfigurationLog.findMany({
      where: {
        log_type: logType,
        reference_id: referenceId,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }





}
