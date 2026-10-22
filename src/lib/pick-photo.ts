import * as ImagePicker from 'expo-image-picker';

import { toast } from '@/lib/toast';

/**
 * Selector de foto de un solo toque (sin campo de formulario, sin editor de
 * recorte): entrega la uri tal cual (el backend la optimiza). Lo usan
 * acciones puntuales fuera de un formulario (p. ej. subir el soporte de pago
 * desde el detalle del pedido) junto con `PhotoActionsSheet` para elegir
 * galería/cámara con la estética de la marca.
 */
export async function pickPhoto(
  source: 'library' | 'camera',
  /** `asset` trae ancho/alto (para pasarla luego por el `PhotoEditor`). */
  onPicked: (uri: string, asset: { width: number; height: number }) => void,
) {
  try {
    let result: ImagePicker.ImagePickerResult;
    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        toast.error('Permite el acceso a la cámara para tomar la foto');
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
    }
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    onPicked(asset.uri, { width: asset.width, height: asset.height });
  } catch {
    toast.error(
      source === 'camera'
        ? 'No se pudo abrir la cámara'
        : 'No se pudo abrir la galería',
    );
  }
}
