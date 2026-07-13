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

type Props = {
  visible: boolean;
  title: string;
  message: string;
  /** Recibe el código digitado; si devuelve promesa, muestra spinner. */
  onConfirm: (code: string) => void | Promise<void>;
  onCancel: () => void;
};

/**
 * Diálogo del código de verificación físico del pedido: el negocio digita el
 * código de recogida que le dicta el repartidor (al despachar) y el
 * repartidor el código de entrega que le dicta el cliente (al entregar).
 */
export function VerificationCodeDialog({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
}: Props) {
  const [code, setCode] = useState('');
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (visible) setCode('');
  }, [visible]);

  const ready = code.length === 4;

  async function confirm() {
    if (!ready || working) return;
    try {
      setWorking(true);
      await onConfirm(code);
    } catch {
      // El interceptor HTTP ya mostró el error (código incorrecto, etc.).
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
        <Pressable className="w-full rounded-3xl bg-white p-6" onPress={() => {}}>
          <View className="mb-4 h-14 w-14 items-center justify-center self-center rounded-full bg-primary-tint">
            <Ionicons name="keypad-outline" size={26} color="#FF5A3C" />
          </View>

          <Text className="text-center text-lg font-extrabold text-dark">
            {title}
          </Text>
          <Text className="mt-2 text-center text-sm leading-5 text-muted">
            {message}
          </Text>

          <TextInput
            value={code}
            onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 4))}
            keyboardType="number-pad"
            maxLength={4}
            autoFocus
            placeholder="••••"
            placeholderTextColor="#9CA3AF"
            className="mt-4 self-center rounded-2xl border border-gray-200 bg-surface px-6 py-3 text-center text-2xl font-extrabold tracking-[12px] text-dark"
          />

          <View className="mt-5 flex-row gap-3">
            <Pressable
              onPress={onCancel}
              disabled={working}
              className="h-12 flex-1 items-center justify-center rounded-2xl border border-gray-200 active:opacity-70"
            >
              <Text className="text-[15px] font-bold text-dark">Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={confirm}
              disabled={working || !ready}
              className={`h-12 flex-1 items-center justify-center rounded-2xl active:opacity-80 ${
                ready ? 'bg-primary' : 'bg-gray-200'
              }`}
            >
              {working ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text
                  className={`text-[15px] font-bold ${
                    ready ? 'text-white' : 'text-muted'
                  }`}
                >
                  Confirmar
                </Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
