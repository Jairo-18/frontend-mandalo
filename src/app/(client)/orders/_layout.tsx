import { Stack } from 'expo-router';

/**
 * Stack interno de "Mis pedidos" dentro de la pestaña del cliente: el listado
 * es la pantalla de la pestaña y el detalle ([id]) se abre empujado encima
 * con la transición normal (sin esto, cada archivo sería una pantalla suelta
 * de la tab y el back se comportaría raro).
 */
export default function ClientOrdersLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
