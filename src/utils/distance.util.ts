/* eslint-disable @typescript-eslint/no-unsafe-return */
import { NotFoundException } from "@nestjs/common";
import { DeliveryTypeName, PrismaClient } from "@prisma/client";
import axios from "axios";

// 
const prisma = new PrismaClient();

// type defination
export interface Receiver {
      lat:number;
      lng:number;
}
// 
export interface DistancePriceResult extends Receiver {
  distanceKm: number;
  durationMin: number;
  price: number;
}

// --- 1. Google Maps API call ---
async function getRoadDistancesGoogle(
  senderLat: number,
  senderLng: number,
  receivers: Receiver[]
): Promise<{ distanceKm: number; durationMin: number }[]> {
    if(!receivers.length) return []

    const destinations = receivers.map(r=> `${r.lat},${r.lng}`).join('|');

    const res = await axios.get(
         'https://maps.googleapis.com/maps/api/distancematrix/json',
         {
           params:{
                origins: `${senderLat},${senderLng}`,
                destinations,
                mode: 'driving',
                key: process.env.GOOGLE_MAPS_API_KEY, 
           }, 

         }
     );
    //  
    return res.data.rows[0].elements.map((el: any) => ({
            distanceKm: el.distance.value / 1000,
            durationMin: el.duration.value / 60,
        }));

}

// --- 2. Price calculation ---
function calculateDeliveryPrice(
    distanceKm: number,
    vehicle: any,
    deliveryType: any
    ): number {
    let price = Number(vehicle.base_price) + Number(vehicle.per_km_price) * distanceKm;
    //  console.log(Number(vehicle.base_price) , Number(vehicle.per_km_price) , distanceKm, deliveryType.percentage/100, price);
    // Add delivery type percentage
    price += (price * Number(deliveryType.percentage)) / 100;

    // Peak pricing multiplier
    if (vehicle.peak_pricing) {
        price *= 1.2; // example 20% extra //TODO:it will be dynamic
    }

    return price;
    }

// --- 3. Main util function ---
export async function getReceiversWithPrice(
  senderLat: number,
  senderLng: number,
  receivers: Receiver[],
  deliveryTypeName: string,
  vehicleTypeId: number
):Promise<DistancePriceResult[]> {
        
    // Cast string to Prisma enum
    const deliveryTypeEnum = deliveryTypeName as DeliveryTypeName;
    // Fetch delivery type
    const deliveryType = await prisma.deliveryType.findFirst({
        where: { name: deliveryTypeEnum, is_active: true },
    });
    if (!deliveryType) throw new Error(`Delivery type ${deliveryTypeName} not found`);
    // Fetch vehicle type
    const vehicle = await prisma.vehicleType.findUnique({ 
        where:{
           id:vehicleTypeId
        }
    })
    if(!vehicle) throw new NotFoundException(`Vehicle type ID ${vehicleTypeId} not found`)

    // Get road distances
    const roadDistances = await getRoadDistancesGoogle(senderLat, senderLng, receivers);
    // 

    return receivers.map((r, idx) => ({
         ...r,
          distanceKm: roadDistances[idx].distanceKm,
          durationMin: roadDistances[idx].durationMin,
          price: calculateDeliveryPrice(roadDistances[idx].distanceKm, vehicle, deliveryType),
    }))

}
