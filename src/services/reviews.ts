import { http } from '@/lib/http';
import { Paginated } from '@/services/admin-users';

/** A quién se califica dentro de un pedido. */
export type ReviewTargetType = 'BUSINESS' | 'DELIVERY' | 'CLIENT';

/** Máximo del comentario (igual que `REVIEW_COMMENT_MAX` del backend). */
export const REVIEW_COMMENT_MAX = 250;

export type Review = {
  id: number;
  /** 0.5 a 5, en medias estrellas. */
  rating: number;
  comment: string | null;
  createdAt: string;
  /** Rol del autor al reseñar: USER (cliente), NEGO o DELI. */
  authorRole: string;
  authorName: string | null;
  /** Logo del negocio (autor NEGO) o foto de la persona; null = sin foto. */
  authorImageUrl?: string | null;
};

/** Promedio + cantidad (guardados en el usuario/negocio calificado). */
export type RatingSummary = { average: number | null; count: number };

export type ReviewTarget = {
  targetType: ReviewTargetType;
  name: string;
  imageUrl: string | null;
  /** La que ya le dejé (las reseñas no se editan). */
  review: Review | null;
};

/** `GET /review/invoice/:id`: qué puedo calificar en ese pedido. */
export type InvoiceReviewStatus = {
  invoiceId: number;
  myRole: ReviewTargetType;
  /** Entregado y dentro de los 7 días. */
  open: boolean;
  deadline: string | null;
  /** `open` y queda al menos una parte sin calificar. */
  canReview: boolean;
  targets: ReviewTarget[];
};

export type ReviewsPage = { summary: RatingSummary; reviews: Paginated<Review> };

/** "Cliente", "Negocio", "Domiciliario" — etiqueta del autor/destino. */
export function reviewRoleLabel(role: string): string {
  if (role === 'NEGO' || role === 'BUSINESS') return 'Negocio';
  if (role === 'DELI' || role === 'DELIVERY') return 'Domiciliario';
  return 'Cliente';
}

export const reviewsService = {
  status: (invoiceId: number) =>
    http<{ data: InvoiceReviewStatus }>(`/review/invoice/${invoiceId}`, {
      auth: true,
      toastError: false,
    }),

  create: (
    invoiceId: number,
    body: { targetType: ReviewTargetType; rating: number; comment?: string },
  ) =>
    http<{ data: Review }>(`/review/invoice/${invoiceId}`, {
      method: 'POST',
      body,
      auth: true,
      toastSuccess: true,
    }),

  /** "Mis reseñas": las que recibí. */
  mine: (page = 1, perPage = 20) =>
    http<{ data: ReviewsPage }>(`/review/mine?page=${page}&perPage=${perPage}`, {
      auth: true,
    }),

  /** De un negocio (público). */
  forBusiness: (organizationalId: number, page = 1, perPage = 20) =>
    http<{ data: ReviewsPage }>(
      `/review/business/${organizationalId}?page=${page}&perPage=${perPage}`,
      { authOptional: true },
    ),

  /** Moderación (solo admin). */
  remove: (id: number) =>
    http<{ message?: string }>(`/review/${id}`, {
      method: 'DELETE',
      auth: true,
      toastSuccess: true,
    }),

  /** De un cliente o repartidor. */
  forUser: (userId: string, page = 1, perPage = 20) =>
    http<{ data: ReviewsPage }>(
      `/review/user/${userId}?page=${page}&perPage=${perPage}`,
      { auth: true },
    ),
};
