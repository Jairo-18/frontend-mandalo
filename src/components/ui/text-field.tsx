import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, TextInput, TextInputProps, View } from 'react-native';

import { finishText, formatText, TextFormat } from '@/lib/text-format';

const PLACEHOLDER = '#9CA3AF';

type Props = TextInputProps & {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** Muestra el campo como contraseña (con toggle de mostrar/ocultar). */
  secure?: boolean;
  /** Mensaje de error de validación (se muestra debajo del campo). */
  error?: string;
  /**
   * Pipeline de formateo (`lib/text-format.ts`): limpia espacios y aplica la
   * regla del tipo de dato mientras se escribe (name/email/digits/username/
   * text) + trim al salir del campo. NO usar en contraseñas.
   */
  format?: TextFormat;
};

/** Props de teclado que cada formato trae por defecto (sobrescribibles). */
const FORMAT_DEFAULTS: Partial<Record<TextFormat, TextInputProps>> = {
  digits: { keyboardType: 'number-pad' },
  email: {
    keyboardType: 'email-address',
    autoComplete: 'email',
    autoCorrect: false,
  },
  name: { autoCorrect: false },
  username: { autoCorrect: false },
  phone: { keyboardType: 'phone-pad', autoCorrect: false },
  identification: { autoCorrect: false },
  upper: { autoCapitalize: 'characters', autoCorrect: false },
  // iOS muestra teclado numérico con signos; Android cae al teclado normal.
  nit: { keyboardType: 'numbers-and-punctuation', autoCorrect: false },
  cop: { keyboardType: 'number-pad' },
};

export function TextField({
  label,
  icon,
  secure,
  error,
  format,
  onChangeText,
  onBlur,
  multiline,
  numberOfLines,
  ...inputProps
}: Props) {
  const [hidden, setHidden] = useState(true);

  const handleChangeText = (value: string) => {
    onChangeText?.(format ? formatText(format, value) : value);
  };

  const handleBlur: TextInputProps['onBlur'] = (e) => {
    // Limpieza final: quita el espacio que se permite al final mientras se escribe.
    if (format && typeof inputProps.value === 'string') {
      const finished = finishText(inputProps.value);
      if (finished !== inputProps.value) onChangeText?.(finished);
    }
    onBlur?.(e);
  };

  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-bold text-gray-700">{label}</Text>
      <View
        className={`flex-row gap-2.5 rounded-xl border px-3.5 ${
          multiline ? 'items-start py-3' : 'h-[52px] items-center'
        } ${error ? 'border-red-500' : 'border-gray-200'}`}
      >
        <Ionicons
          name={icon}
          size={20}
          color={PLACEHOLDER}
          style={multiline ? { marginTop: 2 } : undefined}
        />
        <TextInput
          className={`flex-1 text-[15px] text-dark ${multiline ? '' : 'h-full'}`}
          style={
            multiline
              ? { minHeight: (numberOfLines ?? 3) * 22, textAlignVertical: 'top' }
              : undefined
          }
          placeholderTextColor={PLACEHOLDER}
          autoCapitalize="none"
          secureTextEntry={secure ? hidden : false}
          multiline={multiline}
          numberOfLines={numberOfLines}
          {...(format ? FORMAT_DEFAULTS[format] : undefined)}
          {...inputProps}
          onChangeText={handleChangeText}
          onBlur={handleBlur}
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
