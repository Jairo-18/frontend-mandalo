import { useEffect, useState } from 'react';
import { Animated, Platform, View } from 'react-native';

/**
 * Tarjetas fantasma con la MISMA forma que las reales, para los dos momentos
 * en que el grid no tiene nada que mostrar: la primera carga y el "trayendo
 * más" del final.
 *
 * Reemplazan a un `ActivityIndicator` suelto por dos razones: el usuario ve de
 * una qué va a aparecer, y el layout **no salta** cuando llegan los datos
 * porque el hueco ya mide lo mismo.
 *
 * ⚠️ NO sirve para los blancos del scroll rápido: esos son celdas fuera de la
 * ventana de `FlatList`, que reserva el espacio sin renderizar nada y no
 * expone dónde dibujar. Eso se ataca con `windowSize` (ver `gridPerfProps`).
 */
type Props = {
  numColumns: number;
  /** Tarjetas a pintar; se redondea hacia arriba para llenar filas completas. */
  count?: number;
  /** Alto del bloque de texto: 116 en productos, 80 en negocios. */
  infoHeight?: number;
  /** Debe coincidir con el `columnWrapperStyle` del grid real. */
  paddingHorizontal?: number;
};

/** Latido suave; sin él un bloque gris quieto parece contenido roto. */
function usePulse(): Animated.Value {
  // `useState` perezoso y no `useRef().current`: leer un ref en render está
  // prohibido por las reglas de hooks, y acá solo hace falta crear el valor
  // una vez.
  const [value] = useState(() => new Animated.Value(0.45));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, {
          toValue: 1,
          duration: 700,
          // En web el driver nativo no aplica a opacity y avisa por consola.
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(value, {
          toValue: 0.45,
          duration: 700,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [value]);
  return value;
}

function SkeletonCard({ infoHeight }: { infoHeight: number }) {
  return (
    <View className="mb-3 overflow-hidden rounded-2xl border border-border bg-card">
      {/* Mismo `aspectRatio: 1` que la foto real: el alto sale del ancho. */}
      <View className="w-full bg-border" style={{ aspectRatio: 1 }} />
      <View className="p-2.5" style={{ height: infoHeight }}>
        <View className="h-[26px] rounded-md bg-border" />
        <View className="mt-1 h-[20px] w-2/3 rounded-md bg-border" />
        <View className="mt-2 h-[14px] w-1/2 rounded-md bg-border" />
      </View>
    </View>
  );
}

export function GridSkeleton({
  numColumns,
  count,
  infoHeight = 116,
  paddingHorizontal = 16,
}: Props) {
  const opacity = usePulse();
  const requested = count ?? numColumns * 3;
  // Filas completas: una fila a medias dejaría las fantasmas estiradas.
  const rows = Math.max(1, Math.ceil(requested / numColumns));

  return (
    <View style={{ paddingHorizontal }}>
      {Array.from({ length: rows }, (_, row) => (
        <View key={row} className="flex-row" style={{ gap: 12 }}>
          {Array.from({ length: numColumns }, (_, col) => (
            <Animated.View key={col} style={{ flex: 1, opacity }}>
              <SkeletonCard infoHeight={infoHeight} />
            </Animated.View>
          ))}
        </View>
      ))}
    </View>
  );
}
