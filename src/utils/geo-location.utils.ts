import { Client } from '@googlemaps/google-maps-services-js';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GeoService {
  private client = new Client({});

  async getLatLngFromAddress(address: string) {
    const res = await this.client.geocode({
      params: {
        address,
        key: process.env.GOOGLE_MAPS_API_KEY!,
      },
    });

    if (!res.data.results.length) {
      throw new Error('Address not found');
    }

    const location = res.data.results[0].geometry.location;

    return {
      lat: location.lat,
      lng: location.lng,
      formattedAddress: res.data.results[0].formatted_address,
    };
  }
}
