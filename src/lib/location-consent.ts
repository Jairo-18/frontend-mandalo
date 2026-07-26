import { deviceStoreGet, deviceStoreSet } from '@/lib/device-store';

/**
 * Aviso propio ANTES del permiso de ubicación EN PRIMER PLANO (registro,
 * "Usar mi ubicación actual" de direcciones, filtro de cercanía del
 * repartidor) — mismo espíritu que el `YesNoDialog` de ubicación en SEGUNDO
 * PLANO que ya exige Google Play (`delivery-tracker.ts`/§49), pero acá no es
 * un requisito legal de la política (esa aplica solo a "Permitir todo el
 * tiempo"): es para no saltar derecho al diálogo nativo del SO sin contexto,
 * como pidió el cliente. Un aviso por dispositivo (persistido); si el usuario
 * ya le dio permiso al SO alguna vez (o lo negó), este aviso no vuelve a
 * salir — ya sabe de qué se trata.
 */
const CONSENT_KEY = 'mandalo:fg-location-consent';

type VisibilityListener = (visible: boolean) => void;

let listener: VisibilityListener | null = null;
let pendingResolve: ((granted: boolean) => void) | null = null;
/** Caché en memoria: evita releer disco en cada pantalla que pide ubicación. */
let consented: boolean | null = null;

export function setLocationConsentListener(l: VisibilityListener | null): void {
  listener = l;
}

/**
 * Debe llamarse ANTES de `Location.requestForegroundPermissionsAsync()` en
 * cualquier parte de la app. Devuelve `false` solo si el usuario cerró el
 * aviso propio sin aceptar — quien llama debe tratarlo igual que un permiso
 * negado (no insistir, seguir sin ubicación).
 */
export async function ensureLocationConsent(): Promise<boolean> {
  if (consented === null) {
    consented = (await deviceStoreGet(CONSENT_KEY)) === 'granted';
  }
  if (consented) return true;
  if (!listener) return true; // host no montado todavía: no bloquear el arranque

  return new Promise<boolean>((resolve) => {
    pendingResolve = resolve;
    listener?.(true);
  });
}

export function resolveLocationConsent(granted: boolean): void {
  if (granted) {
    consented = true;
    void deviceStoreSet(CONSENT_KEY, 'granted');
  }
  listener?.(false);
  pendingResolve?.(granted);
  pendingResolve = null;
}
