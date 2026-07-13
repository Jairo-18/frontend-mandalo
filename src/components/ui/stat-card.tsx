import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

/**
 * Tarjeta-contador de los dashboards (admin y negocio): icono, número grande
 * y etiqueta; `highlight` la pinta en primario (pendientes > 0). Tocarla
 * navega a la sección correspondiente.
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
  value: number | null;
  highlight?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`w-[48%] flex-grow rounded-2xl p-4 active:opacity-80 ${
        highlight ? 'bg-primary' : 'bg-white'
      }`}
    >
      <View
        className={`h-9 w-9 items-center justify-center rounded-full ${
          highlight ? 'bg-white/20' : 'bg-primary-tint'
        }`}
      >
        <Ionicons name={icon} size={18} color={highlight ? '#FFFFFF' : '#FF5A3C'} />
      </View>
      <Text
        className={`mt-2 text-2xl font-extrabold ${
          highlight ? 'text-white' : 'text-dark'
        }`}
      >
        {value ?? '—'}
      </Text>
      <Text
        className={`text-xs font-semibold ${
          highlight ? 'text-white/80' : 'text-muted'
        }`}
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
