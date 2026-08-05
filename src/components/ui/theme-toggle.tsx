import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';

import { useAppTheme } from '@/context/app-theme';
import { getAppColors } from '@/lib/app-colors';
import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';

type Props = {
  size?: number;
  /** Clases del botón circular (fondo/tamaño). Por defecto: circulito sobre bg-surface/bg-card. */
  className?: string;
  /** Color fijo del ícono; si no se pasa, se adapta solo (navy en claro, casi blanco en oscuro). */
  iconColor?: string;
};

/**
 * Ícono sol/luna que cambia el tema, pensado para insertarse en el header
 * propio de cada pantalla (al costado del botón de volver/hamburguesa), NO
 * como botón flotante global — así no tapa nada del navbar de cada rol.
 * Ver los distintos `className`/`iconColor` en los headers de bg-dark
 * (círculo translúcido blanco) vs. AuthHeader (círculo blanco/80) vs. el
 * resto (bg-card, color adaptado).
 */
export function ThemeToggle({ size = 18, className, iconColor }: Props) {
  const colors = useResolvedAppColors();
  const { isDark, toggleTheme } = useAppTheme();

  return (
    <Pressable
      onPress={toggleTheme}
      hitSlop={8}
      className={
        className ??
        'h-10 w-10 items-center justify-center rounded-full bg-card active:opacity-70'
      }
    >
      <Ionicons
        name={isDark ? 'sunny' : 'moon'}
        size={size}
        color={iconColor ?? (colors.inkColor)}
      />
    </Pressable>
  );
}
