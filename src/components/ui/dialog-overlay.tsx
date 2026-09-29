import type { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

type Props = {
  visible: boolean;
  /** Toca el fondo oscuro para cerrar (se omite mientras `working`/`saving`). */
  onBackdropPress?: () => void;
  /** Sube el contenido cuando el teclado lo taparía (formularios con texto). */
  keyboardAvoiding?: boolean;
  children: ReactNode;
};

const styles = StyleSheet.create({
  // Cubre TODO el `OrderDetailModal` que ya está abierto (no la pantalla del
  // sistema — este componente vive DENTRO de ese Modal, no en uno propio).
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, elevation: 50 },
});

/**
 * Diálogo de confirmación/formulario SIN `Modal` nativo propio.
 *
 * Los diálogos de acción de pedidos (aceptar, cancelar, código de
 * verificación, reportar accidente/falla…) siempre se abren con el
 * `OrderDetailModal` YA visible. Apilar un `<Modal>` de React Native sobre
 * OTRO `<Modal>` es un bug conocido de Android: la segunda ventana nativa a
 * veces no se compone hasta que algo fuerza un re-layout (salir de la
 * pantalla y volver) — por eso había que tocar "Aceptar"/"Entregar al
 * domiciliario" varias veces para que apareciera el diálogo.
 *
 * Este componente reemplaza ese segundo `Modal` por una `View` absoluta
 * normal: se monta DENTRO del `Modal` que ya está abierto (vía el prop
 * `overlay` de `OrderDetailModal`), así solo hay una ventana nativa a la vez
 * y no depende de ningún timing de Android.
 */
export function DialogOverlay({
  visible,
  onBackdropPress,
  keyboardAvoiding = true,
  children,
}: Props) {
  if (!visible) return null;

  const card = (
    <Pressable onPress={() => {}} className="w-full">
      {children}
    </Pressable>
  );

  if (!keyboardAvoiding) {
    return (
      <Pressable
        style={styles.fill}
        className="items-center justify-center bg-black/50 px-8"
        onPress={onBackdropPress}
      >
        {card}
      </Pressable>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.fill} behavior="padding">
      <Pressable
        className="flex-1 items-center justify-center bg-black/50 px-8"
        onPress={onBackdropPress}
      >
        {card}
      </Pressable>
    </KeyboardAvoidingView>
  );
}
