import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateIncentiveDto } from './dto/create-incentive.dto';
import { UpdateIncentiveDto } from './dto/update-incentive.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import { IncentiveStatus, RaiderStatus, WalletTransactionStatus, WalletTransactionType } from '@prisma/client';
import { TransactionIdService } from 'src/common/services/transaction-id.service';
import { IncentiveQueryDto } from './dto/incentive-query.dto';

@Injectable()
export class IncentiveService {

  constructor(private readonly prisma: PrismaService,
    private txIdService: TransactionIdService,
  ) { }

  // 
  async create(dto: CreateIncentiveDto, adminId?: number, role? : string) {
    const record = await this.prisma.incentive.findFirst({
      where: {
        OR: [{ start_date: dto.start_date }, { end_date: dto.end_date }],
      },
    });

    if (record) {
      throw new ConflictException('Incentive record found by same date');
    }

    const res = await this.prisma.incentive.create({
      data: {
        ...dto,
        adminId,
      },
    });

    await this.prisma.incentiveLog.create({
      data: {
        incentiveId: res.id,
        incentiveName: res.incentive_name,
        type: res.type,
        startDate: res.start_date,
        endDate: res.end_date,
        incentiveAmount: res.incentive_amount,
        status: res.status,
        changedByRole: role!,
        changedByAdminId: adminId,
      },
    });

    return res;
  }


  // 
  async findAll(query: IncentiveQueryDto) {
    const {
      page = 1,
      limit = 10,
      startDate,
      endDate,
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {};

    // Date filtering
    if (startDate || endDate) {
      where.created_at = {};

      if (startDate) {
        where.created_at.gte = new Date(startDate);
      }

      if (endDate) {
        where.created_at.lte = new Date(endDate);
      }
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.incentive.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          created_at: 'desc',
        },
      }),

      this.prisma.incentive.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }


  // 
  async findAllIncentive() {



    // 
    const res = await this.prisma.incentive.findMany({})
    return res;
  }


  // 
  async stats() {
    const countAll = await this.prisma.incentive.count();
    // 
    const countActiveRider = await this.prisma.raider.count({
      where: {
        raider_status: RaiderStatus.ACTIVE
      }
    })
    // total amount given
    const totalAmountGiven = await this.prisma.incentive.aggregate({
      _avg: {
        incentive_amount: true
      }
    })
    // 
    const countOngoing = await this.prisma.incentive.count({
      where: {
        status: IncentiveStatus.ONGOING
      }
    })
    return {
      countAll,
      countActiveRider,
      countOngoing,
      totalAmountGiven: totalAmountGiven._avg.incentive_amount
    }
  }

  // 
  async findOne(id: number) {
    // 
    const res = await this.prisma.incentive.findFirst({
      where: {
        id
      }
    })
    return res;
  }

  //
  async update(
      id: number,
      updateIncentiveDto: UpdateIncentiveDto,
      adminId?: number,
      role? :string
    ) {
      const rec = await this.prisma.incentive.findUnique({
        where: { id },
      });

      if (!rec) throw new NotFoundException('Incentive not found');

      const updated = await this.prisma.incentive.update({
        where: { id },
        data: updateIncentiveDto,
      });

      await this.prisma.incentiveLog.create({
        data: {
          incentiveId: updated.id,
          incentiveName: updated.incentive_name,
          type: updated.type,
          startDate: updated.start_date,
          endDate: updated.end_date,
          incentiveAmount: updated.incentive_amount,
          status: updated.status,
          changedByRole: role!,
          changedByAdminId: adminId,
        },
      });

      return updated;
    }


  // ** status update
  async statusUpdate(id: number, dto: UpdateIncentiveDto) {
    // 
    const rec = await this.prisma.incentive.findFirst({
      where: {
        id
      }
    })
    // 
    if (!rec) throw new NotFoundException("Incentive not found")
    // 
    if (rec.status === dto.status) throw new NotFoundException("Incentive status is up to date")


    // 
    const updateIncentive = await this.prisma.incentive.update({
      where: {
        id
      },
      data: {
        status: dto.status
      },
    })
    // 
    return updateIncentive;
  }



  //
  async remove(id: number) {
    // 
    const rec = await this.prisma.incentive.findFirst({
      where: {
        id
      }
    })
    // 
    if (!rec) throw new NotFoundException("Incentive not found");


    return await this.prisma.incentive.delete({
      where: {
        id
      }
    })


  }

  // collect incentive
  async collect(id: number, userId: number) {
    // 
    const rec = await this.prisma.incentive.findUnique({
      where: {
        id,
        status: IncentiveStatus.ONGOING
      }
    })
    // 
    if (!rec) throw new NotFoundException("Incentive not found")
    // 
    if (rec.status === IncentiveStatus.ENDED) throw new NotFoundException("Incentive is already ended")
    const collectedIncentive = await this.prisma.collectedIncentive.findFirst({
      where: {
        userId,
        incentiveId: id,
        is_collected: true
      }
    })
    // 
    if (collectedIncentive) throw new NotFoundException("Incentive is already collected")
    const txId = this.txIdService.generate();
    // 
    const res = await this.prisma.$transaction(async (tx) => {
      const collectedIncentive = await tx.collectedIncentive.create({
        data: {
          userId,
          incentiveId: id,
          is_collected: true,
          amount:rec.incentive_amount
        },
      })
      //  
      const user = await tx.user.update({
        where: {
          id
        },
        data: {
          totalWalletBalance: {
            increment: Number(rec?.incentive_amount)
          }
        },
      })
      // save to transaction
      const walletHistory = await tx.walletHistory.create({
        data: {
          transactionId: txId,
          userId,
          amount: Number(rec?.incentive_amount),
          transactionType: WalletTransactionType.PAYMENT,
          type: "credit",
          status: WalletTransactionStatus.SUCCESS,
        },
      })
      return {
        collectedIncentive,
        user,
        walletHistory
      }
    })
    // 
    return res;
  }
  // 
  async findAllLogs(fromDate?: string, toDate?: string) {
    return await this.prisma.incentiveLog.findMany({
      where: {
        createdAt: {
          gte: fromDate ? new Date(fromDate) : undefined,
          lte: toDate ? new Date(toDate) : undefined,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

}
