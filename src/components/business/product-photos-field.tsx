import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Image, Pressable, Text, View } from 'react-native';

import { PhotoEditor } from '@/components/ui/photo-editor';
import { PhotoPreviewModal } from '@/components/ui/photo-preview-modal';
import { toast } from '@/lib/toast';

const TILE = 76;

type Props = {
  /** Fotos ya guardadas en el backend (URLs). */
  savedImages: string[];
  /** Fotos nuevas pendientes de subir (uris locales del editor). */
  pendingUris: string[];
  onRemoveSaved: (url: string) => void;
  onRemovePending: (uri: string) => void;
  /** Se eligió y recortó una foto nueva. */
  onAdded: (uri: string) => void;
};

/**
 * Fotos del producto: grilla de miniaturas (guardadas + pendientes) con X
 * para quitar y tile "Agregar" que abre galería/cámara → editor de recorte.
 * La subida/borrado real la decide el formulario al guardar.
 */
export function ProductPhotosField({
  savedImages,
  pendingUris,
  onRemoveSaved,
  onRemovePending,
  onAdded,
}: Props) {
  // Editor de recorte para la foto recién elegida.
  const [picked, setPicked] = useState<{
    uri: string;
    width: number;
    height: number;
  } | null>(null);
  const [editorVisible, setEditorVisible] = useState(false);
  // Foto abierta a pantalla completa (tocar una miniatura).
  const [preview, setPreview] = useState<string | null>(null);

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
      setPicked({ uri: asset.uri, width: asset.width, height: asset.height });
      setEditorVisible(true);
    } catch {
      toast.error(
        source === 'camera'
          ? 'No se pudo abrir la cámara'
          : 'No se pudo abrir la galería',
      );
    }
  }

  function addPhoto() {
    Alert.alert('Foto del producto', undefined, [
      { text: 'Elegir de la galería', onPress: () => pick('library') },
      { text: 'Tomar foto', onPress: () => pick('camera') },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  // Tiles: guardadas + pendientes (la primera es la principal).
  const photos: { key: string; uri: string; pending: boolean }[] = [
    ...savedImages.map((u) => ({ key: u, uri: u, pending: false })),
    ...pendingUris.map((u) => ({ key: u, uri: u, pending: true })),
  ];

  return (
    <>
      <Text className="mb-2 text-sm font-bold text-gray-700">
        Fotos (la primera es la principal)
      </Text>
      <View className="mb-5 flex-row flex-wrap gap-2">
        {photos.map((photo) => (
          <View key={photo.key}>
            {/* Tocar la miniatura la abre a pantalla completa (preview). */}
            <Pressable
              onPress={() => setPreview(photo.uri)}
              className="active:opacity-80"
            >
              <Image
                source={{ uri: photo.uri }}
                style={{ width: TILE, height: TILE, borderRadius: 14 }}
                resizeMode="cover"
              />
              <View className="absolute bottom-1 right-1 h-5 w-5 items-center justify-center rounded-full bg-black/50">
                <Ionicons name="expand-outline" size={11} color="#FFFFFF" />
              </View>
            </Pressable>
            <Pressable
              onPress={() =>
                photo.pending
                  ? onRemovePending(photo.uri)
                  : onRemoveSaved(photo.uri)
              }
              hitSlop={6}
              className="absolute -right-1.5 -top-1.5 h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-dark"
            >
              <Ionicons name="close" size={13} color="#FFFFFF" />
            </Pressable>
          </View>
        ))}

        {/* Agregar foto */}
        <Pressable
          onPress={addPhoto}
          className="items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-surface active:opacity-70"
          style={{ width: TILE, height: TILE }}
        >
          <Ionicons name="camera-outline" size={22} color="#7A7A8A" />
          <Text className="mt-0.5 text-[10px] font-medium text-muted">
            Agregar
          </Text>
        </Pressable>
      </View>

      <PhotoPreviewModal uri={preview} onClose={() => setPreview(null)} />

      <PhotoEditor
        visible={editorVisible}
        uri={picked?.uri ?? null}
        width={picked?.width ?? 0}
        height={picked?.height ?? 0}
        onCancel={() => setEditorVisible(false)}
        onDone={(uri) => {
          setEditorVisible(false);
          onAdded(uri);
        }}
      />
    </>
  );
}
