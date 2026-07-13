import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

type Props = {
  /** Foto a mostrar; null = visor cerrado. */
  uri: string | null;
  /**
   * Galería opcional: TODAS las fotos del item (se abre en `uri` y se pasa
   * de una a otra deslizando). Sin esto muestra solo `uri`.
   */
  uris?: string[];
  onClose: () => void;
};

/**
 * Visor de fotos a pantalla completa (tocar la foto cierra). Con `uris`
 * funciona como galería paginada con contador. Lo usan los documentos del
 * repartidor (panel admin), las fotos del form de producto (panel NEGO) y
 * las tarjetas de producto del cliente.
 */
export function PhotoPreviewModal({ uri, uris, onClose }: Props) {
  const { width } = useWindowDimensions();

  const photos = uris?.length ? uris : uri ? [uri] : [];
  const initialIndex = Math.max(0, uri ? photos.indexOf(uri) : 0);
  const [index, setIndex] = useState(initialIndex);

  // Cada apertura arranca en la foto tocada (el modal queda montado siempre).
  useEffect(() => {
    if (uri != null) setIndex(Math.max(0, photos.indexOf(uri)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uri]);

  return (
    <Modal
      visible={uri != null}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 bg-black/90">
        <FlatList
          // Remonta por apertura: initialScrollIndex solo aplica al montar.
          key={uri ?? 'closed'}
          data={photos}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, i) => ({
            length: width,
            offset: width * i,
            index: i,
          })}
          onMomentumScrollEnd={(e) =>
            setIndex(Math.round(e.nativeEvent.contentOffset.x / width))
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={onClose}
              style={{ width }}
              className="h-full items-center justify-center"
            >
              <Image
                source={{ uri: item }}
                style={{ width, height: '80%' }}
                resizeMode="contain"
              />
            </Pressable>
          )}
        />

        {/* Contador (solo galería): "2 / 3" */}
        {photos.length > 1 && (
          <View className="absolute bottom-12 self-center rounded-full bg-white/15 px-3 py-1">
            <Text className="text-xs font-bold text-white">
              {index + 1} / {photos.length}
            </Text>
          </View>
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
