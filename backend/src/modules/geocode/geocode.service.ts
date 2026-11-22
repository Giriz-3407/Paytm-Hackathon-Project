import { searchPlaces, type GeocodeResult } from '../../services/nominatim.service';

export const geocodeService = {
  search(query: string, limit: number): Promise<GeocodeResult[]> {
    return searchPlaces(query, limit);
  },
};
