import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  children: ReactNode;
  /** Padding inferior extra además del safe-area (px). */
  extraBottom?: number;
};

/**
 * Contenedor scrolleable que:
 * - respeta el área segura inferior (barra de gestos / navegación del teléfono),
 * - sube el contenido al abrir el teclado para que se vea el campo enfocado.
 */
export function KeyboardAwareScroll({ children, extraBottom = 24 }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: insets.bottom + extraBottom,
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
