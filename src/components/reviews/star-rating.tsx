import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

/** Dorado fijo (no es color de marca: las estrellas se leen igual en cualquier tema). */
export const STAR_COLOR = '#F5A623';
const EMPTY_STAR_COLOR = '#D1D5DB';

function starIcon(value: number, index: number): keyof typeof Ionicons.glyphMap {
  if (value >= index + 1) return 'star';
  if (value >= index + 0.5) return 'star-half';
  return 'star-outline';
}

/** 5 estrellas de solo lectura, con medias (4.3 → 4 y media por redondeo a 0.5). */
export function StarRating({ value, size = 14 }: { value: number; size?: number }) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <View className="flex-row" style={{ gap: size > 20 ? 4 : 1 }}>
      {[0, 1, 2, 3, 4].map((i) => {
        const icon = starIcon(rounded, i);
        return (
          <Ionicons
            key={i}
            name={icon}
            size={size}
            color={icon === 'star-outline' ? EMPTY_STAR_COLOR : STAR_COLOR}
          />
        );
      })}
    </View>
  );
}

/**
 * Selector de 0.5 a 5: cada estrella tiene dos mitades tocables (izquierda =
 * media, derecha = entera). `value` 0 = aún sin elegir.
 */
export function StarRatingInput({
  value,
  onChange,
  size = 36,
  disabled = false,
}: {
  value: number;
  onChange: (value: number) => void;
  size?: number;
  disabled?: boolean;
}) {
  return (
    <View className="flex-row items-center" style={{ gap: 6 }}>
      {[0, 1, 2, 3, 4].map((i) => {
        const icon = starIcon(value, i);
        return (
          <View key={i} style={{ width: size, height: size }}>
            <Ionicons
              name={icon}
              size={size}
              color={icon === 'star-outline' ? EMPTY_STAR_COLOR : STAR_COLOR}
            />
            <View className="absolute inset-0 flex-row">
              <Pressable
                accessibilityLabel={`${i + 0.5} estrellas`}
                disabled={disabled}
                onPress={() => onChange(i + 0.5)}
                className="flex-1"
              />
              <Pressable
                accessibilityLabel={`${i + 1} estrellas`}
                disabled={disabled}
                onPress={() => onChange(i + 1)}
                className="flex-1"
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** "4,5" (coma decimal, como el resto de la app en es-CO). */
export function formatRating(value: number): string {
  return value.toLocaleString('es-CO', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

/**
 * Píldora "★ 4,5 (12)" del promedio. Sin reseñas dice "Nuevo" (o nada si
 * `hideWhenEmpty`). Si trae `onPress`, abre la lista de reseñas.
 */
export function RatingBadge({
  average,
  count,
  onPress,
  hideWhenEmpty = false,
  variant = 'plain',
}: {
  average?: number | null;
  count?: number | null;
  onPress?: () => void;
  hideWhenEmpty?: boolean;
  /** `overlay`: fondo oscuro translúcido para ir sobre una foto. */
  variant?: 'plain' | 'overlay';
}) {
  const hasReviews = !!count && average != null;
  if (!hasReviews && hideWhenEmpty) return null;

  const overlay = variant === 'overlay';
  const content = (
    <View
      className={`flex-row items-center gap-1 self-start rounded-full px-2 py-0.5 ${
        overlay ? 'bg-dark/80' : 'bg-amber-50'
      }`}
    >
      <Ionicons name="star" size={11} color={STAR_COLOR} />
      <Text
        className={`text-[11px] font-bold ${overlay ? 'text-white' : 'text-amber-800'}`}
      >
        {hasReviews ? `${formatRating(average!)} (${count})` : 'Nuevo'}
      </Text>
    </View>
  );

  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} hitSlop={6} className="active:opacity-70">
      {content}
    </Pressable>
  );
}
