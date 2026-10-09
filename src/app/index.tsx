import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { HttpError } from '@/lib/http';
import {
  clearSession,
  entryPathFor,
  loadSession,
  setSession,
} from '@/lib/session';
import { authService } from '@/services/auth';
import { getAppColors } from '@/lib/app-colors';

type Target =
  | '/auth/login'
  | '/auth/complete-registration'
  | ReturnType<typeof entryPathFor>;

/**
 * Punto de entrada: restaura la sesión guardada (SecureStore) antes de decidir
 * a dónde ir. Si hay sesión, renueva los tokens contra `/auth/refresh-token`
 * (valida que la cuenta siga existiendo y sin banear) y entra directo al
 * home/panel según el rol; solo manda al login si no hay sesión o el backend
 * la rechazó. Sin red se entra con la sesión guardada (modo optimista).
 */
export default function Index() {
  const [target, setTarget] = useState<Target | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const session = await loadSession();
      if (!session?.refreshToken) {
        // Sin sesión → modo INVITADO: entra directo al home a explorar y armar
        // el carrito; el registro se le pide al pedir (§44).
        if (!cancelled) setTarget('/home');
        return;
      }

      try {
        const res = await authService.refreshToken(session.refreshToken);
        const { tokens, user } = res.data;
        await setSession({
          ...tokens,
          user,
          // El refresh no devuelve accessSessionId; se conserva el del sign-in
          // (el sign-out lo busca por id + userId).
          accessSessionId: session.accessSessionId,
          // Un registro con Google a medias sigue pendiente tras reabrir.
          needsOnboarding: session.needsOnboarding,
        });
        if (!cancelled) {
          setTarget(
            session.needsOnboarding
              ? '/auth/complete-registration'
              : entryPathFor(user),
          );
        }
      } catch (e) {
        // Solo un rechazo EXPLÍCITO del refreshToken (401/403) invalida la
        // sesión. Todo lo demás (sin red, timeout, 5xx, 429 del throttle,
        // portal cautivo de datos sin saldo que devuelve HTML) entra con la
        // sesión guardada: antes un error cualquiera la borraba y el negocio
        // terminaba en la vista de invitado. Si el token está vencido, `http()`
        // lo renueva solo al volver la red.
        const rejected =
          e instanceof HttpError && (e.status === 401 || e.status === 403);
        if (!rejected) {
          if (!cancelled) {
            setTarget(
              session.needsOnboarding
                ? '/auth/complete-registration'
                : entryPathFor(session.user),
            );
          }
          return;
        }
        await clearSession();
        if (!cancelled) setTarget('/auth/login');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!target) {
    return (
      <View className="flex-1 items-center justify-center bg-card">
        <ActivityIndicator size="large" color={getAppColors().primaryColor} />
      </View>
    );
  }

  return <Redirect href={target} />;
}
