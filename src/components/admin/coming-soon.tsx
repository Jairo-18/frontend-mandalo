import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { getAppColors } from '@/lib/app-colors';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
};

/** Placeholder para secciones del panel admin que aún no tienen CRUD. */
export function ComingSoon({ icon, title, description }: Props) {
  return (
    <View className="flex-1 items-center justify-center px-10">
      <View className="mb-5 h-20 w-20 items-center justify-center">
        <Ionicons name={icon} size={46} color={getAppColors().primaryColor} />
      </View>
      <Text className="text-xl font-extrabold text-ink">{title}</Text>
      <Text className="mt-2 text-center text-sm text-muted">{description}</Text>
      <View className="mt-5 rounded-full bg-dark px-4 py-1.5">
        <Text className="text-xs font-bold text-white">Próximamente</Text>
      </View>
    </View>
  );
}
