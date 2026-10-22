/**
 * "Mis pedidos" ya no recarga en cada visita: se actualiza por socket
 * (cambios de estado) y con deslizar. El único caso que el socket NO avisa
 * al cliente es su propio pedido recién creado (el backend solo le avisa al
 * negocio), así que el checkout marca la lista como desactualizada y la
 * pantalla la recarga en silencio la próxima vez que se enfoca.
 */
let stale = false;

export function markClientOrdersStale(): void {
  stale = true;
}

/** Devuelve si estaba desactualizada y limpia la marca. */
export function consumeClientOrdersStale(): boolean {
  const was = stale;
  stale = false;
  return was;
}
