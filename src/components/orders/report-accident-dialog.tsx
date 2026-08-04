import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { Select, SelectOption } from '@/components/ui/select';
import { toast } from '@/lib/toast';
import { getAppColors } from '@/lib/app-colors';
import {
  ArlInfo,
  deliveryAccidentService,
  REASON_OPTIONS,
} from '@/services/delivery-accident';

const MAX_PHOTOS = 5;
const TILE = 76;

const REASON_SELECT_OPTIONS: SelectOption<string>[] = REASON_OPTIONS.map((r) => ({
  label: r,
  value: r,
}));

type Props = {
  visible: boolean;
  invoiceId: number | null;
  onClose: () => void;
};

/**
 * Botón/flujo "¿Tuviste un accidente?" (reunión con el cliente 2026-08-04):
 * paso 1 confirma (protege contra un toque sin querer), paso 2 el reporte
 * completo (fotos obligatorias hasta 5, motivo, observaciones), paso 3
 * confirmación con el código de ARL para que se atienda. Es un reporte de
 * SEGURIDAD independiente — no toca el pedido.
 */
export function ReportAccidentDialog({ visible, invoiceId, onClose }: Props) {
  const [step, setStep] = useState<'confirm' | 'form' | 'done'>('confirm');
  const [reasonCode, setReasonCode] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoError, setPhotoError] = useState('');
  const [saving, setSaving] = useState(false);
  const [arl, setArl] = useState<ArlInfo | null>(null);

  useEffect(() => {
    if (visible) {
      setStep('confirm');
      setReasonCode(undefined);
      setNotes('');
      setPhotos([]);
      setPhotoError('');
      setArl(null);
    }
  }, [visible]);

  async function addPhoto() {
    if (photos.length >= MAX_PHOTOS) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.[0]) return;
      setPhotos((p) => [...p, result.assets[0].uri]);
      setPhotoError('');
    } catch {
      toast.error('No se pudo abrir la galería');
    }
  }

  async function takePhoto() {
    if (photos.length >= MAX_PHOTOS) return;
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        toast.error('Permite el acceso a la cámara para tomar la foto');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.[0]) return;
      setPhotos((p) => [...p, result.assets[0].uri]);
      setPhotoError('');
    } catch {
      toast.error('No se pudo abrir la cámara');
    }
  }

  function removePhoto(uri: string) {
    setPhotos((p) => p.filter((u) => u !== uri));
  }

  async function submit() {
    if (!invoiceId || !reasonCode || saving) return;
    if (!photos.length) {
      setPhotoError('Toma al menos una foto del accidente/sitio.');
      return;
    }
    try {
      setSaving(true);
      const res = await deliveryAccidentService.report({
        invoiceId,
        reasonCode,
        notes: notes.trim() || undefined,
        photoUris: photos,
      });
      setArl(res.data);
      setStep('done');
    } catch {
      // El interceptor HTTP ya mostró el error.
    } finally {
      setSaving(false);
    }
  }

  if (step === 'confirm') {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <Pressable className="flex-1 items-center justify-center bg-black/50 px-8" onPress={onClose}>
          <Pressable className="w-full rounded-3xl border border-border bg-card p-6" onPress={() => {}}>
            <View className="mb-4 h-14 w-14 self-center items-center justify-center rounded-full bg-red-50">
              <Ionicons name="warning-outline" size={26} color="#DC2626" />
            </View>
            <Text className="text-center text-lg font-extrabold text-ink">
              ¿Tuviste un accidente?
            </Text>
            <Text className="mt-2 text-center text-sm leading-5 text-muted">
              Si fue sin querer, toca "Cancelar". Si de verdad tuviste un
              accidente, repórtalo para que Mandalo te ayude.
            </Text>
            <View className="mt-6 flex-row gap-3">
              <Pressable
                onPress={onClose}
                className="h-[48px] flex-1 items-center justify-center rounded-2xl border border-border active:opacity-70"
              >
                <Text className="text-[15px] font-bold text-ink">Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={() => setStep('form')}
                className="h-[48px] flex-1 items-center justify-center rounded-2xl bg-red-600 active:opacity-80"
              >
                <Text className="text-[15px] font-bold text-white">Reportar</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    );
  }

  if (step === 'done') {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View className="flex-1 items-center justify-center bg-black/50 px-8">
          <View className="w-full rounded-3xl border border-border bg-card p-6">
            <View className="mb-4 h-14 w-14 self-center items-center justify-center rounded-full bg-emerald-50">
              <Ionicons name="checkmark-circle-outline" size={28} color="#16A34A" />
            </View>
            <Text className="text-center text-lg font-extrabold text-ink">
              Ya avisamos a los administradores
            </Text>
            <Text className="mt-2 text-center text-sm leading-5 text-muted">
              Usa este código de ARL para que te atiendan:
            </Text>
            <View className="mt-3 gap-1 rounded-xl bg-surface p-3.5">
              <Text className="text-[13px] text-ink">
                <Text className="font-bold">Compañía: </Text>
                {arl?.arlCompanyName || 'Sin definir aún — pregúntale al admin'}
              </Text>
              <Text className="text-[13px] text-ink">
                <Text className="font-bold">Póliza: </Text>
                {arl?.arlPolicyNumber || 'Sin definir aún'}
              </Text>
              <Text className="text-[13px] text-ink">
                <Text className="font-bold">Tu número individual: </Text>
                {arl?.arlIndividualNumber || 'Sin definir aún'}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              className="mt-5 h-[48px] items-center justify-center rounded-2xl bg-primary active:opacity-80"
            >
              <Text className="text-[15px] font-bold text-white">Listo</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={saving ? undefined : onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <Pressable className="flex-1 items-center justify-center bg-black/50 px-8" onPress={saving ? undefined : onClose}>
          <Pressable
            className="w-full rounded-3xl border border-border bg-card p-6"
            style={{ maxHeight: '88%' }}
            onPress={() => {}}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="text-lg font-extrabold text-ink">Reportar accidente</Text>
              <Text className="mt-1 text-sm leading-5 text-muted">
                Cuéntanos qué pasó. Es un reporte de seguridad — no cambia tu
                pedido en curso.
              </Text>

              <View className="mt-4">
                <Select
                  label="¿Qué pasó?"
                  options={REASON_SELECT_OPTIONS}
                  value={reasonCode}
                  onSelect={setReasonCode}
                  icon="help-circle-outline"
                  placeholder="Elige una opción"
                />
              </View>

              <View className="mt-3 rounded-xl border border-border px-3.5 py-2.5">
                <TextInput
                  className="min-h-[70px] text-[15px] text-ink"
                  placeholder="Describe qué pasó (opcional)"
                  placeholderTextColor={getAppColors().mutedColor}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  maxLength={1000}
                />
              </View>

              <Text className="mb-2 mt-3 text-sm font-bold text-ink">
                Fotos del accidente/sitio (obligatorio, máx. {MAX_PHOTOS})
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {photos.map((uri) => (
                  <View key={uri}>
                    <Image
                      source={{ uri }}
                      style={{ width: TILE, height: TILE, borderRadius: 14 }}
                      resizeMode="cover"
                    />
                    <Pressable
                      onPress={() => removePhoto(uri)}
                      hitSlop={6}
                      className="absolute -right-1.5 -top-1.5 h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-dark"
                    >
                      <Ionicons name="close" size={13} color="#FFFFFF" />
                    </Pressable>
                  </View>
                ))}
                {photos.length < MAX_PHOTOS && (
                  <>
                    <Pressable
                      onPress={takePhoto}
                      className="items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-surface active:opacity-70"
                      style={{ width: TILE, height: TILE }}
                    >
                      <Ionicons name="camera-outline" size={20} color={getAppColors().mutedColor} />
                      <Text className="mt-0.5 text-[10px] font-medium text-muted">Cámara</Text>
                    </Pressable>
                    <Pressable
                      onPress={addPhoto}
                      className="items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-surface active:opacity-70"
                      style={{ width: TILE, height: TILE }}
                    >
                      <Ionicons name="image-outline" size={20} color={getAppColors().mutedColor} />
                      <Text className="mt-0.5 text-[10px] font-medium text-muted">Galería</Text>
                    </Pressable>
                  </>
                )}
              </View>
              {!!photoError && (
                <Text className="mt-1 text-xs font-medium text-red-500">{photoError}</Text>
              )}

              <View className="mt-6 flex-row gap-3">
                <Pressable
                  onPress={onClose}
                  disabled={saving}
                  className={`h-[48px] flex-1 items-center justify-center rounded-2xl border border-border active:opacity-70 ${saving ? 'opacity-50' : ''}`}
                >
                  <Text className="text-[15px] font-bold text-ink">Cancelar</Text>
                </Pressable>
                <Pressable
                  onPress={submit}
                  disabled={saving || !reasonCode || !photos.length}
                  className={`h-[48px] flex-1 items-center justify-center rounded-2xl bg-red-600 active:opacity-80 ${
                    !reasonCode || !photos.length ? 'opacity-50' : ''
                  }`}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text className="text-[15px] font-bold text-white">Enviar reporte</Text>
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
