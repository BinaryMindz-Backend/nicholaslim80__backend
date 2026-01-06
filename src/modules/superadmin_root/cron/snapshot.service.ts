import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from 'src/core/database/prisma.service';
import { RedisService } from 'src/modules/auth/redis/redis.service';

@Injectable()
export class SnapshotService {
  private readonly logger = new Logger(SnapshotService.name);

  constructor(
    private redis: RedisService,
    private prisma: PrismaService
  ) {}

  @Cron('*/60 * * * * *') // TODO: every 30 seconds
  async snapshotLocations() {
    try {
      this.logger.log('Starting snapshot...');

      // Snapshot locations using upsert (more efficient)
      const locationKeys = await this.redis.keys('rider:*:location');
      this.logger.log(`Found ${locationKeys.length} location keys`);

      const locationPromises = locationKeys.map(async (key) => {
        try {
          const riderId = parseInt(key.split(':')[1]);
          const value = await this.redis.get(key);
          if (!value) return;
          const loc = JSON.parse(value);

          // Use upsert - creates if doesn't exist, updates if exists
          await this.prisma.raiderLocation.upsert({
            where: { raiderId: riderId},
            update: {
              latitude: loc.lat,
              longitude: loc.lng,
              heading: loc.heading || null,
              updated_at: new Date(),
            },
            create: {
              raiderId: riderId,
              latitude: loc.lat,
              longitude: loc.lng,
              heading: loc.heading || null,
            },
          });
        } catch (err) {
          this.logger.error(`Error updating location for key ${key}:`, err.message);
        }
      });

      await Promise.all(locationPromises);

      // Snapshot status
      const statusKeys = await this.redis.keys('rider:*:status');
      this.logger.log(`Found ${statusKeys.length} status keys`);

      const statusPromises = statusKeys.map(async (key) => {
        try {
          const riderId = parseInt(key.split(':')[1]);
          const status = await this.redis.get(key);
          if (!status) return;

          await this.prisma.raider.update({
            where: { id: riderId },
            data: { is_online: status === 'ONLINE' },
          });
        } catch (err) {
          this.logger.error(`Error updating status for key ${key}:`, err.message);
        }
      });

      await Promise.all(statusPromises);

      this.logger.log('Snapshot completed successfully');
    } catch (err) {
      this.logger.error('Snapshot failed:', err.message);
    }
  }
}