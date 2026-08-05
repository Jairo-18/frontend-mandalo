import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddressManager } from '@/components/client/address-manager';
import { useAppTheme } from '@/context/app-theme';
import { refreshAddresses } from '@/lib/user-data';
import { getAppColors } from '@/lib/app-colors';
import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';

type Props = {
  visible: boolean;
  onClose: () => void;
};

/**
 * Hoja "Enviar a…" del home: la gestión de direcciones (elegir principal,
 * agregar, editar, eliminar) vive en `AddressManager` — compartida con la
 * pantalla "Mis direcciones" del drawer. Acá solo va el cascarón del modal.
 */
export function AddressSheet({ visible, onClose }: Props) {
  const colors = useResolvedAppColors();
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  // Mientras el formulario interno (y su mapa) está abierto, esta hoja se
  // oculta: con los 2 modales anidados de acá + los del formulario + el
  // mapa + el aviso de ubicación quedan 4 modales de React Native apilados,
  // y Android no siempre saca a la vista el más nuevo (el aviso de ubicación
  // quedaba invisible). Ocultar esta hoja de por medio baja la pila a la
  // misma profundidad que desde "Mis direcciones" (sin esta hoja), donde sí
  // funciona. El estado del formulario no se pierde: sigue montado, solo se
  // deja de ver la ventana nativa de ESTE modal.
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    // Al abrir revalida si el TTL venció (normalmente no toca la red).
    if (visible) void refreshAddresses();
  }, [visible]);

  return (
    <Modal
      visible={visible && !formOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop: tocar afuera cierra */}
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />

      <View
        className="max-h-[75%] rounded-t-[24px] bg-card px-5 pt-4"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-lg font-extrabold text-ink">
            Mis direcciones
          </Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={24} color={colors.inkColor} />
          </Pressable>
        </View>

        <AddressManager onFormVisibleChange={setFormOpen} />
      </View>
    </Modal>
  );
}
