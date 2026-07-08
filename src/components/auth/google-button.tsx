import { ActivityIndicator, Image, Pressable, Text } from 'react-native';

type Props = {
  label?: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
};

/** Botón "Continuar con Google" siguiendo el branding oficial de Google
 * (G multicolor, fondo blanco, borde #DADCE0, texto #3C4043). */
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
      className={`h-[54px] flex-row items-center justify-center gap-3 rounded-[30px] border border-[#DADCE0] bg-white shadow-sm active:bg-[#F8F9FA] active:border-[#D2E3FC] ${
        disabled ? 'opacity-50' : ''
      }`}
      style={{
        shadowColor: '#1E1E2D',
        shadowOpacity: 0.08,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      }}
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
          <Text className="text-base font-semibold text-[#3C4043]">
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}
