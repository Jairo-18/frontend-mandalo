import { http } from '@/lib/http';
import { filePart } from '@/lib/upload';
import { Paginated } from '@/services/admin-users';

/** Reporte de accidente tal como lo devuelve el backend. */
export type DeliveryAccident = {
  id: number;
  deliveryUserId: string;
  deliveryUser?: { id: string; fullName: string; phone: string | null; arlIndividualNumber: string | null } | null;
  invoiceId: number | null;
  invoice?: {
    id: number;
    deliveryAddress: string;
    organizational?: { tradeName: string | null; legalName: string } | null;
    details?: { productName: string; quantity: number }[];
  } | null;
  reasonCode: string;
  notes: string | null;
  photos: string[];
  incidentAt: string;
  reviewedAt: string | null;
  reviewedByAdminId: string | null;
  reviewedByAdmin?: { id: string; fullName: string } | null;
  createdAt: string;
};

/** Info de ARL que se le muestra al repartidor justo después de reportar. */
export type ArlInfo = {
  arlCompanyName: string | null;
  arlPolicyNumber: string | null;
  arlIndividualNumber: string | null;
};

export const REASON_OPTIONS = [
  'Choque con otro vehículo',
  'Caída',
  'Otro',
] as const;

export const deliveryAccidentService = {
  /** El repartidor reporta (multipart, hasta 5 fotos). */
  report: async (params: {
    invoiceId: number;
    reasonCode: string;
    notes?: string;
    photoUris: string[];
  }): Promise<{ data: ArlInfo }> => {
    const form = new FormData();
    form.append('invoiceId', String(params.invoiceId));
    form.append('reasonCode', params.reasonCode);
    if (params.notes) form.append('notes', params.notes);
    for (let i = 0; i < params.photoUris.length; i++) {
      form.append('photos', await filePart(params.photoUris[i]), `accident-${i}.jpg`);
    }
    return http<{ data: ArlInfo }>('/delivery-accident/report', {
      method: 'POST',
      body: form,
      auth: true,
    });
  },

  /** Solo ADMIN. */
  paginated: (params: { page: number; perPage?: number; onlyPending?: boolean }) => {
    const query = new URLSearchParams({
      page: String(params.page),
      perPage: String(params.perPage ?? 20),
    });
    if (params.onlyPending != null) {
      query.set('onlyPending', String(params.onlyPending));
    }
    return http<Paginated<DeliveryAccident>>(
      `/delivery-accident/paginated?${query.toString()}`,
      { auth: true },
    );
  },

  /** Badge del sidebar admin. */
  unreviewedCount: () =>
    http<{ data: { total: number } }>('/delivery-accident/unreviewed-count', {
      auth: true,
      toastError: false,
    }).then((res) => res.data.total),

  getOne: (id: number) =>
    http<{ data: DeliveryAccident }>(`/delivery-accident/${id}`, { auth: true }),

  /** "Procesar accidente" — el admin lo marca como atendido. */
  review: (id: number) =>
    http<{ message?: string }>(`/delivery-accident/${id}/review`, {
      method: 'PATCH',
      auth: true,
      toastSuccess: true,
    }),
};
