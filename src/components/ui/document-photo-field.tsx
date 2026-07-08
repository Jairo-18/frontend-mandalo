import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Image, Pressable, Text, View } from 'react-native';

import { toast } from '@/lib/toast';

type Props = {
  label: string;
  /** Uri local de la foto elegida (o URL guardada, para previsualizar). */
  uri?: string | null;
  onChange: (uri: string) => void;
  /** Mensaje de error de validación (se muestra debajo del campo). */
  error?: string;
  /** Icono del placeholder cuando no hay foto. */
  placeholderIcon?: keyof typeof Ionicons.glyphMap;
};

/**
 * Campo de foto de DOCUMENTO (cédula por delante/detrás): rectangular y SIN
 * el editor de recorte cuadrado — el documento debe verse completo. Al tocar
 * abre galería o cámara y entrega la uri tal cual (el backend la optimiza).
 */
export function DocumentPhotoField({
  label,
  uri,
  onChange,
  error,
  placeholderIcon = 'card-outline',
}: Props) {
  async function pick(source: 'library' | 'camera') {
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
      onChange(result.assets[0].uri);
    } catch {
      toast.error(
        source === 'camera'
          ? 'No se pudo abrir la cámara'
          : 'No se pudo abrir la galería',
      );
    }
  }

  function choose() {
    Alert.alert(label, undefined, [
      { text: 'Elegir de la galería', onPress: () => pick('library') },
      { text: 'Tomar foto', onPress: () => pick('camera') },
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
            : uri
              ? 'border-gray-200'
              : 'border-dashed border-gray-300 bg-surface'
        }`}
      >
        {uri ? (
          <>
            <Image
              source={{ uri }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
            {/* Badge de cámara: se puede tocar para cambiar la foto */}
            <View className="absolute bottom-2 right-2 h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-primary">
              <Ionicons name="camera-outline" size={15} color="#FFFFFF" />
            </View>
          </>
        ) : (
          <>
            <Ionicons name={placeholderIcon} size={30} color="#7A7A8A" />
            <Text className="mt-1.5 text-xs font-medium text-muted">
              Toca para subir la foto
            </Text>
          </>
        )}
      </Pressable>

      {error ? (
        <Text className="mt-1 text-xs font-medium text-red-500">{error}</Text>
      ) : null}
    </View>
  );
}
