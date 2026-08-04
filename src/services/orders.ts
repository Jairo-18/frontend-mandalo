import { http } from '@/lib/http';
import { OrderStateCode } from '@/lib/order-status';
import { filePart } from '@/lib/upload';
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
  /** Recargos del Anexo I (nocturno/clima/demanda + segundo intento) — 100% repartidor. */
  deliverySurcharge: number;
  /** Tarifa de servicio: % del subtotal (sin domicilio). */
  serviceFee: number;
  total: number;
  notes: string | null;
  cancellationReason: string | null;
  /** Motivo por el que el repartidor no pudo entregar (estado FALL). */
  deliveryFailReason: string | null;
  /** Foto del sitio/paquete que subió el repartidor al reportar la falla. */
  deliveryFailPhotoUrl: string | null;
  deliveryFailedAt: string | null;
  /** 0 = nunca se reintentó; 1 = ya se usó el único reintento permitido. */
  retryCount: number;
  /** Cuánto se cobró por el reintento (0 si nunca se reintentó). */
  retryFeeCharged: number;
  /** Soporte del pago (foto/pantallazo) cuando el método no es efectivo. */
  paymentProofUrl: string | null;
  /** Si el negocio rechazó el comprobante: el motivo (el cliente re-sube). */
  paymentProofRejectedReason: string | null;
  createdAt: string | null;
  // Cuándo ocurrió cada transición (null si aún no pasa por ahí).
  acceptedAt: string | null;
  preparingAt: string | null;
  takenAt: string | null;
  onRouteAt: string | null;
  /** El repartidor marcó "En sitio" — arranca la espera del segundo intento. */
  arrivedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  /** Minutos de preparación que prometió el negocio al aceptar. */
  prepEstimatedMinutes: number | null;
  /** Minutos de entrega estimados al despachar (distancia o fijo). */
  deliveryEstimatedMinutes: number | null;
  /** Código de recogida: SOLO lo recibe el repartidor asignado (lo dicta al negocio). */
  pickupCode?: string | null;
  /** Código de entrega: SOLO lo recibe el cliente dueño (lo dicta al repartidor). */
  deliveryCode?: string | null;
  details?: OrderDetail[];
  organizational?: {
    id: number;
    legalName: string;
    tradeName: string | null;
    logoUrl: string | null;
    phone: string | null;
    address: string | null;
    /** Punto de recogida (pin del negocio en el mapa del pedido). */
    latitude?: number | null;
    longitude?: number | null;
    /** Datos para pagar (los ve el cliente al subir el comprobante). */
    paymentHolderName?: string | null;
    nequiNumber?: string | null;
    nequiKey?: string | null;
    bancolombiaAccount?: string | null;
    bancolombiaAccountType?: 'AHORROS' | 'CORRIENTE' | null;
    bancolombiaQrUrl?: string | null;
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
  /** Orden por fecha de creación (DESC = más nuevos primero, el default). */
  order?: 'ASC' | 'DESC';
  /**
   * Coords del repartidor (solo `available`): limita al radio de cercanía y
   * ordena por distancia al negocio.
   */
  near?: { latitude: number; longitude: number } | null;
  /** Solo ADMIN: pedidos de un negocio puntual (facturación). */
  organizationalId?: number;
  /** Solo ADMIN: entregados desde/hasta (YYYY-MM-DD, fecha local, inclusive). */
  deliveredFrom?: string;
  deliveredTo?: string;
};

function listQuery(params: ListParams): string {
  const query = new URLSearchParams({
    page: String(params.page),
    perPage: String(params.perPage ?? 20),
    // Sin esto el backend cae al default ASC del DTO de paginación.
    order: params.order ?? 'DESC',
  });
  if (params.stateCodes?.length) {
    query.set('stateCodes', params.stateCodes.join(','));
  }
  if (params.near) {
    query.set('lat', String(params.near.latitude));
    query.set('lng', String(params.near.longitude));
  }
  if (params.organizationalId) {
    query.set('organizationalId', String(params.organizationalId));
  }
  if (params.deliveredFrom) query.set('deliveredFrom', params.deliveredFrom);
  if (params.deliveredTo) query.set('deliveredTo', params.deliveredTo);
  return query.toString();
}

/**
 * Pedidos (módulo invoice). El backend resuelve el alcance por el ROL del JWT:
 * el cliente crea y ve los suyos, el negocio los de su negocio, el repartidor
 * los que toma. Los mensajes salen del backend (toast del interceptor).
 */
