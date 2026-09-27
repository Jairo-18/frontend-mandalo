import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getAppColors } from '@/lib/app-colors';

type Action = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  destructive?: boolean;
};

type Props = {
  visible: boolean;
  label: string;
  /** Ya hay una foto/documento: se ofrece "Ver". */
  onView?: () => void;
  /** Texto del botón de `onView` ("Ver foto" por defecto; "Abrir PDF" para documentos). */
  viewLabel?: string;
  onPickLibrary: () => void;
  onPickCamera: () => void;
  /** Documentos de vehículo: además de foto, aceptan un PDF. */
  onPickPdf?: () => void;
  /** Quitar sin reemplazo (solo campos opcionales: avatar, logo, QR). */
  onRemove?: () => void;
  onClose: () => void;
};

/**
 * Hoja de acciones con la estética de la marca (reemplaza el `Alert.alert`
 * nativo del sistema) para los campos de foto/documento: `PhotoField`,
 * `DocumentPhotoField`, `VehicleDocumentField` y `ProductPhotosField`.
 */
export function PhotoActionsSheet({
  visible,
  label,
  onView,
  viewLabel = 'Ver foto',
  onPickLibrary,
  onPickCamera,
  onPickPdf,
  onRemove,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const colors = getAppColors();
  const pendingAction = useRef<(() => void) | null>(null);

  function run(action: () => void) {
    if (Platform.OS === 'ios') {
      // En iPad, expo-image-picker (y la cámara) presentan su propio picker
      // como popover del sistema: si el Modal de esta hoja todavía se está
      // desmontando, iOS no logra montarlo encima y el botón queda "sin
      // respuesta" (rechazo 2.1(a), Apple 2026-09-24). Se espera a que este
      // Modal termine de cerrarse (`onDismiss`, solo iOS) antes de disparar
      // la acción.
      pendingAction.current = action;
      onClose();
    } else {
      onClose();
      action();
    }
  }

  const actions: Action[] = [
    ...(onView
      ? [{ key: 'view', label: viewLabel, icon: 'eye-outline' as const, onPress: onView }]
      : []),
    {
      key: 'library',
      label: 'Elegir de la galería',
      icon: 'image-outline',
      onPress: onPickLibrary,
    },
    { key: 'camera', label: 'Tomar foto', icon: 'camera-outline', onPress: onPickCamera },
    ...(onPickPdf
      ? [
          {
            key: 'pdf',
            label: 'Elegir archivo PDF',
            icon: 'document-attach-outline' as const,
            onPress: onPickPdf,
          },
        ]
      : []),
    ...(onRemove
      ? [
          {
            key: 'remove',
            label: 'Eliminar foto',
            icon: 'trash-outline' as const,
            onPress: onRemove,
            destructive: true,
          },
        ]
      : []),
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      onDismiss={() => {
        const action = pendingAction.current;
        pendingAction.current = null;
        action?.();
      }}
    >
      {/* Backdrop: tocar afuera cierra */}
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />

      <View
        className="rounded-t-[24px] bg-card px-5 pt-4"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <View className="mb-2 flex-row items-center justify-between">
          <Text numberOfLines={1} className="flex-1 text-base font-extrabold text-ink">
            {label}
          </Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={22} color={colors.inkColor} />
          </Pressable>
        </View>

        {actions.map((action) => (
          <Pressable
            key={action.key}
            onPress={() => run(action.onPress)}
            className="flex-row items-center gap-3 rounded-xl px-1 py-3.5 active:opacity-60"
          >
            <Ionicons
              name={action.icon}
              size={20}
              color={action.destructive ? '#DC2626' : colors.primaryColor}
            />
            <Text
              className={`text-[15px] font-bold ${
                action.destructive ? 'text-red-600' : 'text-ink'
              }`}
            >
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </Modal>
  );
}
