import { Redirect } from 'expo-router';

// Punto de entrada: por ahora siempre lleva al login.
// TODO: cuando haya sesión persistida, redirigir al home si ya está autenticado.
export default function Index() {
  return <Redirect href="/auth/login" />;
}
