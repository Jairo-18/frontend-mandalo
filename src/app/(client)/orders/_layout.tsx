import { Stack } from 'expo-router';

/**
 * La lista es el ancla del stack: al entrar DIRECTO al detalle (checkout,
 * notificación) la lista queda debajo. Sin esto el stack quedaba solo con el
 * detalle: "atrás" no tenía a dónde ir y el botón de "Mis pedidos" del home
 * volvía a mostrar el pedido en curso en vez de la lista.
 */
export const unstable_settings = { anchor: 'index' };

/**
 * Stack interno de "Mis pedidos" dentro de la pestaña del cliente: el listado
 * es la pantalla de la pestaña y el detalle ([id]) se abre empujado encima
 * con la transición normal (sin esto, cada archivo sería una pantalla suelta
 * de la tab y el back se comportaría raro).
 */
export default function ClientOrdersLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
