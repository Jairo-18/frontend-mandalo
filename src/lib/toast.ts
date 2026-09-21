import { haptics } from '@/lib/haptics';

export type ToastType = 'success' | 'error' | 'info';
export type ToastPayload = { id: number; type: ToastType; message: string };

type Listener = (t: ToastPayload) => void;

let listener: Listener | null = null;
let counter = 0;

function emit(type: ToastType, message: string) {
  if (!message) return;
  // Un ÚNICO punto para toda la app: cualquier toast de éxito o error, de
  // cualquier vista y de cualquier rol —incluidos los que dispara sola la capa
  // HTTP— trae su vibración sin tener que tocar cada pantalla.
  // `info` va mudo a propósito: es el más frecuente y el menos importante.
  if (type === 'success') haptics.success();
  else if (type === 'error') haptics.error();
  listener?.({ id: ++counter, type, message });
}

/** API para disparar toasts desde cualquier parte (incluida la capa HTTP). */
export const toast = {
  success: (message: string) => emit('success', message),
  error: (message: string) => emit('error', message),
  info: (message: string) => emit('info', message),
};

/** Lo usa `<ToastHost/>` para suscribirse. */
export function setToastListener(l: Listener | null) {
  listener = l;
}
