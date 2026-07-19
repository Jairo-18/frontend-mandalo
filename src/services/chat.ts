import { http } from '@/lib/http';
import { Paginated } from '@/services/admin-users';

/** Participante del chat (cabecera y burbujas del otro). */
export type ChatParticipant = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
};

export type ChatMessage = {
  id: number;
  senderUserId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
};

/** Cabecera + primera página de mensajes de `GET /chat/:invoiceId`. */
export type ChatThread = {
  invoiceId: number;
  stateCode: string | null;
  /** true = se puede escribir (repartidor asignado y pedido en curso). */
  active: boolean;
  client: ChatParticipant | null;
  delivery: ChatParticipant | null;
  messages: Paginated<ChatMessage>;
};

/** Item de "Mis chats" (`GET /chat/threads`). */
export type ChatThreadItem = {
  invoiceId: number;
  stateCode: string | null;
  active: boolean;
  client: ChatParticipant | null;
  delivery: ChatParticipant | null;
  lastMessage: { body: string; at: string } | null;
  unreadCount: number;
  takenAt: string | null;
};

/**
 * Chat por pedido (cliente ↔ repartidor asignado). Los mensajes en vivo
 * llegan por el socket `/orders` (evento `chat:message`, ver orders-socket).
 */
export const chatService = {
  /** Mis hilos, actividad más reciente primero. */
  threads: (params: { page: number; perPage?: number }) =>
    http<Paginated<ChatThreadItem>>(
      `/chat/threads?page=${params.page}&perPage=${params.perPage ?? 20}`,
      { auth: true },
    ),

  /** Hilo de un pedido: contraparte + mensajes (nuevos primero). */
  thread: (invoiceId: number, page = 1, perPage = 30) =>
    http<{ data: ChatThread }>(
      `/chat/${invoiceId}?page=${page}&perPage=${perPage}`,
      { auth: true },
    ),

  send: (invoiceId: number, body: string) =>
    http<{ data: ChatMessage }>(`/chat/${invoiceId}/messages`, {
      method: 'POST',
      body: { body },
      auth: true,
    }),

  /** Marca leídos los mensajes del otro (silencioso, alimenta el badge). */
  markRead: (invoiceId: number) =>
    http(`/chat/${invoiceId}/read`, {
      method: 'PATCH',
      auth: true,
      toastError: false,
    }),

  /** Total de no-leídos en todos mis hilos (badge del sidebar). Silencioso. */
  unreadCount: async (): Promise<number> => {
    const res = await http<{ data: { count: number } }>('/chat/unread-count', {
      auth: true,
      toastError: false,
    });
    return res.data.count;
  },
};
