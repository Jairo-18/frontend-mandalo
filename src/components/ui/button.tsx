import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, Text } from 'react-native';

import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
};

/**
 * Botón principal de la app (variante `primary`, la más usada — login,
 * registro, formularios, confirmaciones): degradado de marca real
 * (primary→dark, horizontal), mismo tratamiento que headers/sidebars —
 * antes era un `bg-primary` sólido, que se veía "rojo puro" y no como el
 * ícono. `outline` se queda como borde simple, sin degradado (es la
 * variante secundaria/cancelar).
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
}: Props) {
  const colors = useResolvedAppColors();
  const isPrimary = variant === 'primary';

  const content = loading ? (
    <ActivityIndicator color={isPrimary ? '#FFFFFF' : colors.primaryColor} />
  ) : (
    <Text
      className={`text-base font-bold ${isPrimary ? 'text-white' : 'text-primary'}`}
    >
      {label}
    </Text>
  );

  if (isPrimary) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        className={`overflow-hidden rounded-[30px] shadow-md active:opacity-80 ${disabled ? 'opacity-50' : ''}`}
      >
        <LinearGradient
          colors={[colors.primaryColor, colors.darkColor]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ height: 54, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}
        >
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`h-[54px] items-center justify-center rounded-[30px] border-[1.5px] border-primary bg-card px-6 active:opacity-80 ${disabled ? 'opacity-50' : ''}`}
    >
      {content}
    </Pressable>
  );
}
