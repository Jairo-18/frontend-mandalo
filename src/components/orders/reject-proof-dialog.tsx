import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { getAppColors } from '@/lib/app-colors';

type Props = {
  visible: boolean;
  /** Recibe el motivo del rechazo; si devuelve promesa, muestra spinner. */
  onConfirm: (reason: string) => void | Promise<void>;
  onCancel: () => void;
};

/**
 * Diálogo del NEGOCIO para RECHAZAR el comprobante de pago del cliente pidiendo
 * el motivo (p. ej. "la foto no corresponde al comprobante"). El cliente lo ve
 * y vuelve a subir. No cancela el pedido, solo invalida el soporte.
 */
export function RejectProofDialog({ visible, onConfirm, onCancel }: Props) {
  const [reason, setReason] = useState('');
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (visible) setReason('');
  }, [visible]);

  async function confirm() {
    if (!reason.trim() || working) return;
    try {
      setWorking(true);
      await onConfirm(reason.trim());
    } catch {
      // El interceptor HTTP ya mostró el error.
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
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <Pressable
          className="flex-1 items-center justify-center bg-black/50 px-8"
          onPress={working ? undefined : onCancel}
        >
          <Pressable className="w-full rounded-3xl bg-card p-6" onPress={() => {}}>
            <View className="mb-4 h-14 w-14 self-center items-center justify-center rounded-full bg-red-50">
              <Ionicons name="receipt-outline" size={26} color="#DC2626" />
            </View>

            <Text className="text-center text-lg font-extrabold text-ink">
              Rechazar comprobante
            </Text>
            <Text className="mt-2 text-center text-sm leading-5 text-muted">
              Dile al cliente qué pasa para que suba el correcto. El pedido no se
              cancela.
            </Text>

            <View className="mt-4 rounded-xl border border-border px-3.5 py-2.5">
              <TextInput
                className="min-h-[44px] text-[15px] text-ink"
                placeholder="Ej: esa foto no corresponde al comprobante del pago."
                placeholderTextColor={getAppColors().mutedColor}
                value={reason}
                onChangeText={setReason}
                multiline
                maxLength={255}
                autoFocus
              />
            </View>

            <View className="mt-6 flex-row gap-3">
              <Pressable
                onPress={onCancel}
                disabled={working}
                className={`h-[48px] flex-1 items-center justify-center rounded-2xl border border-border active:opacity-70 ${
                  working ? 'opacity-50' : ''
                }`}
              >
                <Text className="text-[15px] font-bold text-ink">Volver</Text>
              </Pressable>
              <Pressable
                onPress={confirm}
                disabled={working || !reason.trim()}
                className={`h-[48px] flex-1 items-center justify-center rounded-2xl bg-red-600 active:opacity-80 ${
                  !reason.trim() ? 'opacity-50' : ''
                }`}
              >
                {working ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-[15px] font-bold text-white">
                    Rechazar
                  </Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
