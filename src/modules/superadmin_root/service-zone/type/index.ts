import { DeliveryZone, LatLng } from "src/types";

export function mapPrismaDeliveryZoneToDeliveryZone(prismaZone: any): DeliveryZone {
  return {
    id: prismaZone.id,
    name: prismaZone.name,
    zoneName: prismaZone.zoneName,
    coordinates: (prismaZone.coordinates as any[] ?? []).map((c: any) => ({
      lat: Number(c.lat),
      lng: Number(c.lng),
    })) as LatLng[],
    deliveryFee: Number(prismaZone.deliveryFee ?? 0),
    priority: prismaZone.priority ?? 3,
    color: prismaZone.color ?? null,
    minOrderAmmount: prismaZone.minOrderAmmount ?? 0,
    isActive: prismaZone.isActive,
    notes: prismaZone.notes ?? null,
    createdAt: prismaZone.createdAt,
    updatedAt: prismaZone.updatedAt,
  };
}