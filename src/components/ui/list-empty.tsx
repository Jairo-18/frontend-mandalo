import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  message: string;
};

/** Estado vacío de los listados (icono + mensaje centrados). */
export function ListEmpty({ icon, message }: Props) {
  return (
    <View className="items-center pt-24">
      <Ionicons name={icon} size={44} color="#C9C9D4" />
      <Text className="mt-3 px-8 text-center text-sm text-muted">{message}</Text>
    </View>
  );
}
