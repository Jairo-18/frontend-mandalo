import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';

/**
 * Módulo nativo local (`android/.../NotifySoundModule.kt`, `ios/NotifySoundModule.swift`).
 * Nunca suena en vibración, silencio ni "No molestar". En web no existe (null).
 */
const NotifySound = requireOptionalNativeModule<{
  play(): Promise<boolean>;
  playMessage(): Promise<boolean>;
}>('NotifySound');

/**
 * `true` si este build pone su propio sonido a las notificaciones en primer
 * plano (solo Android con un APK/AAB nuevo; en iOS suena la notificación normal).
 */
export const hasNotifySound = NotifySound != null && Platform.OS === 'android';

/** Sonido de notificación del teléfono; `false` si no sonó. */
export async function playNotifySound(): Promise<boolean> {
  try {
    return (await NotifySound?.play()) ?? false;
  } catch {
    return false;
  }
}

/** "Pop" de mensaje recibido, para cuando ya se está mirando ese chat. */
export async function playMessageSound(): Promise<boolean> {
  try {
    return (await NotifySound?.playMessage()) ?? false;
  } catch {
    return false;
  }
}
