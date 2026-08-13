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

/**
 * Qué hacer cuando el backend rechaza con 401 una sesión que SÍ mandamos
 * (token vencido/revocado, cuenta baneada a mitad de uso) — sin esto, el
 * interceptor solo mostraba el toast y el usuario quedaba colgado en la
 * pantalla actual. Se registra UNA vez desde `_layout.tsx` con
 * `signOutEverywhere` (`lib/sign-out.ts`); no se importa directo acá para no
 * armar un ciclo (`sign-out.ts` → `services/auth.ts` → `http.ts`).
 */
let unauthorizedHandler: (() => void) | null = null;
export function setUnauthorizedHandler(handler: () => void): void {
  unauthorizedHandler = handler;
}

/** Evita disparar el handler varias veces si llegan varios 401 casi juntos
 * (pantallas distintas refetcheando a la vez cuando la sesión muere). */
let handlingUnauthorized = false;
function notifyUnauthorized(): void {
  if (handlingUnauthorized) return;
  handlingUnauthorized = true;
  unauthorizedHandler?.();
  setTimeout(() => {
    handlingUnauthorized = false;
  }, 3000);
}

type Options = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Bearer explícito; si se omite y hay sesión, usa el token de la sesión. */
  token?: string;
  /** Adjunta el Bearer de la sesión actual automáticamente (default: false). */
  auth?: boolean;
  /**
   * Como `auth`, pero para endpoints PÚBLICOS que aceptan sesión opcional
   * (p. ej. el explorar en modo invitado, §44): adjunta el Bearer si hay
   * sesión, pero NO aborta si no la hay (sale solo con `X-Client-Key`).
   */
  authOptional?: boolean;
  /** Muestra un toast con el `message` del backend si falla (default: true). */
  toastError?: boolean;
  /** Muestra un toast con el `message` del backend si sale bien (default: false). */
  toastSuccess?: boolean;
};

/** Tiempo máximo de espera de una petición (fetch en RN no trae timeout). */
const REQUEST_TIMEOUT_MS = 15000;

/** Las subidas de archivos (multipart) pueden tardar más que un JSON. */
const UPLOAD_TIMEOUT_MS = 60000;

export function pickMessage(json: unknown, fallback: string): string {
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
    authOptional = false,
    toastError = true,
    toastSuccess = false,
  } = options;

  const bearer =
    token ?? (auth || authOptional ? getSession()?.accessToken : undefined);

  // Petición autenticada sin sesión: pasa cuando una pantalla aún montada
  // refetchea justo después del logout (p. ej. el feed del explorar al
  // vaciarse el caché de direcciones). Saldría sin Bearer y el backend
  // contestaría 401 "Unauthorized" — se aborta acá, sin toast. (`authOptional`
  // NO aborta: el endpoint es público y sale con solo el X-Client-Key.)
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
    // Solo dispara con el Bearer AUTOMÁTICO de la sesión (`auth`/`authOptional`).
    // `signOut` manda un `token` explícito — si no se excluyera, un 401 ahí
    // (sesión ya muerta) volvería a llamarse a sí mismo sin parar.
    if (res.status === 401 && (auth || authOptional) && bearer) {
      notifyUnauthorized();
    }
    throw new HttpError(message, res.status, json);
  }

  if (toastSuccess && json?.message) {
    toast.success(pickMessage(json, ''));
  }

  return json as T;
}

type UploadOptions = {
  method?: 'POST' | 'PATCH' | 'PUT';
  auth?: boolean;
  toastError?: boolean;
  toastSuccess?: boolean;
  /** Fracción 0–1 subida del body — para mostrar una barra de progreso real
   * en vez de un spinner ciego (registros/subidas con varias fotos tardan
   * bastante en conexión rural y sin esto se sienten "colgados"). */
  onProgress?: (fraction: number) => void;
};

/**
 * Como `http()` pero para `FormData` con progreso de subida real: `fetch` (RN
 * y web) no expone el avance del body saliente, solo `XMLHttpRequest` lo
 * hace (`upload.onprogress`) — por eso este helper es aparte en vez de una
 * opción más de `http()`. Mismo contrato de errores (`HttpError`) y toasts.
 */
export function httpUpload<T = unknown>(
  path: string,
  form: FormData,
  options: UploadOptions = {},
): Promise<T> {
  const {
    method = 'POST',
    auth = false,
    toastError = true,
    toastSuccess = false,
    onProgress,
  } = options;

  const bearer = auth ? getSession()?.accessToken : undefined;
  if (auth && !bearer) {
    return Promise.reject(new HttpError('Sesión cerrada', 401, null));
  }

  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, apiUrl(path));
    if (CLIENT_API_KEY) xhr.setRequestHeader('X-Client-Key', CLIENT_API_KEY);
    if (bearer) xhr.setRequestHeader('Authorization', `Bearer ${bearer}`);
    xhr.timeout = UPLOAD_TIMEOUT_MS;

    xhr.upload.onprogress = (e) => {
      if (onProgress && e.lengthComputable) onProgress(e.loaded / e.total);
    };

    xhr.onload = () => {
      let json: unknown = null;
      try {
        json = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        json = null;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        if (
          toastSuccess &&
          json &&
          typeof json === 'object' &&
          'message' in json
        ) {
          toast.success(pickMessage(json, ''));
        }
        resolve(json as T);
      } else {
        const message = pickMessage(json, 'Ocurrió un error inesperado');
        if (toastError) toast.error(message);
        if (xhr.status === 401 && auth && bearer) {
          notifyUnauthorized();
        }
        reject(new HttpError(message, xhr.status, json));
      }
    };

    xhr.onerror = () => {
      const message = 'No se pudo conectar con el servidor';
      if (toastError) toast.error(message);
      reject(new HttpError(message, 0, null));
    };

    xhr.ontimeout = () => {
      const message = 'El servidor tardó demasiado en responder';
      if (toastError) toast.error(message);
      reject(
        new HttpError(message, 0, {
          cause: `timeout ${UPLOAD_TIMEOUT_MS / 1000}s`,
        }),
      );
    };

    xhr.send(form);
  });
}
