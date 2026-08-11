import type { ViewStyle } from 'react-native';

/**
 * Columnas del grid según el ancho disponible: 2 en celular (o `mobileColumns`
 * si se pasa), más en tablet/web ancho — el mismo cálculo sirve para nativo y
 * web (no depende de Platform.OS, solo del ancho real de la ventana/ventana
 * del navegador). `mobileColumns` deja pedir 3 en celular solo donde tiene
 * sentido (grid de productos de la vista cliente) sin tocar los demás grids
 * (p. ej. el CRUD de productos del negocio, que necesita más espacio por
 * tarjeta para sus acciones de editar/eliminar).
 */
export function columnsForWidth(width: number, mobileColumns: 2 | 3 = 2): number {
  if (width >= 1366) return 8; // portátil en adelante
  if (width >= 1100) return 6; // tablet horizontal / pantalla chica
  if (width >= 820) return 4;
  if (width >= 600) return 3;
  return mobileColumns;
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
