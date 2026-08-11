import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View } from 'react-native';

import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';

/**
 * Tarjeta-contador de los dashboards (admin y negocio): icono, número grande
 * y etiqueta; `highlight` la pinta con el degradado de marca (pendientes >
 * 0) — antes era un `bg-primary` sólido. Tocarla navega a la sección
 * correspondiente.
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

  const inner = (
    <>
      <View className="h-9 w-9 items-center justify-center">
        <Ionicons
          name={icon}
          size={22}
          color={highlight ? '#FFFFFF' : colors.primaryColor}
        />
      </View>
      <Text
        className={`mt-2 text-2xl font-extrabold ${highlight ? 'text-white' : 'text-ink'}`}
      >
        {value ?? '—'}
      </Text>
      <Text
        className={`text-xs font-semibold ${highlight ? 'text-white/80' : 'text-muted'}`}
      >
        {label}
      </Text>
    </>
  );

  if (highlight) {
    return (
      <Pressable
        onPress={onPress}
        className="w-[48%] flex-grow overflow-hidden rounded-2xl active:opacity-80"
      >
        <LinearGradient
          colors={[colors.primaryColor, colors.darkColor]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 16 }}
        >
          {inner}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      className="w-[48%] flex-grow rounded-2xl border border-border bg-card p-4 active:opacity-80"
    >
      {inner}
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
