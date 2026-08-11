import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { getAppColors } from '@/lib/app-colors';

type Props = {
  visible: boolean;
  /** Pregunta principal ("¿Eliminar usuario?"). */
  title: string;
  /** Detalle/consecuencias de la acción. */
  message?: string;
  /** Etiqueta del botón que confirma (default "Sí, continuar"). */
  confirmLabel?: string;
  /** Etiqueta del botón que cancela (default "Cancelar"). */
  cancelLabel?: string;
  /** Acción peligrosa (eliminar): botón e icono en rojo. */
  destructive?: boolean;
  /** Icono de la cabecera; default según `destructive`. */
  icon?: keyof typeof Ionicons.glyphMap;
  /**
   * Confirmación. Si devuelve promesa, el botón muestra spinner y el diálogo
   * queda bloqueado hasta que termine (el padre decide cerrar en su estado).
   */
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

/**
 * Diálogo de confirmación Sí/No con la estética de la marca. Reemplaza los
 * Alert.alert nativos de "¿Estás seguro?" (eliminar negocio/usuario/etiqueta…).
 */
export function YesNoDialog({
  visible,
  title,
  message,
  confirmLabel = 'Sí, continuar',
  cancelLabel = 'Cancelar',
  destructive = false,
  icon,
  onConfirm,
  onCancel,
}: Props) {
  const [working, setWorking] = useState(false);

  const headerIcon =
    icon ?? (destructive ? 'trash-outline' : 'help-circle-outline');

  async function handleConfirm() {
    if (working) return;
    try {
      setWorking(true);
      await onConfirm();
    } finally {
      setWorking(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={working ? undefined : onCancel}
      statusBarTranslucent
    >
      <Pressable
        className="flex-1 items-center justify-center bg-black/50 px-8"
        onPress={working ? undefined : onCancel}
      >
        <Pressable
          className="w-full max-h-[85%] rounded-3xl border border-border bg-card"
          onPress={() => {}}
        >
          {/* Textos largos (p. ej. la divulgación de ubicación en segundo
              plano) más letra/pantalla del sistema agrandadas pueden no
              entrar completos — sin esto el contenido se corta contra el
              borde y los botones quedan inalcanzables en vez de solo pedir
              scroll. En el caso normal el contenido entra igual sin que se
              note que es scrolleable. */}
          <ScrollView
            className="p-6"
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
          >
            <View className="mb-4 h-14 w-14 self-center items-center justify-center">
              <Ionicons
                name={headerIcon}
                size={30}
                color={destructive ? '#DC2626' : getAppColors().primaryColor}
              />
            </View>

            <Text className="text-center text-lg font-extrabold text-ink">
              {title}
            </Text>
            {message ? (
              <Text className="mt-2 text-center text-sm leading-5 text-muted">
                {message}
              </Text>
            ) : null}

            <View className="mt-6 flex-row gap-3">
              <Pressable
                onPress={onCancel}
                disabled={working}
                className={`min-h-[48px] flex-1 items-center justify-center rounded-2xl border border-border px-2 py-3 active:opacity-70 ${
                  working ? 'opacity-50' : ''
                }`}
              >
                <Text className="text-center text-[15px] font-bold text-ink">
                  {cancelLabel}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleConfirm}
                disabled={working}
                className={`min-h-[48px] flex-1 items-center justify-center rounded-2xl px-2 py-3 active:opacity-80 ${
                  destructive ? 'bg-red-600' : 'bg-primary'
                }`}
              >
                {working ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-center text-[15px] font-bold text-white">
                    {confirmLabel}
                  </Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
