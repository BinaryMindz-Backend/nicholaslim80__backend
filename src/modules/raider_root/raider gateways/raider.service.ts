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
      console.log('Raider profile not found for user', userId);
      return null;
    }
    
    return raider;
  }

  // Set rider online
  async setOnline(riderId: number) {
    const raider = await this.prisma.raider.findFirst({
      where: { id: riderId },
    });
    
    if (!raider) throw new Error('Rider profile not found');
    
    //
    await this.redis.set(`rider:${riderId}:status`, 'ONLINE', 60); 
    
    await this.prisma.raider.update({
      where: { id: riderId },
      data: { is_online: true },
    });
    
    //
    console.log(`Rider ${riderId} set online`); 
  }

  // Set rider offline
  async setOffline(riderId: number) {
    console.log("offline -->", riderId);
    
    const rider = await this.prisma.raider.findUnique({
      where: { id: riderId },
    });
    
    if (!rider) throw new Error('Rider profile not found');
    
    // 
    await this.redis.set(`rider:${riderId}:status`, 'OFFLINE', 60);
    
    await this.prisma.raider.update({
      where: { id: riderId },
      data: { is_online: false },
    });
    
    // 
    console.log(`Rider ${riderId} set offline`); 
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
}
