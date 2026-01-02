
// export async function calculateRouteDistance(
//   sender: Receiver,
//   receivers: Receiver[],
//   isRoundTrip = false,
//   returnFactor = 0.5,
// ): Promise<number> {
//   let totalKm = 0;

//   // Forward route: S → R1 → R2 → ...
//   for (let i = 0; i < receivers.length; i++) {
//     const from = i === 0 ? sender : receivers[i - 1];
//     const to = receivers[i];
//     const { km } = await getRoadDistance(from, to);
//     totalKm += km;
//   }

//   // Return leg: Last → Sender
//   if (isRoundTrip && receivers.length) {
//     const last = receivers[receivers.length - 1];
//     const { km } = await getRoadDistance(last, sender);
//     totalKm += km * returnFactor;
//   }

//   return totalKm;
// }

import { getRoadDistance } from './distance.service';
import { Receiver } from './types';

export async function calculateRouteDistance(
  sender: Receiver,
  receivers: Receiver[],
  isRoundTrip = false,
  returnFactor = 0.5,
): Promise<number> {
  let totalKm = 0;

  for (let i = 0; i < receivers.length; i++) {
    const from = i === 0 ? sender : receivers[i - 1];
    const to = receivers[i];
    const { km } = await getRoadDistance(from, to);
    totalKm += km;
  }

  if (isRoundTrip && receivers.length) {
    const last = receivers[receivers.length - 1];
    const { km } = await getRoadDistance(last, sender);
    totalKm += km * returnFactor;
  }

  return totalKm;
}
