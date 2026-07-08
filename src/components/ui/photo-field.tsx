import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Image, Pressable, Text, View } from 'react-native';

import { PhotoEditor } from '@/components/ui/photo-editor';
import { toast } from '@/lib/toast';

type Props = {
  label: string;
  /** Imagen actual guardada en el backend (si existe). */
  imageUrl?: string | null;
  /** Imagen recién editada pendiente de subir (tiene prioridad al mostrar). */
  pendingUri?: string | null;
  /** Se eligió y recortó una foto nueva (uri local cuadrada). */
  onChange: (uri: string) => void;
  /** Forma del preview: círculo (avatares) o cuadrado redondeado (logos). */
  shape?: 'circle' | 'rounded';
  /** Icono del placeholder cuando no hay imagen. */
  placeholderIcon?: keyof typeof Ionicons.glyphMap;
  /** Mensaje de error de validación (para fotos obligatorias). */
  error?: string;
};

const SIZE = 104;

/**
 * Campo de foto reutilizable para formularios: al tocarlo abre la galería y
 * pasa la imagen elegida por el editor (recorte cuadrado + rotación) antes de
 * entregarla por `onChange`. La subida la decide el formulario al guardar.
 */
export function PhotoField({
  label,
  imageUrl,
  pendingUri,
  onChange,
  shape = 'circle',
  placeholderIcon = 'person-outline',
  error,
}: Props) {
  const [picked, setPicked] = useState<{
    uri: string;
    width: number;
    height: number;
  } | null>(null);
  const [editorVisible, setEditorVisible] = useState(false);

  const shown = pendingUri || imageUrl;
  const radiusClass = shape === 'circle' ? 'rounded-full' : 'rounded-2xl';

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
          quality: 1,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 1,
        });
      }
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      setPicked({
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
      });
      setEditorVisible(true);
    } catch {
      toast.error(
        source === 'camera'
          ? 'No se pudo abrir la cámara'
          : 'No se pudo abrir la galería',
      );
    }
  }

  /** Galería o cámara, con el diálogo nativo. */
  function choose() {
    Alert.alert(label, undefined, [
      { text: 'Elegir de la galería', onPress: () => pick('library') },
      { text: 'Tomar foto', onPress: () => pick('camera') },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  return (
    <View className="mb-4 items-center">
      <Pressable onPress={choose} className="active:opacity-80">
        <View
          className={`items-center justify-center overflow-hidden bg-primary-tint ${radiusClass}`}
          style={{ width: SIZE, height: SIZE }}
        >
          {shown ? (
            <Image
              source={{ uri: shown }}
              style={{ width: SIZE, height: SIZE }}
              resizeMode="cover"
            />
          ) : (
            <Ionicons name={placeholderIcon} size={40} color="#FF5A3C" />
          )}
        </View>

        {/* Badge de cámara */}
        <View className="absolute -bottom-1 -right-1 h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-primary">
          <Ionicons name="camera-outline" size={17} color="#FFFFFF" />
        </View>
      </Pressable>

      <Text className="mt-2 text-xs font-medium text-muted">{label}</Text>
      {error ? (
        <Text className="mt-1 text-xs font-medium text-red-500">{error}</Text>
      ) : null}

      <PhotoEditor
        visible={editorVisible}
        uri={picked?.uri ?? null}
        width={picked?.width ?? 0}
        height={picked?.height ?? 0}
        onCancel={() => setEditorVisible(false)}
        onDone={(uri) => {
          setEditorVisible(false);
          onChange(uri);
        }}
      />
    </View>
  );
}
