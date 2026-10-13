import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';

/**
 * Tarjeta-contador de los dashboards (admin y negocio): icono, número grande
 * y etiqueta; `highlight` (pendientes > 0) la resalta con borde y tinte de
 * marca. Tocarla navega a la sección correspondiente.
 *
 * Ojo: SIEMPRE es la misma tarjeta (solo cambian clases) y sin degradado.
 * Antes, al llegar un pedido se montaba otra tarjeta con un `LinearGradient`
 * de fondo y texto blanco: en algunos teléfonos el degradado no se pintaba y
 * quedaba toda blanca (texto blanco sobre blanco) o toda roja.
 */
export function StatCard({
  icon,
  label,
  value,
  highlight = false,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  /** Número (contador) o texto ya formateado (p. ej. un precio con `formatPrice`). */
  value: number | string | null;
  highlight?: boolean;
  onPress?: () => void;
}) {
  const colors = useResolvedAppColors();

  return (
    <Pressable
      onPress={onPress}
      className={`w-[48%] flex-grow rounded-2xl p-4 active:opacity-80 ${
        highlight ? 'border-2 border-primary bg-primary-tint' : 'border border-border bg-card'
      }`}
    >
      <View className="flex-row items-center justify-between">
        <View className="h-9 w-9 items-center justify-center">
          <Ionicons name={icon} size={22} color={colors.primaryColor} />
        </View>
        {highlight && <View className="h-2.5 w-2.5 rounded-full bg-primary" />}
      </View>
      <Text
        className={`mt-2 text-2xl font-extrabold ${highlight ? 'text-primary' : 'text-ink'}`}
      >
        {value ?? '—'}
      </Text>
      <Text
        className={`text-xs font-semibold ${highlight ? 'text-primary' : 'text-muted'}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** pagination.total de un listado con perPage=1 (contador barato, sin endpoint). */
export async function countOf(
  promise: Promise<{ pagination: { total: number } }>,
): Promise<number | null> {
  try {
    return (await promise).pagination.total;
  } catch {
    return null; // el interceptor ya toasteó; la tarjeta muestra "—"
  }
}
