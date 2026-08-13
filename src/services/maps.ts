import { http } from '@/lib/http';

export type AddressSearchResult = {
  label: string;
  latitude: number;
  longitude: number;
};

/**
 * Llamadas al backend para el selector de ubicación de negocios (admin):
 * buscar dirección, geocodificar coordenadas y resolver links "Compartir"
 * acortados de Google Maps. Todo va por el backend (nunca directo a
 * Nominatim/Google desde el cliente) — ver `GeocodingService` en el backend
 * para el porqué (política de `User-Agent` de Nominatim, CORS de Google).
 */
export const mapsService = {
  resolveMapsUrl: (url: string) =>
    http<{ data: { finalUrl: string | null } }>(
      `/organizational/resolve-maps-url?url=${encodeURIComponent(url)}`,
      { auth: true, toastError: false },
    ),

  searchAddress: (q: string) =>
    http<{ data: AddressSearchResult[] }>(
      `/organizational/search-address?q=${encodeURIComponent(q)}`,
      { auth: true, toastError: false },
    ),

  reverseGeocode: (latitude: number, longitude: number) =>
    http<{ data: { label: string | null } }>(
      `/organizational/reverse-geocode?latitude=${latitude}&longitude=${longitude}`,
      { auth: true, toastError: false },
    ),
};
