import { Text, View } from 'react-native';

/** Título de sección con la barrita de acento de la marca (home, dashboards). */
export function SectionTitle({ label }: { label: string }) {
  return (
    <View className="mb-2 flex-row items-center gap-2 px-5">
      <View className="h-4 w-1.5 rounded-full bg-primary" />
      <Text className="text-base font-extrabold text-dark">{label}</Text>
    </View>
  );
}
