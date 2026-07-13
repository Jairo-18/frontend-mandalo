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

/** Tiempo máximo de espera de una petición (fetch en RN no trae timeout). */
const REQUEST_TIMEOUT_MS = 15000;

/** Las subidas de archivos (multipart) pueden tardar más que un JSON. */
const UPLOAD_TIMEOUT_MS = 60000;

function pickMessage(json: unknown, fallback: string): string {
  const raw =
    json && typeof json === 'object' && 'message' in json
      ? ((json as { message?: unknown }).message ?? fallback)
      : fallback;
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

  // Petición autenticada sin sesión: pasa cuando una pantalla aún montada
  // refetchea justo después del logout (p. ej. el feed del explorar al
  // vaciarse el caché de direcciones). Saldría sin Bearer y el backend
  // contestaría 401 "Unauthorized" — se aborta acá, sin toast.
  if (auth && !bearer) {
    throw new HttpError('Sesión cerrada', 401, null);
  }

  // FormData (subida de archivos): fetch pone solo el Content-Type multipart
  // con su boundary; forzar application/json lo rompería.
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const controller = new AbortController();
  // El fetch de Expo (WinterCG) NO lanza `AbortError` al abortar: lanza
  // TypeError "Failed fetch, request canceled". Se marca el timeout con un
  // flag propio para distinguir "tardó demasiado" de "no hay conexión".
  const timeoutMs = isFormData ? UPLOAD_TIMEOUT_MS : REQUEST_TIMEOUT_MS;
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  let res: Response;
  try {
    res = await fetch(apiUrl(path), {
      method,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(CLIENT_API_KEY ? { 'X-Client-Key': CLIENT_API_KEY } : {}),
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
      },
      ...(body !== undefined
        ? { body: isFormData ? (body as FormData) : JSON.stringify(body) }
        : {}),
      signal: controller.signal,
    });
  } catch (e) {
    // En desarrollo se imprime el error crudo del fetch (sale en Metro):
    // el toast genérico esconde la causa real (timeout, DNS, TLS, archivo…).
    if (__DEV__) console.error(`[http] ${method} ${path} falló:`, e);
    const isTimeout =
      timedOut || (e instanceof Error && e.name === 'AbortError');
    const message = isTimeout
      ? 'El servidor tardó demasiado en responder'
      : 'No se pudo conectar con el servidor';
    if (toastError) toast.error(message);
    // La causa cruda viaja en el body para poder diagnosticar en release
    // (p. ej. la pantalla de error del arranque la muestra en letra pequeña).
    const raw = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    const cause = isTimeout ? `timeout ${timeoutMs / 1000}s (${raw})` : raw;
    throw new HttpError(message, 0, { cause });
  } finally {
    clearTimeout(timeoutId);
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
