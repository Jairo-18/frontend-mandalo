import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type SelectOption = { label: string; value: number };

type Props = {
  label: string;
  options: SelectOption[];
  value?: number;
  onSelect: (value: number) => void;
  icon?: keyof typeof Ionicons.glyphMap;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  /** Mensaje de error de validación (se muestra debajo del campo). */
  error?: string;
};

export function Select({
  label,
  options,
  value,
  onSelect,
  icon,
  placeholder = 'Selecciona una opción',
  disabled = false,
  loading = false,
  error,
}: Props) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const selected = options.find((o) => o.value === value);

  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-bold text-gray-700">{label}</Text>

      <Pressable
        disabled={disabled}
        onPress={() => setOpen(true)}
        className={`h-[52px] flex-row items-center gap-2.5 rounded-xl border px-3.5 ${
          error ? 'border-red-500' : 'border-gray-200'
        } ${disabled ? 'bg-gray-50 opacity-60' : ''}`}
      >
        {icon && <Ionicons name={icon} size={20} color="#9CA3AF" />}
        <Text
          numberOfLines={1}
          className={`flex-1 text-[15px] ${
            selected ? 'text-dark' : 'text-gray-400'
          }`}
        >
          {selected ? selected.label : placeholder}
        </Text>
        {loading ? (
          <ActivityIndicator size="small" color="#9CA3AF" />
        ) : (
          <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
        )}
      </Pressable>

      {error ? (
        <Text className="mt-1 text-xs font-medium text-red-500">{error}</Text>
      ) : null}

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/40"
          onPress={() => setOpen(false)}
        >
          <Pressable
            className="max-h-[70%] rounded-t-3xl bg-white px-4 pt-4"
            // Safe-area inferior: sin esto la hoja queda detrás de la barra de
            // navegación del sistema (edge-to-edge de Android).
            style={{ paddingBottom: insets.bottom + 16 }}
            onPress={() => {}}
          >
            <View className="mb-3 h-1 w-10 self-center rounded-full bg-gray-200" />
            <Text className="mb-3 text-center text-base font-bold text-dark">
              {label}
            </Text>
            <FlatList
              data={options}
              keyExtractor={(o) => String(o.value)}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onSelect(item.value);
                    setOpen(false);
                  }}
                  className="flex-row items-center justify-between border-b border-gray-100 py-3.5 active:opacity-60"
                >
                  <Text
                    className={`text-[15px] ${
                      item.value === value
                        ? 'font-bold text-primary'
                        : 'text-gray-800'
                    }`}
                  >
                    {item.label}
                  </Text>
                  {item.value === value && (
                    <Ionicons name="checkmark" size={18} color="#FF5A3C" />
                  )}
                </Pressable>
              )}
              ListEmptyComponent={
                <Text className="py-6 text-center text-sm text-gray-400">
                  Sin opciones disponibles
                </Text>
              }
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
