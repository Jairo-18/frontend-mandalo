import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Modal, Pressable, Text, View, useWindowDimensions } from 'react-native';

import { PhotoActionsSheet } from '@/components/ui/photo-actions-sheet';
import { ProductVideo } from '@/components/ui/product-video';
import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';
import { MAX_VIDEO_SECONDS, PickedVideo, pickVideo } from '@/lib/pick-video';

const TILE = 76;

type Props = {
  /** Video ya guardado (URL + miniatura), o null. */
  saved: { url: string; thumbnailUrl: string | null } | null;
  /** Video nuevo elegido, pendiente de subir al guardar. */
  pending: PickedVideo | null;
  onPicked: (video: PickedVideo) => void;
  /** Quitar el video (el guardado o el pendiente). */
  onRemove: () => void;
};

/**
 * Video corto del producto (tipo reel, máx. 10 s): un solo tile con la
 * miniatura y una X para quitarlo, o "Agregar" (galería/cámara). Se sube al
 * guardar el producto; el servidor lo deja 4:3 horizontal (960×720).
 */
export function ProductVideoField({ saved, pending, onPicked, onRemove }: Props) {
  const colors = useResolvedAppColors();
  const { width } = useWindowDimensions();
  const [menuVisible, setMenuVisible] = useState(false);
  const [preview, setPreview] = useState(false);
  const hasVideo = !!pending || !!saved;

  return (
    <>
      <Text className="mb-1 text-sm font-bold text-ink">Video (opcional)</Text>
      <Text className="mb-2 text-xs text-muted">
        Un clip de máximo {MAX_VIDEO_SECONDS} segundos para mostrar el producto.
        Grábalo en horizontal (el celular de lado) y con el producto al centro:
        así se ve completo de lado a lado.
      </Text>
      <View className="mb-5 flex-row gap-2">
        {hasVideo ? (
          <View>
            <Pressable
              onPress={() => setPreview(true)}
              className="items-center justify-center overflow-hidden rounded-2xl bg-dark active:opacity-80"
              style={{ width: TILE, height: TILE }}
            >
              {saved && !pending && saved.thumbnailUrl ? (
                <Image
                  source={{ uri: saved.thumbnailUrl }}
                  style={{ position: 'absolute', width: TILE, height: TILE }}
                  contentFit="cover"
                />
              ) : null}
              <Ionicons name="play-circle" size={28} color="#FFFFFF" />
              {pending?.durationMs != null && (
                <Text className="text-[10px] font-bold text-white">
                  {Math.round(pending.durationMs / 1000)} s
                </Text>
              )}
            </Pressable>
            <Pressable
              onPress={onRemove}
              hitSlop={6}
              className="absolute -right-1.5 -top-1.5 h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-dark"
            >
              <Ionicons name="close" size={13} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => setMenuVisible(true)}
            className="items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-surface active:opacity-70"
            style={{ width: TILE, height: TILE }}
          >
            <Ionicons name="videocam-outline" size={22} color={colors.mutedColor} />
            <Text className="mt-0.5 text-[10px] font-medium text-muted">Agregar</Text>
          </Pressable>
        )}
        {pending && (
          <Text className="flex-1 self-center text-xs text-muted">
            Se subirá al guardar el producto.
          </Text>
        )}
      </View>

      <PhotoActionsSheet
        visible={menuVisible}
        label="Video del producto"
        cameraLabel="Grabar video"
        onPickLibrary={() => pickVideo('library', onPicked)}
        onPickCamera={() => pickVideo('camera', onPicked)}
        onClose={() => setMenuVisible(false)}
      />

      {/* Vista previa: el local tal cual (aún sin recortar) o el guardado. */}
      <Modal
        visible={preview}
        transparent
        animationType="fade"
        onRequestClose={() => setPreview(false)}
        statusBarTranslucent
      >
        <Pressable
          className="flex-1 items-center justify-center bg-black/90"
          onPress={() => setPreview(false)}
        >
          {preview && (pending || saved) && (
            <ProductVideo
              url={pending?.uri ?? saved!.url}
              thumbnailUrl={pending ? null : saved?.thumbnailUrl}
              width={Math.min(width, 640)}
              height={(Math.min(width, 640) * 3) / 4}
              active
            />
          )}
          <Text className="mt-4 text-xs text-white/70">Toca afuera para cerrar</Text>
        </Pressable>
      </Modal>
    </>
  );
}
