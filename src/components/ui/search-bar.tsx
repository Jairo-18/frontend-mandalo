import { Ionicons } from '@expo/vector-icons';
import { Pressable, TextInput, View } from 'react-native';

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
};

/** Barra de búsqueda de los listados del panel (con botón para limpiar). */
export function SearchBar({ value, onChangeText, placeholder }: Props) {
  return (
    <View className="h-[46px] flex-row items-center gap-2.5 rounded-xl bg-white px-3.5">
      <Ionicons name="search-outline" size={19} color="#9CA3AF" />
      <TextInput
        className="h-full flex-1 text-[15px] text-dark"
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        autoCapitalize="none"
        autoCorrect={false}
        value={value}
        onChangeText={onChangeText}
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChangeText('')} hitSlop={8}>
          <Ionicons name="close-circle" size={18} color="#9CA3AF" />
        </Pressable>
      )}
    </View>
  );
}
