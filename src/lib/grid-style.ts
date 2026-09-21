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
/**
 * Props de virtualización compartidas por los grids de tarjetas (home, tienda,
 * CRUD de productos). Se esparcen con `{...gridPerfProps}`.
 *
 * `removeClippedSubviews` viene en `true` por defecto en Android: la lista
 * DESPRENDE las celdas que salen de pantalla y las remonta al entrar. Con
 * tarjetas que llevan `overflow-hidden` + `rounded-2xl` (ProductGridCard),
 * en scroll rápido la celda se repinta a medias y quedan franjas del borde
 * y la foto cortada en bandas. Por eso va apagado.
 *
 * Apagarlo solo no basta: `windowSize` por defecto es 21 (~10 pantallas
 * arriba y 10 abajo), así que sin recorte quedarían ~100 tarjetas con foto
 * montadas. Con 11 (~5 pantallas a cada lado) el consumo queda por debajo del
 * que había ANTES del arreglo.
 *
 * El número es un equilibrio, no un óptimo: `FlatList` reserva el espacio de
 * las celdas fuera de la ventana pero no las renderiza, así que cuanto más
 * baja, más probable es ver BLANCO en un fling largo (y ahí no se puede
 * dibujar un esqueleto: la lista no expone esas celdas). Estuvo en 7 y se
 * subió a 11 al notarse ese blanco; `expo-image` abarata cada celda porque
 * reescala la foto al tamaño real y la cachea.
 */
export const gridPerfProps = {
  removeClippedSubviews: false,
  windowSize: 11,
  initialNumToRender: 8,
  maxToRenderPerBatch: 8,
} as const;

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
