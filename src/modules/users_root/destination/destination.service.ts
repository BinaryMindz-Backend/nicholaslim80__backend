import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateDestinationDto } from './dto/create-destination.dto';
import { UpsertDestinationDto } from './dto/update-destination.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import type { IUser } from 'src/types';
import { GeoService } from 'src/utils/geo-location.utils';
import { DestinationType } from '@prisma/client';

@Injectable()
export class DestinationService {
  constructor(
    private prisma: PrismaService,
    private readonly geoServices:GeoService,
  ) { }


  // 
  async create(dto: CreateDestinationDto, user: IUser) {

    if (!user) {
      throw new NotFoundException("Verified User Not found")
    }

    const isUserExist = this.prisma.user.findUnique({
      where: {
        id: user?.id,
      }
    })
    if (isUserExist === null) throw new UnauthorizedException("You Are Not Authorize");
    // 
    const geo = await this.geoServices.getLatLngFromAddress(dto.address ?? '');
    
    const isExist = await this.prisma.destination.findFirst({
      where: {
        OR: [
          { latitude: geo.lat },
          { longitude: geo.lng },
        ],
        userId: user?.id
      }
    })

    if (isExist) {
      throw new ConflictException("Destination is already exists")
    }

    // 
    return await this.prisma.destination.create({
      data: {
        address: dto.address,
        addressFromApr:geo.formattedAddress,
        floor_unit: dto.floor_unit,
        contact_name: dto.contact_name,
        contact_number: dto.contact_number,
        note_to_driver: dto.note_to_driver,
        is_saved: dto.is_saved,
        type: dto.type,
        latitude: geo.lat,
        longitude: geo.lng,
        accuracy: dto.accuracy,
        userId: user.id
      }
    });
  }

  //
  async findAll(user: IUser) {
    return this.prisma.destination.findMany({
      where: {
        userId: user.id
      }
    });
  }

  // 
  async findOne(id: number) {

    return await this.prisma.destination.findUnique({ where: { id } });
  }

  // 
  async update(id: number, dto: UpsertDestinationDto, user: IUser) {
    //  
    if (!id) {
      throw new NotFoundException("destination id not found")
    }
    // 
    const isUserExist = this.prisma.user.findUnique({
      where: {
        id: user?.id,
      }
    })
    if (isUserExist === null) throw new UnauthorizedException("You Are Not Authorize")
    const geo = await this.geoServices.getLatLngFromAddress(dto.address ?? '');
    // 
    const isExist = await this.prisma.destination.findUnique({
      where: {
        id
      }
    })
    // 
    if (!isExist) {
      throw new ConflictException("Destination is already exists")
    }

    // 
    return await this.prisma.destination.update({
      where: { id },
      data: {
        ...dto,
        latitude:geo.lat,
        longitude:geo.lng,
        addressFromApr:geo.formattedAddress,
      },
    });
  }

  // 
  async remove(id: number, user: IUser) {
    //  
    if (!id) {
      throw new NotFoundException("destination id not found")
    }

    const isUserExist = await this.prisma.user.findUnique({
      where: {
        id: user?.id,
      }
    })
    if (isUserExist === null) throw new UnauthorizedException("You Are Not Authorize")

    // 
    const isExist = await this.prisma.destination.findFirst({
      where: {
        id,
        userId: user?.id
      }
    })
    // 
    if (!isExist) {
      throw new ConflictException("destination not found by this id")
    }
    // 

    return await this.prisma.destination.delete({ where: { id } });
  }
  //  
   async upsertDestination(userId: number, dto: UpsertDestinationDto) {
    const data = {
      address: dto.address,
      latitude: dto.latitude,
      longitude: dto.longitude,
      additionalInfo: dto.additionalInfo,
      type: dto.type,
      userId,
    };

    if (userId) {
      // Update existing
      const existing = await this.prisma.destination.findFirst({
        where: { userId, type: dto.type  },
      });

      if (!existing || existing.userId !== userId) {
        throw new BadRequestException('Destination not found or unauthorized');
      }

      return this.prisma.destination.update({
        where: { id: existing.id
        },
        data,
      });
    }

    // Create new
    return this.prisma.destination.create({ data });
  }

  /**
   * Get user's saved destinations (address book)
   */
  async getUserDestinations(userId: number, type?: DestinationType) {
    return this.prisma.destination.findMany({
      where: {
        userId,
        ...(type && { type }),
      },
      orderBy: [
        { lastUsedAt: 'desc' },
        { useCount: 'desc' },
      ],
    });
  }

  /**
   * Get frequently used destinations
   */
  async getFrequentDestinations(userId: number, limit = 5) {
    return this.prisma.destination.findMany({
      where: { userId },
      orderBy: [
        { useCount: 'desc' },
        { lastUsedAt: 'desc' },
      ],
      take: limit,
    });
  }

  /**
   * Delete a destination from address book
   */
  async deleteDestination(userId: number, destinationId: number) {
    const destination = await this.prisma.destination.findUnique({
      where: { id: destinationId },
      include: { orderStops: { where: { order: { order_status: { in: ['PROGRESS', 'PENDING', 'ONGOING'] } } } } },
    });

    if (!destination || destination.userId !== userId) {
      throw new BadRequestException('Destination not found or unauthorized');
    }

    // Prevent deletion if used in active orders
    if (destination.orderStops.length > 0) {
      throw new BadRequestException(
        'Cannot delete destination used in active orders. Complete or cancel those orders first.',
      );
    }

    await this.prisma.destination.delete({ where: { id: destinationId } });
    return { message: 'Destination deleted successfully' };
  }




}
