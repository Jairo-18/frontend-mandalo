import { Ionicons } from '@expo/vector-icons';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { toast } from '@/lib/toast';
import { getAppColors } from '@/lib/app-colors';

/** Lado máximo de la imagen final (el backend igual re-optimiza con sharp). */
const MAX_OUTPUT = 1080;

type Props = {
  visible: boolean;
  uri: string | null;
  width: number;
  height: number;
  onCancel: () => void;
  onDone: (uri: string) => void;
};

/**
 * Versión WEB de `PhotoEditor`: la versión nativa usa
 * `react-native-gesture-handler` (pan/pinch) + `react-native-reanimated`
 * dentro de un `<Modal>` para el recorte interactivo — esa combinación es la
 * más frágil en navegador (sin pantalla táctil, con mouse) y era la causa
 * real de que "no funcionara" subir fotos en la web (avatar, logo, fotos de
 * producto — todo lo que pasa por `PhotoField` usa este editor). Metro
 * resuelve este archivo automáticamente en builds web (mismo patrón que
 * `order-map.web.tsx`), sin tocar `photo-field.tsx`.
 *
 * En vez de arrastrar/pellizcar, se recorta automáticamente el cuadrado
 * centrado de la imagen (igual "cover" que ve el usuario en el preview) —
 * mantiene rotar 90° y el mismo tamaño de salida que el nativo.
 */
export function PhotoEditor({ visible, uri, width, height, onCancel, onDone }: Props) {
  const insets = useSafeAreaInsets();
  const frame = useMemo(() => Math.min(Dimensions.get('window').width - 48, 420), []);

  const [current, setCurrent] = useState<{ uri: string; w: number; h: number } | null>(null);
  const [rotating, setRotating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible || !uri) return;
    setCurrent({ uri, w: width, h: height });
  }, [visible, uri, width, height]);

  async function rotate() {
    if (!current || rotating || saving) return;
    setRotating(true);
    try {
      const rendered = await ImageManipulator.manipulate(current.uri).rotate(90).renderAsync();
      const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 1 });
      setCurrent({ uri: saved.uri, w: saved.width, h: saved.height });
    } catch {
      toast.error('No se pudo rotar la imagen');
    } finally {
      setRotating(false);
    }
  }

  async function confirm() {
    if (!current || rotating || saving) return;
    setSaving(true);
    try {
      const cropSize = Math.min(current.w, current.h);
      const originX = Math.round((current.w - cropSize) / 2);
      const originY = Math.round((current.h - cropSize) / 2);

      const context = ImageManipulator.manipulate(current.uri).crop({
        originX,
        originY,
        width: Math.floor(cropSize),
        height: Math.floor(cropSize),
      });
      if (cropSize > MAX_OUTPUT) {
        context.resize({ width: MAX_OUTPUT, height: MAX_OUTPUT });
      }
      const rendered = await context.renderAsync();
      const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.85 });
      onDone(saved.uri);
    } catch {
      toast.error('No se pudo recortar la imagen');
    } finally {
      setSaving(false);
    }
  }

  const displaySide = current
    ? current.w >= current.h
      ? { width: frame * (current.w / current.h), height: frame }
      : { width: frame, height: frame * (current.h / current.w) }
    : { width: frame, height: frame };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View
        className="flex-1 items-center justify-center bg-black/70 px-6"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <View className="w-full max-w-[460px] rounded-3xl bg-card p-5">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-extrabold text-ink">Editar foto</Text>
            <Pressable onPress={onCancel} hitSlop={10} disabled={saving}>
              <Ionicons name="close" size={24} color={getAppColors().inkColor} />
            </Pressable>
          </View>

          <View
            className="items-center justify-center self-center overflow-hidden rounded-2xl bg-black"
            style={{ width: frame, height: frame }}
          >
            {current && (
              <Image
                source={{ uri: current.uri }}
                style={displaySide}
                resizeMode="cover"
              />
            )}
            {rotating && (
              <View className="absolute inset-0 items-center justify-center bg-black/40">
                <ActivityIndicator size="large" color={getAppColors().primaryColor} />
              </View>
            )}
          </View>
          <Text className="mt-3 text-center text-xs text-muted">
            Se usa el recorte cuadrado centrado — si necesitas encuadrar distinto, usa la app móvil.
          </Text>

          <View className="mt-5 flex-row items-center gap-3">
            <Pressable
              onPress={rotate}
              disabled={rotating || saving}
              className="h-[52px] w-[52px] items-center justify-center rounded-full bg-surface active:opacity-70"
            >
              <Ionicons name="refresh-outline" size={22} color={getAppColors().inkColor} />
            </Pressable>
            <Pressable
              onPress={confirm}
              disabled={rotating || saving}
              className="h-[52px] flex-1 flex-row items-center justify-center gap-2 rounded-[26px] bg-primary active:opacity-80"
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  <Text className="text-base font-bold text-white">Usar foto</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
