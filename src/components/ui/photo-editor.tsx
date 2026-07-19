import { Ionicons } from '@expo/vector-icons';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { toast } from '@/lib/toast';

const MAX_ZOOM = 5;
/** Lado máximo de la imagen final (el backend igual re-optimiza con sharp). */
const MAX_OUTPUT = 1080;

type Props = {
  visible: boolean;
  /** Imagen original a editar (uri local del picker) con sus dimensiones. */
  uri: string | null;
  width: number;
  height: number;
  onCancel: () => void;
  /** Devuelve la uri local de la imagen recortada (siempre cuadrada). */
  onDone: (uri: string) => void;
};

/**
 * Editor de foto reutilizable: encuadre cuadrado tipo Instagram. La imagen se
 * mueve (pan) y acerca (pinch) dentro de un marco cuadrado fijo, con botón de
 * rotar 90°; al confirmar se recorta lo visible con expo-image-manipulator y
 * se devuelve una imagen SIEMPRE cuadrada.
 */
export function PhotoEditor({
  visible,
  uri,
  width,
  height,
  onCancel,
  onDone,
}: Props) {
  const insets = useSafeAreaInsets();

  // Lado del marco de recorte (cuadrado, centrado en pantalla).
  const frame = useMemo(() => Dimensions.get('window').width - 48, []);

  // Imagen vigente: cambia con cada rotación (la rotación se "hornea" de una
  // vez con el manipulador y así los gestos solo lidian con pan/zoom).
  const [current, setCurrent] = useState<{
    uri: string;
    w: number;
    h: number;
  } | null>(null);
  const [rotating, setRotating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Gestos: zoom del usuario (k ≥ 1 = la imagen siempre cubre el marco) y
  // desplazamiento del centro de la imagen respecto al centro del marco.
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);

  // Al abrir (o cambiar la imagen) se reinicia todo.
  useEffect(() => {
    if (!visible || !uri) return;
    setCurrent({ uri, w: width, h: height });
    scale.value = 1;
    savedScale.value = 1;
    tx.value = 0;
    ty.value = 0;
    savedTx.value = 0;
    savedTy.value = 0;
    // Los shared values son refs estables de reanimated.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, uri, width, height]);

  // Escala base "cover": la imagen (ya rotada) siempre llena el marco.
  const baseScale = current
    ? Math.max(frame / current.w, frame / current.h)
    : 1;
  const displayW = current ? current.w * baseScale : frame;
  const displayH = current ? current.h * baseScale : frame;

  const clampTranslation = (value: number, displaySide: number, k: number) => {
    'worklet';
    const max = Math.max(0, (displaySide * k - frame) / 2);
    return Math.min(max, Math.max(-max, value));
  };

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      tx.value = clampTranslation(
        savedTx.value + e.translationX,
        displayW,
        scale.value,
      );
      ty.value = clampTranslation(
        savedTy.value + e.translationY,
        displayH,
        scale.value,
      );
    })
    .onEnd(() => {
      savedTx.value = tx.value;
      savedTy.value = ty.value;
    });

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      const k = Math.min(MAX_ZOOM, Math.max(1, savedScale.value * e.scale));
      scale.value = k;
      // Al alejar, la imagen no puede dejar bordes vacíos en el marco.
      tx.value = clampTranslation(tx.value, displayW, k);
      ty.value = clampTranslation(ty.value, displayH, k);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      savedTx.value = tx.value;
      savedTy.value = ty.value;
    });

  const gesture = Gesture.Simultaneous(pan, pinch);

  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value },
    ],
  }));

  async function rotate() {
    if (!current || rotating || saving) return;
    setRotating(true);
    try {
      const rendered = await ImageManipulator.manipulate(current.uri)
        .rotate(90)
        .renderAsync();
      const saved = await rendered.saveAsync({
        format: SaveFormat.JPEG,
        compress: 1,
      });
      setCurrent({ uri: saved.uri, w: saved.width, h: saved.height });
      scale.value = 1;
      savedScale.value = 1;
      tx.value = 0;
      ty.value = 0;
      savedTx.value = 0;
      savedTy.value = 0;
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
      // Mapea el marco (px de pantalla) a píxeles de la imagen original.
      const s = baseScale * scale.value;
      const cropSize = Math.min(frame / s, current.w, current.h);
      const originX = Math.min(
        Math.max(0, (current.w - cropSize) / 2 - tx.value / s),
        current.w - cropSize,
      );
      const originY = Math.min(
        Math.max(0, (current.h - cropSize) / 2 - ty.value / s),
        current.h - cropSize,
      );

      const context = ImageManipulator.manipulate(current.uri).crop({
        originX: Math.round(originX),
        originY: Math.round(originY),
        width: Math.floor(cropSize),
        height: Math.floor(cropSize),
      });
      if (cropSize > MAX_OUTPUT) {
        context.resize({ width: MAX_OUTPUT, height: MAX_OUTPUT });
      }
      const rendered = await context.renderAsync();
      const saved = await rendered.saveAsync({
        format: SaveFormat.JPEG,
        compress: 0.85,
      });
      onDone(saved.uri);
    } catch {
      toast.error('No se pudo recortar la imagen');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      {/* Los gestos dentro de un Modal necesitan su propio root (Android). */}
      <GestureHandlerRootView className="flex-1 bg-dark">
        <View
          className="flex-1"
          style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 16 }}
        >
          {/* Cabecera */}
          <View className="flex-row items-center justify-between px-5 py-4">
            <Text className="text-lg font-extrabold text-white">
              Editar foto
            </Text>
            <Pressable onPress={onCancel} hitSlop={10} disabled={saving}>
              <Ionicons name="close" size={26} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Marco de recorte */}
          <View className="flex-1 items-center justify-center">
            <GestureDetector gesture={gesture}>
              <View
                className="items-center justify-center overflow-hidden rounded-2xl bg-black"
                style={{ width: frame, height: frame }}
              >
                {current && (
                  <Animated.Image
                    source={{ uri: current.uri }}
                    style={[{ width: displayW, height: displayH }, imageStyle]}
                    resizeMode="cover"
                  />
                )}

                {/* Cuadrícula de tercios para encuadrar */}
                <View pointerEvents="none" className="absolute inset-0">
                  <View className="absolute left-1/3 top-0 h-full w-px bg-white/30" />
                  <View className="absolute left-2/3 top-0 h-full w-px bg-white/30" />
                  <View className="absolute left-0 top-1/3 h-px w-full bg-white/30" />
                  <View className="absolute left-0 top-2/3 h-px w-full bg-white/30" />
                </View>

                {rotating && (
                  <View className="absolute inset-0 items-center justify-center bg-black/40">
                    <ActivityIndicator size="large" color="#FF5A3C" />
                  </View>
                )}
              </View>
            </GestureDetector>
            <Text className="mt-4 text-xs text-white/60">
              Arrastra y pellizca para encuadrar · el recorte siempre es
              cuadrado
            </Text>
          </View>

          {/* Acciones: rotar centrado arriba, "Usar foto" a todo el ancho */}
          <View className="gap-3 px-5">
            <Pressable
              onPress={rotate}
              disabled={rotating || saving}
              className="h-[52px] w-[52px] items-center justify-center self-center rounded-full bg-white/10 active:opacity-70"
            >
              <Ionicons name="refresh-outline" size={24} color="#FFFFFF" />
            </Pressable>

            <Pressable
              onPress={confirm}
              disabled={rotating || saving}
              className="h-[52px] w-full flex-row items-center justify-center gap-2 rounded-[26px] bg-primary active:opacity-80"
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  <Text className="text-base font-bold text-white">
                    Usar foto
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
