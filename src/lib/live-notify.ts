/**
 * Avisos del sistema para la versión WEB. En nativo no hace falta nada: las
 * notificaciones llegan por push (`lib/push.ts`) aunque la app esté cerrada,
 * con sonido y vibración propios del canal de Android / del payload de iOS.
 *
 * La implementación real vive en `live-notify.web.ts`.
 */
export function useLiveNotifications(): void {}

/**
 * Mismas exportaciones que la versión web para que el import tipe igual en las
 * dos plataformas. En nativo nunca hay permiso que pedir: el push del sistema
 * ya se encarga.
 */
export type NotifyPermission = 'granted' | 'denied' | 'default' | 'unsupported';

export function getNotifyPermission(): NotifyPermission {
  return 'unsupported';
}

export async function requestNotifyPermission(): Promise<NotifyPermission> {
  return 'unsupported';
}
