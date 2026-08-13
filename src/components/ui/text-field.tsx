import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, TextInput, TextInputProps, View } from 'react-native';

import { getAppColors } from '@/lib/app-colors';
import { finishText, formatText, TextFormat } from '@/lib/text-format';
import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';

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
  /**
   * Campo de solo lectura: se ve pero no se edita (fondo gris, texto atenuado).
   * Para datos que asigna otro rol, p. ej. la razón social en el panel del
   * negocio (la asigna el admin/vendedor).
   */
  readOnly?: boolean;
  /**
   * Desactiva el autofill del sistema (además de los campos `secure`, que ya
   * lo desactivan). Úsalo en el CORREO de los formularios de login/registro:
   * si el correo conserva la pista de autofill, Android muestra el diálogo
   * "¿Guardar/actualizar contraseña?" al ver el par correo+contraseña.
   */
  noAutofill?: boolean;
  /**
   * Muestra "N/maxLength" debajo del campo mientras se escribe (requiere
   * pasar también `maxLength`). Pensado para descripciones largas
   * (`multiline`) donde el límite no es obvio a simple vista.
   */
  showCharCount?: boolean;
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
  plate: { autoCapitalize: 'characters', autoCorrect: false },
};

export function TextField({
  label,
  icon,
  secure,
  error,
  format,
  readOnly,
  noAutofill,
  showCharCount,
  onChangeText,
  onBlur,
  multiline,
  numberOfLines,
  ...inputProps
}: Props) {
  const colors = useResolvedAppColors();
  const [hidden, setHidden] = useState(true);
  const placeholderColor = colors.mutedColor;

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
      <Text className="mb-2 text-sm font-bold text-ink">{label}</Text>
      <View
        className={`flex-row gap-2.5 rounded-xl border px-3.5 ${
          multiline ? 'items-start py-3' : 'h-[52px] items-center'
        } ${error ? 'border-red-500' : 'border-border'} ${
          readOnly ? 'bg-surface' : ''
        }`}
      >
        <Ionicons
          name={readOnly ? 'lock-closed' : icon}
          size={20}
          color={placeholderColor}
          style={multiline ? { marginTop: 2 } : undefined}
        />
        <TextInput
          editable={!readOnly}
          className={`flex-1 text-[15px] ${readOnly ? 'text-muted' : 'text-ink'} ${multiline ? '' : 'h-full'}`}
          style={
            multiline
              ? { minHeight: (numberOfLines ?? 3) * 22, textAlignVertical: 'top' }
              : undefined
          }
          placeholderTextColor={placeholderColor}
          autoCapitalize="none"
          secureTextEntry={secure ? hidden : false}
          multiline={multiline}
          numberOfLines={numberOfLines}
          {...(format ? FORMAT_DEFAULTS[format] : undefined)}
          // Contraseña (secure) o correo con `noAutofill`: se desactiva el
          // autofill para que el Gestor de Google/Android NO muestre el diálogo
          // "¿Guardar/actualizar contraseña?". Debe ir en AMBOS campos del par
          // (correo + contraseña): con que uno conserve la pista, el diálogo
          // sale igual. La app ya tiene su "Recordar mis datos" (SecureStore).
          {...(secure || noAutofill
            ? {
                autoComplete: 'off' as const,
                textContentType: 'none' as const,
                importantForAutofill: 'no' as const,
              }
            : undefined)}
          {...inputProps}
          onChangeText={handleChangeText}
          onBlur={handleBlur}
        />
        {secure && (
          <Pressable onPress={() => setHidden((v) => !v)} hitSlop={8}>
            <Ionicons
              name={hidden ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={placeholderColor}
            />
          </Pressable>
        )}
      </View>
      <View className="mt-1 flex-row items-start justify-between">
        {error ? (
          <Text className="flex-1 text-xs font-medium text-red-500">{error}</Text>
        ) : (
          <View className="flex-1" />
        )}
        {showCharCount && inputProps.maxLength != null && (
          <Text className="text-xs font-medium text-muted">
            {typeof inputProps.value === 'string' ? inputProps.value.length : 0}/
            {inputProps.maxLength}
          </Text>
        )}
      </View>
    </View>
  );
}
