import { Ionicons } from '@expo/vector-icons';
import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Image, Platform, Pressable, Text, View } from 'react-native';

import { toast } from '@/lib/toast';
import { DocumentValue } from '@/lib/upload';

type Props = {
  label: string;
  value?: DocumentValue | null;
  onChange: (value: DocumentValue) => void;
  /** Mensaje de error de validación (se muestra debajo del campo). */
  error?: string;
};

/**
 * Elige un PDF con el picker de archivos: nativo usa `File.pickFileAsync`
 * (expo-file-system, sin dependencia nueva); web NO lo soporta (warning
 * "not supported on web") así que usa un `<input type=file>` del DOM.
 */
async function pickPdf(): Promise<{ uri: string } | null> {
  if (Platform.OS === 'web') {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/pdf';
      input.onchange = () => {
        const file = input.files?.[0];
        resolve(file ? { uri: URL.createObjectURL(file) } : null);
      };
      input.click();
    });
  }
  const picked = await File.pickFileAsync({ mimeTypes: ['application/pdf'] });
  if (picked.canceled || !picked.result) return null;
  return { uri: picked.result.uri };
}

/**
 * Campo de documento del vehículo (SOAT / tecnomecánica): a diferencia de
 * `DocumentPhotoField`, acepta foto O PDF — en la práctica muchos llegan como
 * certificado digital de una sola página y obligar a fotografiar el papel
 * impreso da peor calidad. El backend decide cómo guardarlo según el mimetype.
 */
export function VehicleDocumentField({ label, value, onChange, error }: Props) {
  async function pickImage(source: 'library' | 'camera') {
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
      onChange({ uri: result.assets[0].uri, kind: 'image' });
    } catch {
      toast.error(
        source === 'camera'
          ? 'No se pudo abrir la cámara'
          : 'No se pudo abrir la galería',
      );
    }
  }

  async function handlePickPdf() {
    try {
      const picked = await pickPdf();
      if (picked) onChange({ uri: picked.uri, kind: 'pdf' });
    } catch {
      toast.error('No se pudo abrir el selector de archivos');
    }
  }

  function choose() {
    Alert.alert(label, undefined, [
      { text: 'Elegir de la galería', onPress: () => pickImage('library') },
      { text: 'Tomar foto', onPress: () => pickImage('camera') },
      { text: 'Elegir archivo PDF', onPress: handlePickPdf },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-bold text-gray-700">{label}</Text>

      <Pressable
        onPress={choose}
        className={`h-[130px] items-center justify-center overflow-hidden rounded-xl border active:opacity-80 ${
          error
            ? 'border-red-500'
            : value
              ? 'border-gray-200'
              : 'border-dashed border-gray-300 bg-surface'
        }`}
      >
        {value?.kind === 'image' ? (
          <Image
            source={{ uri: value.uri }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : value?.kind === 'pdf' ? (
          <View className="items-center justify-center">
            <Ionicons name="document-text-outline" size={32} color="#FF5A3C" />
            <Text className="mt-1.5 text-xs font-bold text-dark">
              Documento PDF listo
            </Text>
          </View>
        ) : (
          <>
            <Ionicons name="document-attach-outline" size={30} color="#7A7A8A" />
            <Text className="mt-1.5 px-4 text-center text-xs font-medium text-muted">
              Toca para subir una foto o un PDF
            </Text>
          </>
        )}

        {value ? (
          <View className="absolute bottom-2 right-2 h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-primary">
            <Ionicons name="swap-horizontal-outline" size={15} color="#FFFFFF" />
          </View>
        ) : null}
      </Pressable>

      {error ? (
        <Text className="mt-1 text-xs font-medium text-red-500">{error}</Text>
      ) : null}
    </View>
  );
}
