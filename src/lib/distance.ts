/** Distancia legible: metros redondeados a la decena si es <1km, si no en km ("850 m", "2.3 km"). */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round((km * 1000) / 10) * 10} m`;
  return `${km.toFixed(1)} km`;
}
