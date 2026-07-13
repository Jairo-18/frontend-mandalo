import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddressManager } from '@/components/client/address-manager';
import { refreshAddresses } from '@/lib/user-data';

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
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Al abrir revalida si el TTL venció (normalmente no toca la red).
    if (visible) void refreshAddresses();
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop: tocar afuera cierra */}
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />

      <View
        className="max-h-[75%] rounded-t-[24px] bg-white px-5 pt-4"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-lg font-extrabold text-dark">
            Mis direcciones
          </Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={24} color="#1E1E2D" />
          </Pressable>
        </View>

        <AddressManager />
      </View>
    </Modal>
  );
}
