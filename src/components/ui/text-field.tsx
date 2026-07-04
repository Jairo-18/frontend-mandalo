import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, TextInput, TextInputProps, View } from 'react-native';

const PLACEHOLDER = '#9CA3AF';

type Props = TextInputProps & {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** Muestra el campo como contraseña (con toggle de mostrar/ocultar). */
  secure?: boolean;
  /** Mensaje de error de validación (se muestra debajo del campo). */
  error?: string;
};

export function TextField({ label, icon, secure, error, ...inputProps }: Props) {
  const [hidden, setHidden] = useState(true);

  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-bold text-gray-700">{label}</Text>
      <View
        className={`h-[52px] flex-row items-center gap-2.5 rounded-xl border px-3.5 ${
          error ? 'border-red-500' : 'border-gray-200'
        }`}
      >
        <Ionicons name={icon} size={20} color={PLACEHOLDER} />
        <TextInput
          className="h-full flex-1 text-[15px] text-dark"
          placeholderTextColor={PLACEHOLDER}
          autoCapitalize="none"
          secureTextEntry={secure ? hidden : false}
          {...inputProps}
        />
        {secure && (
          <Pressable onPress={() => setHidden((v) => !v)} hitSlop={8}>
            <Ionicons
              name={hidden ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={PLACEHOLDER}
            />
          </Pressable>
        )}
      </View>
      {error ? (
        <Text className="mt-1 text-xs font-medium text-red-500">{error}</Text>
      ) : null}
    </View>
  );
}
