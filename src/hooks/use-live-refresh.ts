import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { useOrderEvents, useSocketReconnected } from '@/lib/orders-socket';

/**
 * Mantiene al día una pantalla de totales (cobros, dashboards). Las pantallas
 * del drawer y de las pestañas NO se desmontan al cambiar de sección, así que
 * cargar solo al montar dejaba los montos congelados hasta cerrar sesión.
 *
 * Llama a `refresh` (debe venir memoizado):
 * - al VOLVER a la pantalla (no en el primer foco: la carga inicial es del caller);
 * - al volver la app a primer plano, si la pantalla está a la vista;
 * - cuando llega un evento de pedido o el socket se reconecta, si está a la
 *   vista (agrupado: un pedido dispara varios eventos seguidos). Si no está a
 *   la vista no hace nada: el próximo foco recarga igual.
 */
export function useLiveRefresh(refresh: () => void): void {
  const focusedRef = useRef(false);
  const seenFocusRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(
    useCallback(() => {
      focusedRef.current = true;
      if (seenFocusRef.current) refresh();
      seenFocusRef.current = true;
      return () => {
        focusedRef.current = false;
      };
    }, [refresh]),
  );

  const schedule = useCallback(() => {
    if (!focusedRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      refresh();
    }, 800);
  }, [refresh]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') schedule();
    });
    return () => {
      sub.remove();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [schedule]);

  useOrderEvents(schedule);
  useSocketReconnected(schedule);
}
