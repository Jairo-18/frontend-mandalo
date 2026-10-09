import { http } from '@/lib/http';

/**
 * Tarifas del servicio (antes fijas por variables de entorno en el backend):
 * una TARIFA GENERAL + tarifa PROPIA opcional por municipio. La que aplica a
 * un pedido es la del municipio del NEGOCIO; si no tiene propia, hereda la
 * general. Los pedidos ya creados no cambian al editar (cada uno congela sus
 * montos al crearse).
 */
export type PricingValues = {
  /** Radio (km) cubierto por la tarifa base. */
  baseKm: number;
  /** Tarifa base (COP) — también es el mínimo del servicio. */
  baseFee: number;
  /** Parte de la tarifa base para Mándalo (solo superadmin). */
  baseMandaloCut: number;
  /** Valor por km adicional (COP). */
  extraKmRate: number;
  /** % del excedente por km para Mándalo (solo superadmin). */
  extraMandaloRate: number;
  nightSurcharge: number;
  /** "HH:MM", hora de Bogotá. */
  nightStartTime: string;
  nightEndTime: string;
  weatherSurcharge: number;
  /** mm de lluvia/hora desde los que aplica el recargo por clima. */
  weatherHeavyRainMm: number;
  demandSurcharge: number;
  /** Pedidos listos sin repartidor en el municipio que activan el recargo (0 = apagado). */
  demandThreshold: number;
  /** Cargo del segundo intento de entrega (COP). */
  retryFee: number;
  /** Minutos de espera en el sitio antes del segundo intento. */
  waitMinutes: number;
  /** Tarifa de servicio: umbral del subtotal (solo superadmin). */
  serviceFeeThreshold: number;
  /** Tarifa de servicio si el subtotal es MENOR al umbral (solo superadmin). */
  serviceFeeBelow: number;
  /** Tarifa de servicio desde el umbral en adelante (solo superadmin). */
  serviceFeeAbove: number;
};

export type PricingView = PricingValues & {
  updatedAt: string | null;
  updatedBy: { id: string; fullName: string } | null;
};

export type MunicipalityPricingItem = {
  municipality: { id: number; code: string; name: string };
  /** true = tarifa propia; false = hereda la general. */
  isCustom: boolean;
  /** Tarifa efectiva (la propia, o la general si no tiene). */
  pricing: PricingView;
};

export type PricingOverview = {
  general: PricingView;
  /** SUPERADMIN: municipios del Putumayo (+ donde haya negocios); ADMIN: solo el suyo. */
  municipalities: MunicipalityPricingItem[];
  canEditGeneral: boolean;
  /** Campos que este usuario no puede cambiar (se muestran de solo lectura). */
  readOnlyFields: (keyof PricingValues)[];
};

export const municipalityPricingService = {
  overview: () =>
    http<{ data: PricingOverview }>('/municipality-pricing', { auth: true }),

  /** Solo SUPERADMIN. */
  updateGeneral: (payload: Partial<PricingValues>) =>
    http<{ data: PricingView; message?: string }>('/municipality-pricing/general', {
      method: 'PATCH',
      body: payload,
      auth: true,
      toastSuccess: true,
    }),

  /** ADMIN (solo su municipio) o SUPERADMIN. Crea la tarifa propia si no la tenía. */
  updateMunicipality: (municipalityId: number, payload: Partial<PricingValues>) =>
    http<{ data: PricingView; message?: string }>(
      `/municipality-pricing/municipality/${municipalityId}`,
      { method: 'PATCH', body: payload, auth: true, toastSuccess: true },
    ),

  /** Borra la tarifa propia: el municipio vuelve a heredar la general. */
  resetMunicipality: (municipalityId: number) =>
    http<{ message?: string }>(
      `/municipality-pricing/municipality/${municipalityId}`,
      { method: 'DELETE', auth: true, toastSuccess: true },
    ),
};
