import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';

import { useAppTheme } from '@/context/app-theme';

type Props = {
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  /** `false` → "Iniciar sesión con Apple" en vez de "Continuar con Apple". */
  continueLabel?: boolean;
};

/**
 * Botón de Sign in with Apple. Usa el componente NATIVO
 * (`AppleAuthenticationButton`) a propósito: Apple exige su branding exacto y
 * el nativo ya trae el logo, el texto traducido al idioma del dispositivo y
 * los colores aprobados — un botón propio es motivo de rechazo.
 *
 * Se renderiza solo cuando el dispositivo lo soporta (iOS 13+). En Android y
 * web devuelve `null`, así que las pantallas pueden montarlo sin condicionales.
 */
export function AppleButton({
  onPress,
  loading = false,
  disabled = false,
  continueLabel = true,
}: Props) {
  const { isDark } = useAppTheme();
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    let alive = true;
    AppleAuthentication.isAvailableAsync()
      .then((ok) => {
        if (alive) setAvailable(ok);
      })
      .catch(() => {
        if (alive) setAvailable(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!available) return null;

  // El botón nativo no tiene estado de carga: se reemplaza por un spinner
  // del mismo alto para que no salte el layout.
  if (loading) {
    return (
      <View className="mt-[14px] h-[54px] items-center justify-center rounded-[30px] bg-card">
        <ActivityIndicator color={isDark ? '#FFFFFF' : '#000000'} />
      </View>
    );
  }

  return (
    <View className="mt-[14px]">
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={
          continueLabel
            ? AppleAuthentication.AppleAuthenticationButtonType.CONTINUE
            : AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
        }
        // Sobre fondo claro va el negro; sobre fondo oscuro, el blanco.
        buttonStyle={
          isDark
            ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
            : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
        }
        cornerRadius={27}
        style={{ height: 54, width: '100%', opacity: disabled ? 0.5 : 1 }}
        onPress={() => {
          if (!disabled) onPress?.();
        }}
      />
    </View>
  );
}
