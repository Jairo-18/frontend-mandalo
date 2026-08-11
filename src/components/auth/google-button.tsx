import { ActivityIndicator, Image, Pressable, Text } from 'react-native';
import { getAppColors } from '@/lib/app-colors';
import { useAppTheme } from '@/context/app-theme';

type Props = {
  label?: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
};

/** Botón "Continuar con Google" siguiendo el branding oficial de Google
 * (G multicolor). Colores según la spec oficial de Google para modo claro
 * (fondo blanco, borde #DADCE0, texto #3C4043) y modo oscuro (fondo
 * #131314, borde #8E918F, texto #E8EAED) — sin esto el texto quedaba gris
 * oscuro sobre fondo oscuro y era ilegible. */
export function GoogleButton({
  label = 'Continuar con Google',
  onPress,
  loading = false,
  disabled = false,
}: Props) {
  const { isDark } = useAppTheme();
  const borderColor = isDark ? '#8E918F' : '#DADCE0';
  const textColor = isDark ? '#E8EAED' : '#3C4043';
  const activeBg = isDark ? '#1E1F20' : '#F8F9FA';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`h-[54px] flex-row items-center justify-center gap-3 rounded-[30px] border bg-card shadow-sm ${
        disabled ? 'opacity-50' : ''
      }`}
      style={({ pressed }) => ({
        borderColor,
        backgroundColor: pressed ? activeBg : undefined,
        shadowColor: getAppColors().darkColor,
        shadowOpacity: 0.08,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      })}
    >
      {loading ? (
        <ActivityIndicator color="#4285F4" />
      ) : (
        <>
          <Image
            source={require('../../../assets/images/google-logo.png')}
            className="h-[22px] w-[22px]"
            resizeMode="contain"
          />
          <Text className="text-base font-semibold" style={{ color: textColor }}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}
