import axios from 'axios';
import { Receiver } from './types';

const distanceCache = new Map<string, { km: number; min: number }>();

export async function getRoadDistance(
  from: Receiver,
  to: Receiver,
): Promise<{ km: number; min: number }> {
  const key = `${from.lat},${from.lng}-${to.lat},${to.lng}`;
  const cached = distanceCache.get(key);
  if (cached) return cached;

  const res = await axios.get(
    'https://maps.googleapis.com/maps/api/distancematrix/json',
    {
      params: {
        origins: `${from.lat},${from.lng}`,
        destinations: `${to.lat},${to.lng}`,
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
    },
  );

  const el = res.data.rows[0].elements[0];
  const value = {
    km: el.distance.value / 1000,
    min: el.duration.value / 60,
  };

  distanceCache.set(key, value);
  return value;
}
