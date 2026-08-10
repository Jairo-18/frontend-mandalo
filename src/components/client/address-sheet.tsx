import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
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
 *
 * IMPORTANTE (bug real encontrado en Android, APK de producción): este modal
 * NO debe ocultarse (`visible=false`) mientras el formulario interno (otro
 * `<Modal>`, anidado dentro de `AddressManager`) está abierto. Se intentó
 * antes con `visible={visible && !formOpen}` para bajar la cantidad de
 * modales nativos apilados — pero en Android, a diferencia de iOS, el
 * `<Modal>` de React Native con `visible=false` no solo oculta la ventana
 * nativa: DESMONTA todo su subárbol de React (confirmado en el código fuente
 * de `react-native/Libraries/Modal/Modal.js`: `_shouldShowModal()` en
 * Android es solo `this.props.visible === true`, sin el fallback
 * `isRendered` que sí tiene iOS). Como `AddressFormModal` es HIJO de
 * `AddressManager`, que a su vez es hijo de ESTE modal, ocultar este modal
 * al abrir el formulario lo desmontaba a él también — el usuario veía la
 * hoja cerrarse sin que se abriera nada, y como el store de direcciones
 * (`lib/user-data.ts`) es compartido, "Mis direcciones" también quedaba
 * mostrando datos viejos después. Con los dos modales SIEMPRE visibles a la
 * vez (patrón estándar, usado en todo el resto de la app) no hay desmontaje.
 */
export function AddressSheet({ visible, onClose }: Props) {
  const colors = useResolvedAppColors();
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();

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

        <AddressManager />
      </View>
    </Modal>
  );
}
