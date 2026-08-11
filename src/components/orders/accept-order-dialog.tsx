import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { getAppColors } from '@/lib/app-colors';

type Props = {
  visible: boolean;
  /** Recibe los minutos elegidos; si devuelve promesa, muestra spinner. */
  onConfirm: (minutes: number) => void | Promise<void>;
  onCancel: () => void;
};

/** Opciones de compromiso del negocio al aceptar (minutos de preparación). */
const MINUTE_CHOICES = [10, 15, 20, 30, 45, 60];

/**
 * Diálogo para ACEPTAR un pedido: el negocio elige en cuántos minutos lo
 * tendrá listo (el backend lo exige y el cliente lo ve como hora estimada).
 */
export function AcceptOrderDialog({ visible, onConfirm, onCancel }: Props) {
  const [minutes, setMinutes] = useState<number | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (visible) setMinutes(null);
  }, [visible]);

  async function confirm() {
    if (!minutes || working) return;
    try {
      setWorking(true);
      await onConfirm(minutes);
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
      <Pressable
        className="flex-1 items-center justify-center bg-black/50 px-8"
        onPress={working ? undefined : onCancel}
      >
        <Pressable className="w-full rounded-3xl border border-border bg-card p-6" onPress={() => {}}>
          <View className="mb-4 h-14 w-14 self-center items-center justify-center">
            <Ionicons name="time-outline" size={30} color={getAppColors().primaryColor} />
          </View>

          <Text className="text-center text-lg font-extrabold text-ink">
            ¿En cuánto tiempo estará listo?
          </Text>
          <Text className="mt-2 text-center text-sm leading-5 text-muted">
            El cliente verá la hora estimada. Elige un tiempo que puedas
            cumplir.
          </Text>

          <View className="mt-4 flex-row flex-wrap justify-center gap-2">
            {MINUTE_CHOICES.map((choice) => {
              const active = minutes === choice;
              return (
                <Pressable
                  key={choice}
                  onPress={() => setMinutes(choice)}
                  className={`rounded-full border px-4 py-2.5 active:opacity-70 ${
                    active ? 'border-primary bg-primary' : 'border-border bg-card'
                  }`}
                >
                  <Text
                    className={`text-[14px] font-bold ${
                      active ? 'text-white' : 'text-ink'
                    }`}
                  >
                    {choice} min
                  </Text>
                </Pressable>
              );
            })}
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
              disabled={working || !minutes}
              className={`h-[48px] flex-1 items-center justify-center rounded-2xl bg-emerald-600 active:opacity-80 ${
                !minutes ? 'opacity-50' : ''
              }`}
            >
              {working ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-[15px] font-bold text-white">
                  Aceptar pedido
                </Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
