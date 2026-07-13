import { Stack } from 'expo-router';

/**
 * Stack interno de "Mis pedidos" dentro del drawer del cliente: el listado es
 * la sección del sidebar y el detalle ([id]) se abre empujado encima con la
 * transición normal (sin esto, cada archivo sería una pantalla suelta del
 * drawer y el back se comportaría raro).
 */
export default function ClientOrdersLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
