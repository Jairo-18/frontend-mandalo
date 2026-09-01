import { StatusBar } from 'expo-status-bar';
import { ReactNode } from 'react';
import { View } from 'react-native';

import { AuthHeader } from '@/components/auth/auth-header';
import { KeyboardAwareScroll } from '@/components/ui/keyboard-aware-scroll';
import { useAppTheme } from '@/context/app-theme';
import { useIsWideScreen } from '@/hooks/use-is-wide-screen';

/** Ancho máximo por defecto de la tarjeta del formulario en pantalla ancha. */
const CARD_MAX_WIDTH = 460;

type Props = {
  children: ReactNode;
  /** Subtítulo del header de marca (default: "Putumayo a tu puerta"). */
  subtitle?: string;
  /** Header más bajo, para pantallas con más contenido (registro, etc.). */
  compact?: boolean;
  /** Si se pasa, el header muestra la flecha de volver. */
  onBack?: () => void;
  /** Ancho máximo de la tarjeta en pantalla ancha (default 460). */
  maxWidth?: number;
};

/**
 * Cascarón común de TODAS las pantallas de auth (login, registro, recuperar
 * contraseña, completar registro, términos): header de marca con degradado +
 * tarjeta con el contenido.
 *
 * - **Celular** (< `WIDE_MIN_WIDTH`): idéntico a como estaba antes —
 *   header a todo el ancho y tarjeta pegada a los bordes, montada 28px sobre
 *   el degradado con las esquinas de arriba redondeadas.
 * - **Tablet / web de escritorio**: el degradado sigue a todo el ancho (es la
 *   marca), pero su contenido y la tarjeta se limitan a `maxWidth` y se
 *   centran; la tarjeta flota (redondeada por los 4 lados, con borde y
 *   sombra) sobre el fondo de la página en vez de estirar los campos a lo
 *   ancho del monitor.
 */
export function AuthShell({
  children,
  subtitle,
  compact,
  onBack,
  maxWidth = CARD_MAX_WIDTH,
}: Props) {
  const { isDark } = useAppTheme();
  const wide = useIsWideScreen();

  return (
    <View className={`flex-1 ${wide ? 'bg-surface' : 'bg-card'}`}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <KeyboardAwareScroll>
        <AuthHeader
          subtitle={subtitle}
          compact={compact}
          onBack={onBack}
          contentMaxWidth={wide ? maxWidth : undefined}
        />

        {wide ? (
          // `items-center` centra la tarjeta; el contenedor se queda con
          // `flex-1` para que el fondo de la página llegue hasta abajo aunque
          // el formulario sea corto (si no, quedaría una franja del color de
          // la tarjeta bajo el contenido).
          <View className="flex-1 items-center px-6 pb-10">
            <View
              className="-mt-7 w-full rounded-[28px] border border-border bg-card px-6 pb-8 pt-7 shadow-md"
              style={{ maxWidth }}
            >
              {children}
            </View>
          </View>
        ) : (
          <View className="-mt-7 flex-1 rounded-t-[28px] bg-card px-6 pb-10 pt-7">
            {children}
          </View>
        )}
      </KeyboardAwareScroll>
    </View>
  );
}
