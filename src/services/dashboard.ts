import { http } from '@/lib/http';

export type AdminDashboardStats = {
  users: number;
  businesses: number;
  deliveries: number;
  pendingDeliveries: number;
  pendingOrders: number;
  activeOrders: number;
  serviceFeeTotal: number;
};

/** `pendingOrders` no viaja acá: el dashboard lo comparte con el badge del
 * sidebar vía `usePendingOrdersCount` (mismo dato, sin pedirlo dos veces). */
export type BusinessDashboardStats = {
  activeOrders: number;
  deliveredOrders: number;
  products: number;
};

/**
 * Contadores de los dashboards en una sola petición cada uno (antes eran
 * varias peticiones de `perPage=1` solo para leer `pagination.total`).
 */
export const dashboardService = {
  admin: () =>
    http<{ data: AdminDashboardStats }>('/dashboard/admin', { auth: true }),

  business: () =>
    http<{ data: BusinessDashboardStats }>('/dashboard/business', {
      auth: true,
    }),
};
