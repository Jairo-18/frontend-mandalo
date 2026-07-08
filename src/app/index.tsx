import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { HttpError } from '@/lib/http';
import {
  clearSession,
  homePathFor,
  loadSession,
  setSession,
} from '@/lib/session';
import { authService } from '@/services/auth';

type Target = '/auth/login' | ReturnType<typeof homePathFor>;

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
        if (!cancelled) setTarget('/auth/login');
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
        });
        if (!cancelled) setTarget(homePathFor(user));
      } catch (e) {
        // status 0 = sin red / timeout: no invalidar la sesión por estar offline.
        if (e instanceof HttpError && e.status === 0) {
          if (!cancelled) setTarget(homePathFor(session.user));
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
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#FF5A3C" />
      </View>
    );
  }

  return <Redirect href={target} />;
}