export const ordersService = {
  /**
   * Tarifa del domicilio EN VIVO por distancia (checkout): negocio +
   * coordenadas de la dirección elegida. Sin coordenadas cae a la tarifa fija
   * de respaldo (el backend decide) y `distanceKm` sale `null`. De paso trae
   * la tarifa de servicio (si se manda `subtotal`) y los recargos del Anexo I
   * (`deliverySurcharge`, con `surchargeReasons` para mostrarlos) — mismo
   * cálculo que hace el backend al crear el pedido, así el checkout no
   * duplica el % ni el tope.
   */
  deliveryFee: (params: {
    organizationalId: number;
    latitude?: number;
    longitude?: number;
    subtotal?: number;
  }) => {
    const query = new URLSearchParams({
      organizationalId: String(params.organizationalId),
    });
    if (params.latitude != null) query.set('latitude', String(params.latitude));
    if (params.longitude != null) {
      query.set('longitude', String(params.longitude));
    }
    if (params.subtotal != null) query.set('subtotal', String(params.subtotal));
    return http<{
      data: {
        deliveryFee: number;
        deliverySurcharge: number;
        surchargeReasons: string[];
        distanceKm: number | null;
        serviceFee: number;
      };
    }>(`/invoice/delivery-fee?${query.toString()}`, { auth: true });
  },

  /** Total histórico de tarifa de servicio (ingreso de Mándalo). Solo ADMIN. */
  serviceFeeSummary: () =>
    http<{ data: { total: number; ordersCount: number } }>(
      '/invoice/service-fee-summary',
      { auth: true },
    ),

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

  /**
   * Total de pedidos PENDIENTES (badge del panel del negocio). Reutiliza
   * `/invoice/paginated` con `perPage=1`: solo interesa `pagination.total`.
   * Silencioso: si falla no toastea — el badge simplemente no aparece.
   */
  pendingCount: () =>
    http<Paginated<Order>>(
      `/invoice/paginated?${listQuery({ page: 1, perPage: 1, stateCodes: ['PEND'] })}`,
      { auth: true, toastError: false },
    ).then((res) => res.pagination.total),

  /** Pedidos disponibles para tomar (rol DELI). */
  available: (params: ListParams) =>
    http<Paginated<Order>>(`/invoice/available?${listQuery(params)}`, {
      auth: true,
    }),

  get: (id: number) =>
    http<{ data: Order }>(`/invoice/${id}`, { auth: true }),

  /**
   * Sube/reemplaza el soporte de pago (solo el cliente dueño, métodos
   * distintos a efectivo). El backend avisa al negocio (socket + push).
   */
  uploadPaymentProof: async (id: number, uri: string) => {
    const form = new FormData();
    form.append('file', await filePart(uri), 'payment-proof.jpg');
    return http<{ data: { paymentProofUrl: string } }>(
      `/invoice/${id}/payment-proof`,
      { method: 'POST', body: form, auth: true, toastSuccess: true },
    );
  },

  /**
   * El negocio le pide al cliente el comprobante del pago (no cambia el
   * estado; el backend notifica al cliente por socket + push).
   */
  requestPayment: (id: number) =>
    http<{ message?: string }>(`/invoice/${id}/request-payment`, {
      method: 'POST',
      auth: true,
      toastSuccess: true,
    }),

  /** El negocio rechaza el comprobante (con motivo); el cliente vuelve a subir. */
  rejectPayment: (id: number, reason: string) =>
    http<{ message?: string }>(`/invoice/${id}/reject-payment`, {
      method: 'POST',
      body: { reason },
      auth: true,
      toastSuccess: true,
    }),

  /** El repartidor toma un pedido disponible. */
  take: (id: number) =>
    http<{ message?: string }>(`/invoice/${id}/take`, {
      method: 'POST',
      auth: true,
      toastSuccess: true,
    }),

  /** El repartidor marca que llegó a la dirección de entrega (obligatorio antes de "Marcar entregado"). */
  arrive: (id: number) =>
    http<{ message?: string }>(`/invoice/${id}/arrive`, {
      method: 'POST',
      auth: true,
      toastSuccess: true,
    }),

  /**
   * "¿Deseas esperar 5 minutos más?" — cliente o repartidor, cuando ya pasó
   * la espera desde "En sitio" sin completar la entrega. Cobra el segundo
   * intento (Anexo I) y reinicia el cronómetro.
   */
  retryAfterTimeout: (id: number) =>
    http<{ message?: string }>(`/invoice/${id}/retry-after-timeout`, {
      method: 'POST',
      auth: true,
      toastSuccess: true,
    }),

  /**
   * El repartidor reporta que no pudo entregar: motivo + FOTO OBLIGATORIA
   * del sitio/paquete (reunión 2026-08-04). Único camino a FALL.
   */
  reportFailure: async (id: number, photoUri: string, failureReason: string) => {
    const form = new FormData();
    form.append('photo', await filePart(photoUri), 'failure.jpg');
    form.append('failureReason', failureReason);
    return http<{ message?: string }>(`/invoice/${id}/report-failure`, {
      method: 'POST',
      body: form,
      auth: true,
      toastSuccess: true,
    });
  },

  /**
   * Cambia el estado (aceptar/preparar/en ruta/entregar/cancelar). Al
   * ACEPTAR el backend exige `prepEstimatedMinutes`; al CANCELAR, el motivo.
   * Reintentar tras una entrega fallida es este mismo método con
   * `stateCode: 'RUTA'` estando en FALL — el backend cobra el cargo del
   * Anexo I solo. (Reportar la entrega fallida en sí va por `reportFailure`,
   * que exige la foto — no por acá.)
   */
  changeState: (
    id: number,
    stateCode: OrderStateCode,
    extra?: {
      cancellationReason?: string;
      prepEstimatedMinutes?: number;
      /** RUTA: código de recogida (lo dicta el repartidor al negocio);
       *  ENTR: código de entrega (lo dicta el cliente al repartidor). */
      verificationCode?: string;
    },
  ) =>
    http<{ message?: string }>(`/invoice/${id}/state`, {
      method: 'PATCH',
      body: {
        stateCode,
        ...(extra?.cancellationReason
          ? { cancellationReason: extra.cancellationReason }
          : {}),
        ...(extra?.prepEstimatedMinutes
          ? { prepEstimatedMinutes: extra.prepEstimatedMinutes }
          : {}),
        ...(extra?.verificationCode
          ? { verificationCode: extra.verificationCode }
          : {}),
      },
      auth: true,
      toastSuccess: true,
    }),
};
