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
import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';
import { HttpError } from '@/lib/http';

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
  const colors = useResolvedAppColors();
  const [code, setCode] = useState('');
  const [working, setWorking] = useState(false);
  // El toast global (lib/toast) queda tapado por este Modal nativo, que se
  // pinta en su propia capa por encima del resto del árbol — así que el
  // error de "código incorrecto" necesita mostrarse acá mismo, dentro del
  // diálogo, para que el usuario lo vea.
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setCode('');
      setError(null);
    }
  }, [visible]);

  const ready = code.length === 4;

  async function confirm() {
    if (!ready || working) return;
    try {
      setWorking(true);
      setError(null);
      await onConfirm(code);
    } catch (e) {
      setError(
        e instanceof HttpError ? e.message : 'No se pudo verificar el código',
      );
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
      {/* Sube la tarjeta cuando el teclado numérico la taparía. */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <Pressable
          className="flex-1 items-center justify-center bg-black/50 px-8"
          onPress={working ? undefined : onCancel}
        >
          <Pressable
            className="w-full rounded-3xl border border-border bg-card p-6"
            onPress={() => {}}
          >
            <View className="mb-4 h-14 w-14 items-center justify-center self-center">
              <Ionicons name="keypad-outline" size={30} color={colors.primaryColor} />
            </View>

            <Text className="text-center text-lg font-extrabold text-ink">
              {title}
            </Text>
            <Text className="mt-2 text-center text-sm leading-5 text-muted">
              {message}
            </Text>

            <TextInput
              value={code}
              onChangeText={(v) => {
                setCode(v.replace(/\D/g, '').slice(0, 4));
                setError(null);
              }}
              keyboardType="number-pad"
              maxLength={4}
              autoFocus
              placeholder="••••"
              placeholderTextColor={colors.mutedColor}
              className={`mt-4 self-center rounded-2xl border bg-surface px-6 py-3 text-center text-2xl font-extrabold tracking-[12px] text-ink ${
                error ? 'border-red-500' : 'border-border'
              }`}
            />
            {error ? (
              <Text className="mt-2 text-center text-[13px] font-bold text-red-600">
                {error}
              </Text>
            ) : null}

            <View className="mt-5 flex-row gap-3">
              <Pressable
                onPress={onCancel}
                disabled={working}
                className="h-12 flex-1 items-center justify-center rounded-2xl border border-border active:opacity-70"
              >
                <Text className="text-[15px] font-bold text-ink">
                  Cancelar
                </Text>
              </Pressable>
              <Pressable
                onPress={confirm}
                disabled={working || !ready}
                className={`h-12 flex-1 items-center justify-center rounded-2xl active:opacity-80 ${
                  ready ? 'bg-primary' : 'bg-border'
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
      </KeyboardAvoidingView>
    </Modal>
  );
}
