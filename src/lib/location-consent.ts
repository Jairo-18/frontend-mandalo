import { deviceStoreGet, deviceStoreSet } from '@/lib/device-store';

/**
 * Aviso propio ANTES del permiso de ubicación EN PRIMER PLANO (registro,
 * "Usar mi ubicación actual" de direcciones, filtro de cercanía del
 * repartidor) — mismo espíritu que el `YesNoDialog` de ubicación en SEGUNDO
 * PLANO que ya exige Google Play (`delivery-tracker.ts`/§49), pero acá no es
 * un requisito legal de la política (esa aplica solo a "Permitir todo el
 * tiempo"): es para no saltar derecho al diálogo nativo del SO sin contexto,
 * como pidió el cliente. Un aviso por dispositivo (persistido); si el usuario
 * ya le dio permiso al SO alguna vez, este aviso no vuelve a salir.
 *
 * Apple (guideline 5.1.1(iv), rechazo 2026-09-24) exige que este aviso NO
 * tenga una salida que evite llegar al permiso nativo: por eso tiene un solo
 * botón ("Continuar", sin "Ahora no", sin cerrar tocando afuera — ver
 * `YesNoDialog`) y `ensureLocationConsent()` ya no puede resolver `false`.
 */
const CONSENT_KEY = 'mandalo:fg-location-consent';

type VisibilityListener = (visible: boolean) => void;

let listener: VisibilityListener | null = null;
let pendingResolve: (() => void) | null = null;
/** Caché en memoria: evita releer disco en cada pantalla que pide ubicación. */
let consented: boolean | null = null;

export function setLocationConsentListener(l: VisibilityListener | null): void {
  listener = l;
}

/**
 * Debe llamarse ANTES de `Location.requestForegroundPermissionsAsync()` en
 * cualquier parte de la app. Siempre termina en `true`: solo controla si hace
 * falta mostrar el aviso propio antes de pasar al permiso nativo del SO (que
 * es donde el usuario realmente decide aceptar o rechazar).
 */
export async function ensureLocationConsent(): Promise<true> {
  if (consented === null) {
    consented = (await deviceStoreGet(CONSENT_KEY)) === 'granted';
  }
  if (consented) return true;
  if (!listener) return true; // host no montado todavía: no bloquear el arranque

  return new Promise<true>((resolve) => {
    pendingResolve = () => resolve(true);
    listener?.(true);
  });
}

export function resolveLocationConsent(): void {
  consented = true;
  void deviceStoreSet(CONSENT_KEY, 'granted');
  listener?.(false);
  pendingResolve?.();
  pendingResolve = null;
}
