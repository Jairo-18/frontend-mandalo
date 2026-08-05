import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';

import { PhotoActionsSheet } from '@/components/ui/photo-actions-sheet';
import { PhotoPreviewModal } from '@/components/ui/photo-preview-modal';
import { resizeForUpload } from '@/lib/upload';
import { toast } from '@/lib/toast';
import { getAppColors } from '@/lib/app-colors';
import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';

type Props = {
  label: string;
  /** Uri local de la foto elegida (o URL guardada, para previsualizar). */
  uri?: string | null;
  onChange: (uri: string) => void;
  /** Quitar sin reemplazo (campo opcional, p. ej. el QR de pago). Sin esto
   *  el campo se trata como obligatorio: solo Ver/Cambiar. */
  onRemove?: () => void;
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
  onRemove,
  error,
  placeholderIcon = 'card-outline',
}: Props) {
  const colors = useResolvedAppColors();
  const [preview, setPreview] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

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
      const asset = result.assets[0];
      onChange(await resizeForUpload(asset.uri, asset.width, asset.height));
    } catch {
      toast.error(
        source === 'camera'
          ? 'No se pudo abrir la cámara'
          : 'No se pudo abrir la galería',
      );
    }
  }

  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-bold text-ink">{label}</Text>

      <Pressable
        onPress={() => setMenuVisible(true)}
        className={`h-[130px] items-center justify-center overflow-hidden rounded-xl border active:opacity-80 ${
          error
            ? 'border-red-500'
            : uri
              ? 'border-border'
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
            <Ionicons name={placeholderIcon} size={30} color={colors.mutedColor} />
            <Text className="mt-1.5 text-xs font-medium text-muted">
              Toca para subir la foto
            </Text>
          </>
        )}
      </Pressable>

      {error ? (
        <Text className="mt-1 text-xs font-medium text-red-500">{error}</Text>
      ) : null}

      <PhotoPreviewModal uri={preview} onClose={() => setPreview(null)} />

      <PhotoActionsSheet
        visible={menuVisible}
        label={label}
        onView={uri ? () => setPreview(uri) : undefined}
        onPickLibrary={() => pick('library')}
        onPickCamera={() => pick('camera')}
        onRemove={uri ? onRemove : undefined}
        onClose={() => setMenuVisible(false)}
      />
    </View>
  );
}
