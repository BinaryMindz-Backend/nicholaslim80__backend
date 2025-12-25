/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { ApiResponses } from 'src/common/apiResponse';
import { CreateServiceZoneDto } from './dto/create-service-zone.dto';
import { UpdateServiceZoneDto } from './dto/update-service-zone.dto';
import { booleanPointInPolygon, point, polygon } from '@turf/turf';

type ZoneCoordinate = {
  lat: number;
  lng: number;
};

@Injectable()
export class ServiceZoneService {
  constructor(private readonly prisma: PrismaService) {}

  /* -------------------- Helpers -------------------- */

  private isZoneCoordinateArray(value: unknown): value is ZoneCoordinate[] {
    return (
      Array.isArray(value) &&
      value.every(
        (v) =>
          typeof v === 'object' &&
          v !== null &&
          'lat' in v &&
          'lng' in v &&
          typeof (v as any).lat === 'number' &&
          typeof (v as any).lng === 'number',
      )
    );
  }

  /* -------------------- CRUD -------------------- */

  async create(dto: CreateServiceZoneDto) {
    try {
      const res = await this.prisma.serviceZone.create({ data: dto });
      return ApiResponses.success(res, 'Service zone created successfully');
    } catch (error) {
      return ApiResponses.error(error.message);
    }
  }

  async findAll() {
    const zones = await this.prisma.serviceZone.findMany();

    return {
      data: {
        totalZone: zones.length,
        activeZone: zones.filter(z => z.isActive).length,
        inactiveZone: zones.filter(z => !z.isActive).length,
        data: zones,
      },
      message: 'Service zones fetched successfully',
    };
  }

  async updateActiveStatus(id: number) {
    try {
      const zone = await this.prisma.serviceZone.findUnique({ where: { id } });
      if (!zone) throw new Error('Service zone not found');

      const updated = await this.prisma.serviceZone.update({
        where: { id },
        data: { isActive: !zone.isActive },
      });

      return ApiResponses.success(updated, 'Service zone status updated');
    } catch (error) {
      return ApiResponses.error(error.message);
    }
  }

  async update(id: number, dto: UpdateServiceZoneDto) {
    try {
      const zone = await this.prisma.serviceZone.findUnique({ where: { id } });
      if (!zone) throw new Error('Service zone not found');

      const updated = await this.prisma.serviceZone.update({
        where: { id },
        data: dto,
      });

      return ApiResponses.success(updated, 'Service zone updated successfully');
    } catch (error) {
      return ApiResponses.error(error.message);
    }
  }

  async remove(id: number) {
    try {
      const zone = await this.prisma.serviceZone.findUnique({ where: { id } });
      if (!zone) throw new Error('Service zone not found');

      await this.prisma.serviceZone.delete({ where: { id } });
      return ApiResponses.success(null, 'Service zone deleted successfully');
    } catch (error) {
      return ApiResponses.error(error.message);
    }
  }

  /* Geo Logic */
  async findZoneByPoint(lat: number, lng: number) {
    const zones = await this.prisma.serviceZone.findMany({
      where: { isActive: true },
      select: {
        id: true,
        zoneName: true,
        coordinates: true, // JSON
      },
    });

    const pt = point([lng, lat]);

    for (const zone of zones) {
      if (!this.isZoneCoordinateArray(zone.coordinates)) continue;
      if (zone.coordinates.length < 3) continue;

      const ring = zone.coordinates.map(c => [c.lng, c.lat]);

      // ensure polygon is closed
      const first = ring[0];
      const last = ring[ring.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        ring.push(first);
      }

      const poly = polygon([ring]);

      if (booleanPointInPolygon(pt, poly)) {
        return zone;
      }
    }

    return null;
  }
}
