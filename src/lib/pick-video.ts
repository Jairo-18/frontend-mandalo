import * as ImagePicker from 'expo-image-picker';

import { toast } from '@/lib/toast';

/** Igual que `MAX_VIDEO_SECONDS` del backend (video de producto). */
export const MAX_VIDEO_SECONDS = 10;

export type PickedVideo = { uri: string; durationMs: number | null; mimeType: string };

/**
 * Video corto del producto, de la galería o grabado en el momento. La cámara
 * ya corta en 10 s (`videoMaxDuration`); de la galería se valida la duración
 * acá (el backend igual la revisa y además lo deja 4:3 horizontal 960×720).
 */
export async function pickVideo(
  source: 'library' | 'camera',
  onPicked: (video: PickedVideo) => void,
) {
  try {
    let result: ImagePicker.ImagePickerResult;
    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        toast.error('Permite el acceso a la cámara para grabar el video');
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['videos'],
        videoMaxDuration: MAX_VIDEO_SECONDS,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        // iOS deja recortarlo a 10 s al elegirlo; Android no (se valida abajo).
        allowsEditing: true,
        videoMaxDuration: MAX_VIDEO_SECONDS,
      });
    }
    const asset = result.canceled ? null : result.assets?.[0];
    if (!asset) return;

    // `duration` viene en milisegundos (null si el SO no la informa: el
    // backend decide). Medio segundo de holgura, igual que el servidor.
    if (asset.duration != null && asset.duration > (MAX_VIDEO_SECONDS + 0.5) * 1000) {
      toast.error(
        `El video puede durar máximo ${MAX_VIDEO_SECONDS} segundos (el tuyo dura ${Math.round(asset.duration / 1000)}). Recórtalo e inténtalo de nuevo.`,
      );
      return;
    }
    onPicked({
      uri: asset.uri,
      durationMs: asset.duration ?? null,
      mimeType: asset.mimeType ?? 'video/mp4',
    });
  } catch {
    toast.error(
      source === 'camera' ? 'No se pudo abrir la cámara' : 'No se pudo abrir la galería',
    );
  }
}
