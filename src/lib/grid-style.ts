import type { ViewStyle } from 'react-native';

/**
 * Estilo de cada celda de un grid de 2 columnas (FlatList `numColumns={2}` +
 * `columnWrapperStyle` con gap): media fila (flex-1); el último item cuando el
 * total es impar se limita a ~mitad para que no se estire solo a lo ancho.
 */
export function gridItemStyle(index: number, count: number): ViewStyle {
  const loneLast = count % 2 === 1 && index === count - 1;
  return loneLast ? { flex: 1, maxWidth: '48%' } : { flex: 1 };
}
