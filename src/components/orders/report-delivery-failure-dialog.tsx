import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { DocumentPhotoField } from '@/components/ui/document-photo-field';
import { Select, SelectOption } from '@/components/ui/select';
import { getAppColors } from '@/lib/app-colors';

type Props = {
  visible: boolean;
  /** Recibe el motivo (select + observaciones combinados) y la foto del sitio/paquete. */
  onConfirm: (reason: string, photoUri: string) => void | Promise<void>;
  onCancel: () => void;
};

const REASON_OPTIONS: SelectOption<string>[] = [
  { label: 'No salió / no respondió', value: 'No salió / no respondió' },
  { label: 'No estaba en la dirección', value: 'No estaba en la dirección' },
  { label: 'Rechazó el pedido', value: 'Rechazó el pedido' },
  { label: 'Dirección incorrecta o no se encontró', value: 'Dirección incorrecta o no se encontró' },
  { label: 'Otro motivo', value: 'Otro motivo' },
];

/**
 * Diálogo del repartidor para reportar que no pudo entregar un pedido EN
 * RUTA (Art. 31-32 TYC): select con el motivo + observaciones libres
 * (reunión con el cliente 2026-08-04) — el backend recibe los dos
 * combinados en un solo texto. Mismo patrón que `CancelOrderDialog`, con su
 * propio texto porque acá NO se cancela el pedido, queda esperando la
 * decisión del cliente (reintentar o cancelar).
 */
export function ReportDeliveryFailureDialog({
  visible,
  onConfirm,
  onCancel,
}: Props) {
  const [reason, setReason] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState('');
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (visible) {
      setReason(undefined);
      setNotes('');
      setPhotoUri(null);
      setPhotoError('');
    }
  }, [visible]);

  async function confirm() {
    if (!reason || working) return;
    if (!photoUri) {
      setPhotoError('Toma una foto del sitio o del paquete.');
      return;
    }
    const combined = notes.trim()
      ? `${reason} — Observaciones: ${notes.trim()}`
      : reason;
    try {
      setWorking(true);
      await onConfirm(combined, photoUri);
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
          <Pressable
            className="w-full rounded-3xl border border-border bg-card p-6"
            style={{ maxHeight: '88%' }}
            onPress={() => {}}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="mb-4 h-14 w-14 self-center items-center justify-center rounded-full bg-amber-50">
                <Ionicons name="alert-circle-outline" size={26} color="#B45309" />
              </View>

              <Text className="text-center text-lg font-extrabold text-ink">
                No se pudo entregar
              </Text>
              <Text className="mt-2 text-center text-sm leading-5 text-muted">
                Cuéntanos qué pasó. Le avisaremos al cliente para que decida si
                reintentar o cancelar el pedido.
              </Text>

              <View className="mt-4">
                <Select
                  label="Motivo"
                  options={REASON_OPTIONS}
                  value={reason}
                  onSelect={setReason}
                  icon="help-circle-outline"
                  placeholder="Elige un motivo"
                />
              </View>

              <View className="mt-3 rounded-xl border border-border px-3.5 py-2.5">
                <TextInput
                  className="min-h-[44px] text-[15px] text-ink"
                  placeholder="Observaciones (opcional)"
                  placeholderTextColor={getAppColors().mutedColor}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  maxLength={400}
                />
              </View>

              <View className="mt-3">
                <DocumentPhotoField
                  label="Foto del sitio o del paquete (obligatoria)"
                  uri={photoUri}
                  onChange={(uri) => {
                    setPhotoUri(uri);
                    setPhotoError('');
                  }}
                  error={photoError}
                  placeholderIcon="camera-outline"
                />
              </View>

              <View className="mt-3 flex-row gap-3">
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
                  disabled={working || !reason || !photoUri}
                  className={`h-[48px] flex-1 items-center justify-center rounded-2xl bg-amber-600 active:opacity-80 ${
                    !reason || !photoUri ? 'opacity-50' : ''
                  }`}
                >
                  {working ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text className="text-[15px] font-bold text-white">
                      Reportar
                    </Text>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
