import { apiUrl, CLIENT_API_KEY } from '@/constants/api';
import { getSession } from '@/lib/session';
import { toast } from '@/lib/toast';

export class HttpError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

type Options = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Bearer explícito; si se omite y hay sesión, usa el token de la sesión. */
  token?: string;
  /** Adjunta el Bearer de la sesión actual automáticamente (default: false). */
  auth?: boolean;
  /** Muestra un toast con el `message` del backend si falla (default: true). */
  toastError?: boolean;
  /** Muestra un toast con el `message` del backend si sale bien (default: false). */
  toastSuccess?: boolean;
};

function pickMessage(json: any, fallback: string): string {
  const raw = json?.message ?? fallback;
  return Array.isArray(raw) ? raw.join('\n') : String(raw);
}

/**
 * Interceptor HTTP: hace el fetch, extrae el `message` del backend y muestra
 * el toast correspondiente (error automático, success opt-in). Devuelve el
 * JSON parseado o lanza `HttpError`. Evita repetir los mensajes en cada pantalla.
 */
export async function http<T = unknown>(
  path: string,
  options: Options = {},
): Promise<T> {
  const {
    method = 'GET',
    body,
    token,
    auth = false,
    toastError = true,
    toastSuccess = false,
  } = options;

  const bearer = token ?? (auth ? getSession()?.accessToken : undefined);

  let res: Response;
  try {
    res = await fetch(apiUrl(path), {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(CLIENT_API_KEY ? { 'X-Client-Key': CLIENT_API_KEY } : {}),
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    const message = 'No se pudo conectar con el servidor';
    if (toastError) toast.error(message);
    throw new HttpError(message, 0, null);
  }

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const message = pickMessage(json, 'Ocurrió un error inesperado');
    if (toastError) toast.error(message);
    throw new HttpError(message, res.status, json);
  }

  if (toastSuccess && json?.message) {
    toast.success(pickMessage(json, ''));
  }

  return json as T;
}
