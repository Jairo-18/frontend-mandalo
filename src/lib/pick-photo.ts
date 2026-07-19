import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

import { toast } from '@/lib/toast';

/**
 * Selector de foto de un solo toque (sin campo de formulario): Alert nativo
 * "galería / cámara" → entrega la uri tal cual (el backend la optimiza).
 * Mismo flujo que DocumentPhotoField pero para acciones puntuales (p. ej.
 * subir el soporte de pago desde el detalle del pedido).
 */
export function pickPhoto(title: string, onPicked: (uri: string) => void) {
  Alert.alert(title, undefined, [
    { text: 'Elegir de la galería', onPress: () => pick('library', onPicked) },
    { text: 'Tomar foto', onPress: () => pick('camera', onPicked) },
    { text: 'Cancelar', style: 'cancel' },
  ]);
}

async function pick(
  source: 'library' | 'camera',
  onPicked: (uri: string) => void,
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
    onPicked(result.assets[0].uri);
  } catch {
    toast.error(
      source === 'camera'
        ? 'No se pudo abrir la cámara'
        : 'No se pudo abrir la galería',
    );
  }
}
