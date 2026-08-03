import type { ViewStyle } from 'react-native';

/**
 * Columnas del grid según el ancho disponible: 2 en celular, más en tablet/
 * web ancho — el mismo cálculo sirve para nativo y web (no depende de
 * Platform.OS, solo del ancho real de la ventana/ventana del navegador).
 */
export function columnsForWidth(width: number): number {
  if (width >= 1366) return 8; // portátil en adelante
  if (width >= 1100) return 6; // tablet horizontal / pantalla chica
  if (width >= 820) return 4;
  if (width >= 600) return 3;
  return 2;
}

/**
 * Estilo de cada celda de un grid de N columnas (FlatList `numColumns={n}` +
 * `columnWrapperStyle` con gap): fracción de fila (flex-1); los items sueltos
 * de la última fila incompleta se limitan a ~el ancho de una celda para que
 * no se estiren solos a lo ancho.
 */
export function gridItemStyle(
  index: number,
  count: number,
  numColumns: number,
): ViewStyle {
  const remainder = count % numColumns;
  const inLastIncompleteRow = remainder !== 0 && index >= count - remainder;
  if (!inLastIncompleteRow) return { flex: 1 };
  return { flex: 1, maxWidth: `${100 / numColumns - 2}%` };
}
