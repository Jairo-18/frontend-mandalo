import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Image, Modal, Pressable, Text, View } from 'react-native';

type Props = {
  /** Foto a mostrar; null = visor cerrado. */
  uri: string | null;
  /**
   * Galería opcional: TODAS las fotos del item (se abre en `uri` y se pasa
   * de una a otra con flechas). Sin esto muestra solo `uri`.
   */
  uris?: string[];
  onClose: () => void;
};

/**
 * Versión WEB de `PhotoPreviewModal`: la nativa usa un `FlatList` horizontal
 * con `pagingEnabled` + `initialScrollIndex` para pasar de una foto a otra
 * deslizando — esa combinación de paginado nativo no se traduce bien a
 * `react-native-web` (sin gesto de swipe, soporte incompleto de scroll
 * "por páginas"), así que en vez de deslizar se navega con flechas
 * izquierda/derecha. Metro resuelve este archivo automáticamente en web
 * (mismo patrón que `photo-editor.web.tsx`), sin tocar los 8 lugares que
 * usan `PhotoPreviewModal`.
 */
export function PhotoPreviewModal({ uri, uris, onClose }: Props) {
  const photos = uris?.length ? uris : uri ? [uri] : [];
  const [index, setIndex] = useState(0);

  // Cada apertura arranca en la foto tocada (el modal queda montado siempre).
  useEffect(() => {
    if (uri != null) setIndex(Math.max(0, photos.indexOf(uri)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uri]);

  const current = photos[index];
  const hasMultiple = photos.length > 1;

  return (
    <Modal visible={uri != null} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/90">
        <Pressable onPress={onClose} className="absolute inset-0" />

        {current && (
          <Image
            source={{ uri: current }}
            style={{ width: '90%', height: '80%' }}
            resizeMode="contain"
          />
        )}

        {hasMultiple && (
          <>
            <Pressable
              onPress={() => setIndex((i) => (i - 1 + photos.length) % photos.length)}
              hitSlop={10}
              style={{ top: '50%', marginTop: -22 }}
              className="absolute left-4 h-11 w-11 items-center justify-center rounded-full bg-white/15"
            >
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </Pressable>
            <Pressable
              onPress={() => setIndex((i) => (i + 1) % photos.length)}
              hitSlop={10}
              style={{ top: '50%', marginTop: -22 }}
              className="absolute right-4 h-11 w-11 items-center justify-center rounded-full bg-white/15"
            >
              <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
            </Pressable>

            <View className="absolute bottom-12 self-center rounded-full bg-white/15 px-3 py-1">
              <Text className="text-xs font-bold text-white">
                {index + 1} / {photos.length}
              </Text>
            </View>
          </>
        )}

        <Pressable
          onPress={onClose}
          hitSlop={10}
          className="absolute right-5 top-14 h-10 w-10 items-center justify-center rounded-full bg-white/15"
        >
          <Ionicons name="close" size={22} color="#FFFFFF" />
        </Pressable>
      </View>
    </Modal>
  );
}
