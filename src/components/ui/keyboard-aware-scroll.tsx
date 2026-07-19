import { ReactNode } from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
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
 *
 * Usa react-native-keyboard-controller: con el edge-to-edge de Android el
 * `adjustResize` nativo no funciona y el KeyboardAvoidingView de RN no se
 * entera del teclado (tampoco dentro de <Modal statusBarTranslucent>).
 */
export function KeyboardAwareScroll({ children, extraBottom = 24 }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        flexGrow: 1,
        paddingBottom: insets.bottom + extraBottom,
      }}
      // Espacio entre el campo enfocado y el borde del teclado.
      bottomOffset={24}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </KeyboardAwareScrollView>
  );
}
