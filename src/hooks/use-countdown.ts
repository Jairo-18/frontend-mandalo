import { useEffect, useState } from 'react';

/**
 * Cuenta regresiva desde `startIso` (timestamp ISO) por `durationSeconds`.
 * Tictaquea cada segundo; `null` en `startIso` = sin cronómetro corriendo.
 * Lo usa el flujo de "En sitio" / segundo intento (reunión 2026-08-04).
 */
export function useCountdown(startIso: string | null, durationSeconds: number) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startIso) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [startIso]);

  if (!startIso) {
    return { remainingSeconds: 0, expired: false, running: false };
  }
  const elapsedMs = now - new Date(startIso).getTime();
  const remainingSeconds = Math.max(0, durationSeconds - Math.floor(elapsedMs / 1000));
  return {
    remainingSeconds,
    expired: remainingSeconds <= 0,
    running: true,
  };
}

/** "4:32" a partir de segundos restantes. */
export function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
