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
import { getAppColors } from '@/lib/app-colors';

export type SelectOption<T extends string | number = number> = {
  label: string;
  value: T;
};

type Props<T extends string | number> = {
  label: string;
  options: SelectOption<T>[];
  value?: T;
  onSelect: (value: T) => void;
  icon?: keyof typeof Ionicons.glyphMap;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  /** Mensaje de error de validación (se muestra debajo del campo). */
  error?: string;
};

export function Select<T extends string | number = number>({
  label,
  options,
  value,
  onSelect,
  icon,
  placeholder = 'Selecciona una opción',
  disabled = false,
  loading = false,
  error,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const selected = options.find((o) => o.value === value);
  const mutedColor = getAppColors().mutedColor;

  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-bold text-ink">{label}</Text>

      <Pressable
        disabled={disabled}
        onPress={() => setOpen(true)}
        className={`h-[52px] flex-row items-center gap-2.5 rounded-xl border px-3.5 ${
          error ? 'border-red-500' : 'border-border'
        } ${disabled ? 'bg-surface opacity-60' : ''}`}
      >
        {icon && <Ionicons name={icon} size={20} color={mutedColor} />}
        <Text
          numberOfLines={1}
          className={`flex-1 text-[15px] ${
            selected ? 'text-ink' : 'text-muted'
          }`}
        >
          {selected ? selected.label : placeholder}
        </Text>
        {loading ? (
          <ActivityIndicator size="small" color={mutedColor} />
        ) : (
          <Ionicons name="chevron-down" size={18} color={mutedColor} />
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
            className="max-h-[70%] rounded-t-3xl bg-card px-4 pt-4"
            // Safe-area inferior: sin esto la hoja queda detrás de la barra de
            // navegación del sistema (edge-to-edge de Android).
            style={{ paddingBottom: insets.bottom + 16 }}
            onPress={() => {}}
          >
            <View className="mb-3 h-1 w-10 self-center rounded-full bg-border" />
            <Text className="mb-3 text-center text-base font-bold text-ink">
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
                  className="flex-row items-center justify-between border-b border-border py-3.5 active:opacity-60"
                >
                  <Text
                    className={`text-[15px] ${
                      item.value === value
                        ? 'font-bold text-primary'
                        : 'text-ink'
                    }`}
                  >
                    {item.label}
                  </Text>
                  {item.value === value && (
                    <Ionicons name="checkmark" size={18} color={getAppColors().primaryColor} />
                  )}
                </Pressable>
              )}
              ListEmptyComponent={
                <Text className="py-6 text-center text-sm text-muted">
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
