import { ReactNode } from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  children: ReactNode;
  /** Padding inferior extra además del safe-area (px). */
  extraBottom?: number;
  /**
   * `false` cuando la pantalla vive DENTRO de un menú inferior de Tabs
   * (paneles de cliente/repartidor: `(client)/_layout.tsx`,
   * `delivery/_layout.tsx`) — ese menú ya reserva el inset real del
   * dispositivo en su propia altura, así que sumarlo acá TAMBIÉN duplicaba
   * el espacio vacío entre el contenido y el menú (bug real reportado por el
   * usuario en "Mi cuenta", "Cambiar contraseña" y "Reenviar documentos").
   * Default `true` para no romper las pantallas standalone (auth, admin/
   * negocio con drawer lateral, modales) que sí tocan el borde real.
   */
  safeBottom?: boolean;
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
export function KeyboardAwareScroll({
  children,
  extraBottom = 24,
  safeBottom = true,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        flexGrow: 1,
        paddingBottom: (safeBottom ? insets.bottom : 0) + extraBottom,
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
