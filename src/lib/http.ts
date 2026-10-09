import { apiUrl, CLIENT_API_KEY } from '@/constants/api';
import { isKnownOffline } from '@/lib/network-status';
import { getSession, setSession } from '@/lib/session';
import { toast } from '@/lib/toast';

/** Mensaje cuando NetInfo ya confirmó que no hay red (distinto de "el
 * servidor no responde": acá el problema es del lado del teléfono). */
const OFFLINE_MESSAGE = 'Sin conexión a internet. Revisa tu wifi o datos móviles.';

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
 * `true` cuando NO se sabe si la acción realmente pasó del otro lado —
 * timeout, offline o corte de red (`status === 0`, ver `http()`/`httpUpload()`
 * más abajo). Un 4xx/5xx real NO es ambiguo: el backend SÍ respondió con una
 * decisión clara (código incorrecto, transición inválida, etc.), no hay nada
 * que reconciliar. Se usa en las pantallas de pedidos para decidir si vale
 * la pena recargar tras un error (evita una petición extra en el caso común
 * de un rechazo normal, y sí recarga cuando de verdad puede haber quedado
 * desincronizada la pantalla).
 */
export function isAmbiguousFailure(e: unknown): boolean {
  return e instanceof HttpError && e.status === 0;
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

/**
 * Renovación del accessToken con el refreshToken guardado:
 * - `ok`: hay tokens nuevos en la sesión → se reintenta la petición.
 * - `rejected`: el backend rechazó el refreshToken (401/403) → sesión muerta.
 * - `failed`: sin red, timeout, 5xx, 429… → NO se sabe; la sesión se conserva.
 *
 * Antes, cualquier 401 cerraba la sesión. El accessToken solo se renovaba al
 * abrir la app, así que con la app abierta (o reabierta desde segundo plano)
 * más tiempo que su vigencia, o tras arrancar sin red, el primer 401 sacaba
 * al usuario a la vista de invitado.
 */
export type RefreshResult = 'ok' | 'rejected' | 'failed';

/** Una sola renovación en vuelo aunque fallen varias peticiones a la vez. */
let refreshing: Promise<RefreshResult> | null = null;

export function refreshSessionTokens(): Promise<RefreshResult> {
  if (refreshing) return refreshing;
  refreshing = doRefresh().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

async function doRefresh(): Promise<RefreshResult> {
  const session = getSession();
  if (!session?.refreshToken) return 'rejected';
  if (isKnownOffline()) return 'failed';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    // fetch directo (no `http()`): evita el ciclo con `services/auth.ts`.
    const res = await fetch(apiUrl('/auth/refresh-token'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(CLIENT_API_KEY ? { 'X-Client-Key': CLIENT_API_KEY } : {}),
      },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
      signal: controller.signal,
    });
    if (res.status === 401 || res.status === 403) return 'rejected';
    if (!res.ok) return 'failed';
    const json = (await res.json().catch(() => null)) as {
      data?: {
        tokens?: { accessToken: string; refreshToken: string };
        user?: typeof session.user;
      };
    } | null;
    const tokens = json?.data?.tokens;
    if (!tokens?.accessToken) return 'failed';
    // Cerró sesión (o cambió de cuenta) mientras tanto: no resucitarla.
    if (getSession()?.refreshToken !== session.refreshToken) {
      return getSession() ? 'ok' : 'rejected';
    }
    await setSession({ ...session, ...tokens, user: json?.data?.user ?? session.user });
    return 'ok';
  } catch {
    return 'failed';
  } finally {
    clearTimeout(timeoutId);
  }
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
  /** Interno: ya se reintentó tras renovar el token (no volver a intentarlo). */
  retried?: boolean;
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
    retried = false,
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

  // Falla al instante si ya sabemos que no hay red — sin esto, cada acción
  // (aceptar, despachar…) se quedaba esperando el timeout completo (15-60s)
  // sin ningún indicio de qué estaba pasando mientras tanto.
  if (isKnownOffline()) {
    if (toastError) toast.error(OFFLINE_MESSAGE);
    throw new HttpError(OFFLINE_MESSAGE, 0, { cause: 'offline (NetInfo)' });
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
    // La red pudo caerse DURANTE la espera (NetInfo tarda un poco en
    // enterarse) — se revisa de nuevo acá, no solo antes del fetch.
    const message = isTimeout
      ? 'El servidor tardó demasiado en responder'
      : isKnownOffline()
        ? OFFLINE_MESSAGE
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
    // Solo con el Bearer AUTOMÁTICO de la sesión (`auth`/`authOptional`).
    // `signOut` manda un `token` explícito — si no se excluyera, un 401 ahí
    // (sesión ya muerta) volvería a llamarse a sí mismo sin parar.
    if (res.status === 401 && (auth || authOptional) && bearer && !token) {
      // Token vencido: se renueva y se reintenta UNA vez. Solo se cierra la
      // sesión si el backend rechaza también el refreshToken.
      const outcome = retried ? 'rejected' : await refreshSessionTokens();
      if (outcome === 'ok') return http<T>(path, { ...options, retried: true });
      if (outcome === 'rejected') notifyUnauthorized();
    }
    if (toastError) toast.error(message);
    throw new HttpError(message, res.status, json);
  }

  if (toastSuccess && json?.message) {
    toast.success(pickMessage(json, ''));
  }

  return json as T;
}

type UploadOptions = {
  method?: 'POST' | 'PATCH' | 'PUT';
  /** Interno: ya se reintentó tras renovar el token. */
  retried?: boolean;
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
    retried = false,
  } = options;

  const bearer = auth ? getSession()?.accessToken : undefined;
  if (auth && !bearer) {
    return Promise.reject(new HttpError('Sesión cerrada', 401, null));
  }

  // Mismo fail-fast que `http()`: sin esto, subir una foto sin red esperaba
  // el timeout de subida completo (60s) sin avisar nada mientras tanto.
  if (isKnownOffline()) {
    if (toastError) toast.error(OFFLINE_MESSAGE);
    return Promise.reject(
      new HttpError(OFFLINE_MESSAGE, 0, { cause: 'offline (NetInfo)' }),
    );
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
        const fail = () => {
          if (toastError) toast.error(message);
          reject(new HttpError(message, xhr.status, json));
        };
        if (xhr.status === 401 && auth && bearer) {
          // Igual que `http()`: renovar el token y reintentar una vez.
          void (retried ? Promise.resolve<RefreshResult>('rejected') : refreshSessionTokens()).then(
            (outcome) => {
              if (outcome === 'ok') {
                resolve(httpUpload<T>(path, form, { ...options, retried: true }));
                return;
              }
              if (outcome === 'rejected') notifyUnauthorized();
              fail();
            },
          );
          return;
        }
        fail();
      }
    };

    xhr.onerror = () => {
      const message = isKnownOffline()
        ? OFFLINE_MESSAGE
        : 'No se pudo conectar con el servidor';
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
