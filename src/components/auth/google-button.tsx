import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text } from 'react-native';

type Props = {
  label?: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
};

/** Botón "Continuar con Google" con el estilo de los botones de auth. */
export function GoogleButton({
  label = 'Continuar con Google',
  onPress,
  loading = false,
  disabled = false,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`h-[54px] flex-row items-center justify-center gap-2.5 rounded-[30px] border-[1.5px] border-gray-200 bg-white active:opacity-80 ${
        disabled ? 'opacity-50' : ''
      }`}
    >
      {loading ? (
        <ActivityIndicator color="#1E1E2D" />
      ) : (
        <>
          <Ionicons name="logo-google" size={20} color="#1E1E2D" />
          <Text className="text-base font-bold text-dark">{label}</Text>
        </>
      )}
    </Pressable>
  );
}
