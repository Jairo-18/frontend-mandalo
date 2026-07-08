import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { KeyboardAwareScroll } from '@/components/ui/keyboard-aware-scroll';

type Props = {
  visible: boolean;
  title: string;
  onClose: () => void;
  /** Texto del botón principal ("Crear usuario", "Guardar cambios"…). */
  saveLabel: string;
  onSave: () => void;
  saving?: boolean;
  /** Campos del formulario (van dentro del scroll con teclado). */
  children: ReactNode;
};

/**
 * Cascarón de los modales de formulario a pantalla completa del panel:
 * cabecera con título y cerrar, scroll consciente del teclado y botones
 * Guardar/Cancelar al final. Los campos van como children.
 */
export function FormModal({
  visible,
  title,
  onClose,
  saveLabel,
  onSave,
  saving = false,
  children,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
        {/* Cabecera del modal */}
        <View className="flex-row items-center justify-between border-b border-gray-100 px-5 py-4">
          <Text className="text-lg font-extrabold text-dark">{title}</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={26} color="#1E1E2D" />
          </Pressable>
        </View>

        <KeyboardAwareScroll>
          <View className="px-5 pt-5">
            {children}

            <Button label={saveLabel} onPress={onSave} loading={saving} />
            <View className="mt-3">
              <Button label="Cancelar" variant="outline" onPress={onClose} />
            </View>
          </View>
        </KeyboardAwareScroll>
      </View>
    </Modal>
  );
}
