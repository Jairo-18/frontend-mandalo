import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'nativewind';

import { deviceStoreGet, deviceStoreSet } from '@/lib/device-store';

const STORAGE_KEY = 'mandalo:color-scheme';

type AppThemeContextValue = {
  isDark: boolean;
  toggleTheme: () => void;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

/**
 * Modo oscuro manual (independiente del sistema), persistido en disco.
 * El overlay de splash cubre el arranque, así que no hace falta bloquear
 * el render mientras se lee la preferencia guardada.
 */
export function AppThemeProvider({ children }: { children: ReactNode }) {
  const { colorScheme, setColorScheme } = useColorScheme();

  useEffect(() => {
    deviceStoreGet(STORAGE_KEY).then((saved) => {
      if (saved === 'dark' || saved === 'light') setColorScheme(saved);
    });
    // Solo al montar: lee la preferencia guardada una vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<AppThemeContextValue>(
    () => ({
      isDark: colorScheme === 'dark',
      toggleTheme: () => {
        const next = colorScheme === 'dark' ? 'light' : 'dark';
        setColorScheme(next);
        void deviceStoreSet(STORAGE_KEY, next);
      },
    }),
    [colorScheme, setColorScheme],
  );

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme(): AppThemeContextValue {
  const ctx = useContext(AppThemeContext);
  if (!ctx) throw new Error('useAppTheme debe usarse dentro de <AppThemeProvider>');
  return ctx;
}
