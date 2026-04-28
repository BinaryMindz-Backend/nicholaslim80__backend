import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/core/database/prisma.service";
import { CreateDisputeTypeDto } from "./dto/create-dispute-type.dto";
import { UpdateDisputeTypeDto } from "./dto/update-dispute-type.dto";

@Injectable()
export class DisputeTypeService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDisputeTypeDto) {
    return this.prisma.disputeType.create({
      data: dto,
    });
  }

  async findAll() {
    return this.prisma.disputeType.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByRole(role: 'USER' | 'DRIVER') {
    return this.prisma.disputeType.findMany({
      where: {
        role,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async update(id: string, dto: UpdateDisputeTypeDto) {
    return this.prisma.disputeType.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    return this.prisma.disputeType.delete({
      where: { id },
    });
  }
}
