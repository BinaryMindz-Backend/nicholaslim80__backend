import { NotFoundException } from "@nestjs/common";
import { DeliveryTypeName, PrismaClient } from "@prisma/client";
import axios from "axios";

const prisma = new PrismaClient();

export interface Receiver {
  lat: number;
  lng: number;
}

export interface DistancePriceResult extends Receiver {
  distanceKm: number;
  durationMin: number;
  price: number;
}

// --- Google Maps API call with caching ---
const distanceCache = new Map<string, { distanceKm: number; durationMin: number }>();

export async function getRoadDistancesGoogle(
  senderLat: number,
  senderLng: number,
  receivers: Receiver[]
): Promise<{ distanceKm: number; durationMin: number }[]> {
  if (!receivers.length) return [];

  const uncachedReceivers = receivers.filter(r => 
    !distanceCache.has(`${senderLat},${senderLng}-${r.lat},${r.lng}`)
  );

  let roadDistances: { distanceKm: number; durationMin: number }[] = [];

  if (uncachedReceivers.length) {
    // Google API: max 25 destinations per request
    const chunks: Receiver[][] = [];
    for (let i = 0; i < uncachedReceivers.length; i += 25) {
      chunks.push(uncachedReceivers.slice(i, i + 25));
    }

    for (const chunk of chunks) {
      const destinations = chunk.map(r => `${r.lat},${r.lng}`).join('|');

      const res = await axios.get(
        'https://maps.googleapis.com/maps/api/distancematrix/json',
        {
          params: {
            origins: `${senderLat},${senderLng}`,
            destinations,
            mode: 'driving',
            key: process.env.GOOGLE_MAPS_API_KEY,
          },
        }
      );

      res.data.rows[0].elements.forEach((el: any, idx: number) => {
        const receiver = chunk[idx];
        const distanceKm = el.distance.value / 1000;
        const durationMin = el.duration.value / 60;
        distanceCache.set(`${senderLat},${senderLng}-${receiver.lat},${receiver.lng}`, { distanceKm, durationMin });
      });
    }
  }

  // Retrieve from cache for all receivers
  roadDistances = receivers.map(r => {
    const cached = distanceCache.get(`${senderLat},${senderLng}-${r.lat},${r.lng}`);
    return cached!;
  });

  return roadDistances;
}

// --- Price calculation ---
export function calculateDeliveryPrice(
  distanceKm: number,
  vehicle: any,
  deliveryType: any
): number {
  let price = Number(vehicle.base_price) + Number(vehicle.per_km_price) * distanceKm;
  price += (price * Number(deliveryType.percentage)) / 100;

  if (vehicle.peak_pricing) {
    price *= 1.2; // example multiplier
  }

  return price;
}

// --- Main util: get receivers with pricing ---
export async function getReceiversWithPrice(
  senderLat: number,
  senderLng: number,
  receivers: Receiver[],
  deliveryTypeName: string,
  vehicleTypeId: number
): Promise<DistancePriceResult[]> {

  // Validate delivery type
  const deliveryTypeEnum = deliveryTypeName as DeliveryTypeName;
  const deliveryType = await prisma.deliveryType.findFirst({
    where: { name: deliveryTypeEnum, is_active: true },
  });
  if (!deliveryType) throw new Error(`Delivery type ${deliveryTypeName} not found`);

  const vehicle = await prisma.vehicleType.findUnique({ 
    where: { id: vehicleTypeId }
  });
  if (!vehicle) throw new NotFoundException(`Vehicle type ID ${vehicleTypeId} not found`);

  const roadDistances = await getRoadDistancesGoogle(senderLat, senderLng, receivers);

  return receivers.map((r, idx) => ({
    ...r,
    distanceKm: roadDistances[idx].distanceKm,
    durationMin: roadDistances[idx].durationMin,
    price: calculateDeliveryPrice(roadDistances[idx].distanceKm, vehicle, deliveryType),
  }));
}
