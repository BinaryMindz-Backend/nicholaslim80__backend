import { CreateRaiderCompensationRoleDto } from './dto/create_compensation_role.dto';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { FeeLogType, RaiderCompensationRole } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import { UpdateRaiderCompensationRoleDto } from './dto/update-platform_fee.dto';
import { StandardCommissionRateService } from './commision_rate.services';



@Injectable()
export class RaiderCompensationRoleService {
  constructor(private readonly prisma: PrismaService,
    private readonly logServices: StandardCommissionRateService
  ) { }

  async create(data: CreateRaiderCompensationRoleDto, changedByRole: string, changedById: number,) {

    //  
    const record = await this.prisma.raiderCompensationRole.findFirst({
      where: {
        scenario: data.scenario,
        service_area_id: data.service_area_id
      }
    })
    // 
    if (record) {
      throw new ConflictException("Record all ready exist")
    }
    const zone = await this.prisma.serviceZone.findUnique({ where: { id: data.service_area_id } });
    const r = await this.prisma.raiderCompensationRole.create({ data });
    //
    await this.logServices.createFeeLog({
      logType: FeeLogType.RAIDER_COMPENSATION_ROLE,
      referenceId: r.id,
      applicableUser: r.applicable_user,
      serviceArea: zone?.name,
      snapshot: r,
      changedByRole,
      changedById,
    });
    // 
    return r
  }

  async findAll() {
    return await this.prisma.raiderCompensationRole.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: number) {
    const record = await this.prisma.raiderCompensationRole.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Raider Compensation Role not found');
    return record;
  }

  async update(id: number, data: UpdateRaiderCompensationRoleDto,
    changedByRole: string,
    changedById: number,
  ) {
    await this.findOne(id);
    const zone = await this.prisma.serviceZone.findUnique({ where: { id: data.service_area_id } });
    const updated = await this.prisma.raiderCompensationRole.update({ where: { id }, data });

    await this.logServices.createFeeLog({
      logType: FeeLogType.RAIDER_COMPENSATION_ROLE,
      referenceId: updated.id,
      applicableUser: updated.applicable_user,
      serviceArea: zone?.name,
      snapshot: updated,
      changedByRole,
      changedById,
    });

    return updated;

  }

  async remove(id: number): Promise<RaiderCompensationRole> {
    await this.findOne(id);
    return this.prisma.raiderCompensationRole.delete({ where: { id } });
  }
}
