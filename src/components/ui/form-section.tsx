import { Text, View } from 'react-native';

/**
 * Encabezado de sección de los formularios largos (registro, onboarding):
 * parte el formulario en bloques digeribles con la barrita de acento.
 */
export function FormSection({ label }: { label: string }) {
  return (
    <View className="mb-3 mt-2 flex-row items-center gap-2">
      <View className="h-4 w-1.5 rounded-full bg-primary" />
      <Text className="text-[15px] font-extrabold text-dark">{label}</Text>
    </View>
  );
}
