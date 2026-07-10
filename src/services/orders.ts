import { http } from '@/lib/http';
import { OrderStateCode } from '@/lib/order-status';
import { Paginated } from '@/services/admin-users';

/** Referencia de catálogo mínima (stateType / paidType). */
type Ref = { id: number; code: string; name: string };

/** Renglón del pedido (snapshot del producto al momento de pedir). */
export type OrderDetail = {
  id: number;
  productId: number | null;
  productName: string;
  unitPrice: number;
  discount: number;
  quantity: number;
  lineTotal: number;
  product?: { id: number; images: string[] } | null;
};

/** Pedido tal como lo devuelve `/invoice` (scoped por rol en el backend). */
export type Order = {
  id: number;
  userId: string;
  organizationalId: number;
  deliveryUserId: string | null;
  stateType: Ref | null;
  paidType: Ref | null;
  deliveryAddress: string;
  deliveryDetails: string | null;
  deliveryLatitude: number | null;
  deliveryLongitude: number | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
  notes: string | null;
  cancellationReason: string | null;
  createdAt: string | null;
  details?: OrderDetail[];
  organizational?: {
    id: number;
    legalName: string;
    tradeName: string | null;
    logoUrl: string | null;
    phone: string | null;
    address: string | null;
  } | null;
  // El cliente (visible para negocio/repartidor/admin).
  user?: { id: string; fullName: string; phone: string | null } | null;
  // El repartidor asignado (visible para cliente/negocio).
  deliveryUser?: { id: string; fullName: string; phone: string | null } | null;
};

export type CreateOrderPayload = {
  organizationalId: number;
  addressId: number;
  paidTypeCode: string;
  items: { productId: number; quantity: number }[];
  notes?: string;
};

type ListParams = {
  page: number;
  perPage?: number;
  /** Filtra por estados (códigos separados por coma). */
  stateCodes?: OrderStateCode[];
};

function listQuery(params: ListParams): string {
  const query = new URLSearchParams({
    page: String(params.page),
    perPage: String(params.perPage ?? 20),
  });
  if (params.stateCodes?.length) {
    query.set('stateCodes', params.stateCodes.join(','));
  }
  return query.toString();
}

/**
 * Pedidos (módulo invoice). El backend resuelve el alcance por el ROL del JWT:
 * el cliente crea y ve los suyos, el negocio los de su negocio, el repartidor
 * los que toma. Los mensajes salen del backend (toast del interceptor).
 */
export const ordersService = {
  /** Tarifa fija del domicilio (para mostrarla en el checkout). */
  deliveryFee: () =>
    http<{ data: { deliveryFee: number } }>('/invoice/delivery-fee', {
      auth: true,
    }),

  create: (payload: CreateOrderPayload) =>
    http<{ data: { rowId: string } }>('/invoice/create', {
      method: 'POST',
      body: payload,
      auth: true,
      toastSuccess: true,
    }),

  /** Listado según el rol (cliente/negocio/repartidor/admin). */
  paginated: (params: ListParams) =>
    http<Paginated<Order>>(`/invoice/paginated?${listQuery(params)}`, {
      auth: true,
    }),

  /** Pedidos disponibles para tomar (rol DELI). */
  available: (params: ListParams) =>
    http<Paginated<Order>>(`/invoice/available?${listQuery(params)}`, {
      auth: true,
    }),

  get: (id: number) =>
    http<{ data: Order }>(`/invoice/${id}`, { auth: true }),

  /** El repartidor toma un pedido disponible. */
  take: (id: number) =>
    http<{ message?: string }>(`/invoice/${id}/take`, {
      method: 'POST',
      auth: true,
      toastSuccess: true,
    }),

  /** Cambia el estado (aceptar/preparar/en ruta/entregar/cancelar). */
  changeState: (id: number, stateCode: OrderStateCode, cancellationReason?: string) =>
    http<{ message?: string }>(`/invoice/${id}/state`, {
      method: 'PATCH',
      body: { stateCode, ...(cancellationReason ? { cancellationReason } : {}) },
      auth: true,
      toastSuccess: true,
    }),
};
