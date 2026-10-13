/** Precio en pesos colombianos ("$ 25.000"). */
export function formatPrice(value: number): string {
  return `$ ${Math.round(value).toLocaleString('es-CO')}`;
}

/** Precio final con el porcentaje de descuento aplicado. */
export function finalPrice(priceSale: number, discount: number): number {
  // Al peso, igual que el backend al crear el pedido.
  return discount > 0 ? Math.round(priceSale * (1 - discount / 100)) : priceSale;
}
