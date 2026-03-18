import { Injectable } from '@nestjs/common';
import { PrismaService } from "src/core/database/prisma.service";
import { RedisService } from "src/modules/auth/redis/redis.service";

@Injectable()
export class RaiderService {
  constructor(
    private prisma: PrismaService, 
    private redis: RedisService
  ) {}

  // Get raider by userId
  async getRaiderByUserId(userId: number) {
    const raider = await this.prisma.raider.findFirst({
      where: { userId: userId },
    });
    
    if (!raider) {
      return null;
    }
    
    return raider;
  }

  // Set rider online
   async setOnline(riderId: number) {
    const rider = await this.prisma.raider.findUnique({
      where: { id: riderId },
    });

    if (!rider) throw new Error('Rider profile not found');

    // Prevent duplicate sessions (if already online)
    const activeSession = await this.prisma.raiderOnlineSession.findFirst({
      where: {
        raiderId: riderId,
        endAt: null,
      },
    });

    if (!activeSession) {
      await this.prisma.raiderOnlineSession.create({
        data: {
          raiderId: riderId,
          startAt: new Date(),
        },
      });
    }

    // Redis (short TTL heartbeat)
    await this.redis.set(`rider:${riderId}:status`, 'ONLINE', 60);

    // Update DB status
    await this.prisma.raider.update({
      where: { id: riderId },
      data: { is_online: true },
    });
  }

  // Set rider offline
  async setOffline(riderId: number) {
    const rider = await this.prisma.raider.findUnique({
      where: { id: riderId },
    });

    if (!rider) throw new Error('Rider profile not found');

    // Close active session
    const activeSession = await this.prisma.raiderOnlineSession.findFirst({
      where: {
        raiderId: riderId,
        endAt: null,
      },
      orderBy: { startAt: 'desc' },
    });

    if (activeSession) {
      await this.prisma.raiderOnlineSession.update({
        where: { id: activeSession.id },
        data: {
          endAt: new Date(),
        },
      });
    }

    // Redis update
    await this.redis.set(`rider:${riderId}:status`, 'OFFLINE', 60);

    // Update DB
    await this.prisma.raider.update({
      where: { id: riderId },
      data: { is_online: false },
    });
  }

  // Update rider location
  async updateLocation(riderId: number, lat: number, lng: number, heading?: number) {
    const key = `rider:${riderId}:location`;
    const value = JSON.stringify({ lat, lng, heading, updatedAt: Date.now() });
    
    await this.redis.set(key, value, 30);
    // 
    console.log(`✅ Rider ${riderId} location updated:`, { lat, lng, heading });
    console.log(`✅ Redis key set: ${key}`);
    }
    // 
    async getOnlineRidersInZone(compititiorIds: number[]) {
      const riders = await this.prisma.raider.findMany({
        where: {
          id: {
            in: compititiorIds,
          },
        },
      });

      return riders;
    }
    // find all raider
    async findAllRaider(){
      const allRaider = await this.prisma.raider.findMany({
          where:{
            is_online:true
          }
      })
      return allRaider
    }
    // 

  }


