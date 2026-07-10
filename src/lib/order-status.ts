import { Ionicons } from '@expo/vector-icons';

/** Códigos de estado del pedido (deben coincidir con la tabla stateType). */
export type OrderStateCode =
  | 'PEND'
  | 'ACEP'
  | 'PREP'
  | 'RUTA'
  | 'ENTR'
  | 'CANC';

type StateMeta = {
  label: string;
  /** Tono del Badge/UI. */
  tone: 'amber' | 'primary' | 'green' | 'gray' | 'red';
  icon: keyof typeof Ionicons.glyphMap;
};

/** Etiqueta, color e icono de cada estado — se usa en las 3 vistas. */
export const ORDER_STATE: Record<OrderStateCode, StateMeta> = {
  PEND: { label: 'Pendiente', tone: 'amber', icon: 'time-outline' },
  ACEP: { label: 'Aceptado', tone: 'primary', icon: 'checkmark-circle-outline' },
  PREP: { label: 'En preparación', tone: 'primary', icon: 'restaurant-outline' },
  RUTA: { label: 'En camino', tone: 'primary', icon: 'bicycle-outline' },
  ENTR: { label: 'Entregado', tone: 'green', icon: 'checkmark-done-outline' },
  CANC: { label: 'Cancelado', tone: 'red', icon: 'close-circle-outline' },
};

/** Orden del flujo feliz (para el timeline del detalle). */
export const ORDER_FLOW: OrderStateCode[] = [
  'PEND',
  'ACEP',
  'PREP',
  'RUTA',
  'ENTR',
];

export function stateMeta(code: string): StateMeta {
  return (
    ORDER_STATE[code as OrderStateCode] ?? {
      label: code,
      tone: 'gray',
      icon: 'ellipse-outline',
    }
  );
}
