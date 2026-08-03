import { Ionicons } from '@expo/vector-icons';
import { Linking, Pressable, Text, View } from 'react-native';

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Mensaje de error de validación (se muestra debajo, mismo patrón que TextField/Select). */
  error?: string;
};

/**
 * Checkbox de aceptación de Términos y Condiciones + Política de Tratamiento
 * de Datos (registro y onboarding post-Google). A diferencia de `Checkbox`
 * genérico, el label lleva 2 enlaces tocables — por eso NO es un solo
 * Pressable grande (mismo criterio que `DeveloperCredit`: un área tocable
 * enorme con links adentro genera toques accidentales). Tocar el texto plano
 * también marca/desmarca; solo los 2 nombres subrayados navegan.
 *
 * Los enlaces abren la web (somosmandalo.com) en vez de una pantalla interna:
 * son los documentos legales oficiales (registrados en Cámara de Comercio),
 * una sola fuente de verdad en vez de una copia duplicada dentro de la app.
 */
export function TermsCheckbox({ checked, onChange, error }: Props) {
  return (
    <View className="mb-4">
      <View className="flex-row items-start gap-2.5">
        <Pressable
          onPress={() => onChange(!checked)}
          hitSlop={8}
          className={`mt-0.5 h-5 w-5 items-center justify-center rounded-md border ${
            checked ? 'border-primary bg-primary' : 'border-gray-300 bg-card'
          }`}
        >
          {checked && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
        </Pressable>

        <Text
          className="flex-1 text-[13px] leading-5 text-muted"
          onPress={() => onChange(!checked)}
        >
          He leído y acepto los{' '}
          <Text
            className="font-bold text-primary"
            suppressHighlighting
            onPress={() => Linking.openURL('https://somosmandalo.com/terminos-y-condiciones-de-uso')}
          >
            Términos y Condiciones
          </Text>{' '}
          y la{' '}
          <Text
            className="font-bold text-primary"
            suppressHighlighting
            onPress={() => Linking.openURL('https://somosmandalo.com/politicas-de-privacidad')}
          >
            Política de Tratamiento de Datos
          </Text>
        </Text>
      </View>

      {error ? (
        <Text className="ml-[30px] mt-1 text-xs font-medium text-red-500">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
