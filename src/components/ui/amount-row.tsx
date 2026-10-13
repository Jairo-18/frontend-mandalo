import { Text, View } from 'react-native';

/**
 * Fila "etiqueta · monto" (totales del pedido, checkout, cobros).
 *
 * El monto NO se mide solo: ocupa como mínimo el 40 % de la fila y va en una
 * sola línea. En algunas tablets/teléfonos Android (fuente del sistema propia,
 * texto en negrita del sistema) el ancho medido de un texto en negrita queda
 * corto al dibujarlo: "$ 24.500" se partía en el espacio y la segunda línea
 * quedaba recortada, así que solo se veía "$" (Subtotal del pedido #140).
 * Con ancho de sobra no hay corte posible.
 */
export function AmountRow({
  label,
  value,
  bold,
  labelClassName,
  valueClassName,
}: {
  label: string;
  value: string;
  bold?: boolean;
  /** Reemplaza el estilo por defecto de la etiqueta. */
  labelClassName?: string;
  /** Reemplaza el estilo por defecto del monto. */
  valueClassName?: string;
}) {
  return (
    <View className="flex-row items-center">
      <Text
        className={`flex-1 pr-3 ${
          labelClassName ?? (bold ? 'text-base font-extrabold text-ink' : 'text-sm text-muted')
        }`}
      >
        {label}
      </Text>
      <Text
        numberOfLines={1}
        style={{ minWidth: '40%' }}
        className={`text-right ${
          valueClassName ??
          (bold ? 'text-base font-extrabold text-primary' : 'text-sm font-semibold text-ink')
        }`}
      >
        {value}
      </Text>
    </View>
  );
}
