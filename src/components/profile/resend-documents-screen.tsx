import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { DocumentPhotoField } from '@/components/ui/document-photo-field';
import { FormSection } from '@/components/ui/form-section';
import { KeyboardAwareScroll } from '@/components/ui/keyboard-aware-scroll';
import { PhotoField } from '@/components/ui/photo-field';
import { TextField } from '@/components/ui/text-field';
import { VehicleDocumentField } from '@/components/ui/vehicle-document-field';
import { DocumentValue } from '@/lib/upload';
import { profileService } from '@/services/profile';

/** Una URL guardada (http…) no es un archivo nuevo por subir; una uri local sí. */
function isLocal(uri: string | null): uri is string {
  return !!uri && !/^https?:\/\//.test(uri);
}

function docValueFromUrl(url: string | null): DocumentValue | null {
  if (!url) return null;
  return { uri: url, kind: url.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image' };
}

/**
 * Reenvío de documentos del repartidor: corrige un documento que el admin
 * rechazó (nota en "Cuenta en proceso de habilitación") o renueva uno vencido
 * (SOAT, tecnomecánica, licencia). A diferencia del registro, TODO es
 * opcional acá — cada campo arranca prellenado con lo que ya tiene guardado
 * y solo se reenvía lo que el usuario vuelva a tocar.
 */
export function ResendDocumentsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Cuenta ya verificada (activa): los documentos quedan congelados.
  const [locked, setLocked] = useState(false);

  const [initialPlate, setInitialPlate] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [idFrontUri, setIdFrontUri] = useState<string | null>(null);
  const [idBackUri, setIdBackUri] = useState<string | null>(null);
  const [licenseFrontUri, setLicenseFrontUri] = useState<string | null>(null);
  const [licenseBackUri, setLicenseBackUri] = useState<string | null>(null);
  const [soat, setSoat] = useState<DocumentValue | null>(null);
  const [technicalInspection, setTechnicalInspection] =
    useState<DocumentValue | null>(null);

  useEffect(() => {
    profileService
      .getMe()
      .then((res) => {
        const p = res.data;
        setLocked(p.isActive);
        setInitialPlate(p.vehiclePlate ?? '');
        setVehiclePlate(p.vehiclePlate ?? '');
        setAvatarUri(p.avatarUrl ?? null);
        setIdFrontUri(p.identificationFrontUrl ?? null);
        setIdBackUri(p.identificationBackUrl ?? null);
        setLicenseFrontUri(p.licenseFrontUrl ?? null);
        setLicenseBackUri(p.licenseBackUrl ?? null);
        setSoat(docValueFromUrl(p.soatUrl ?? null));
        setTechnicalInspection(docValueFromUrl(p.technicalInspectionUrl ?? null));
      })
      .catch(() => {
        // El interceptor HTTP ya mostró el toast.
      })
      .finally(() => setLoading(false));
  }, []);

  const plateChanged = vehiclePlate.trim().toUpperCase() !== initialPlate;
  const dirty =
    plateChanged ||
    isLocal(avatarUri) ||
    isLocal(idFrontUri) ||
    isLocal(idBackUri) ||
    isLocal(licenseFrontUri) ||
    isLocal(licenseBackUri) ||
    (!!soat && isLocal(soat.uri)) ||
    (!!technicalInspection && isLocal(technicalInspection.uri));

  async function handleSave() {
    if (!dirty) return;
    try {
      setSaving(true);
      await profileService.resendDocuments(
        { vehiclePlate: plateChanged ? vehiclePlate.trim().toUpperCase() : undefined },
        {
          avatar: isLocal(avatarUri) ? avatarUri : undefined,
          idFront: isLocal(idFrontUri) ? idFrontUri : undefined,
          idBack: isLocal(idBackUri) ? idBackUri : undefined,
          licenseFront: isLocal(licenseFrontUri) ? licenseFrontUri : undefined,
          licenseBack: isLocal(licenseBackUri) ? licenseBackUri : undefined,
          soat: soat && isLocal(soat.uri) ? soat : undefined,
          technicalInspection:
            technicalInspection && isLocal(technicalInspection.uri)
              ? technicalInspection
              : undefined,
        },
      );
      router.back();
    } catch {
      // El interceptor HTTP ya mostró el toast.
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      <View className="flex-row items-center gap-3 bg-white px-5 pb-2 pt-2">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full bg-surface active:opacity-70"
        >
          <Ionicons name="arrow-back" size={20} color="#1E1E2D" />
        </Pressable>
        <Text className="text-lg font-extrabold text-dark">
          Reenviar documentos
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#FF5A3C" style={{ marginTop: 48 }} />
      ) : locked ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="shield-checkmark-outline" size={52} color="#22C55E" />
          <Text className="mt-4 text-center text-lg font-extrabold text-dark">
            Documentos verificados
          </Text>
          <Text className="mt-2 text-center text-[14px] leading-5 text-muted">
            Tu cuenta ya está verificada, así que tus documentos quedaron
            congelados. Si necesitas actualizar alguno, contacta al
            administrador.
          </Text>
          <Pressable onPress={() => router.back()} className="mt-6">
            <Text className="text-[15px] font-bold text-primary">Volver</Text>
          </Pressable>
        </View>
      ) : (
        <KeyboardAwareScroll>
          <View className="px-5 pb-10">
            <Text className="mb-1 mt-2 text-sm leading-5 text-muted">
              Toca solo el documento que quieras cambiar — lo demás queda como
              lo tenías. Un administrador revisará de nuevo tu cuenta.
            </Text>

            <PhotoField
              label="Foto de tu rostro"
              imageUrl={isLocal(avatarUri) ? undefined : avatarUri}
              pendingUri={isLocal(avatarUri) ? avatarUri : null}
              onChange={setAvatarUri}
              shape="circle"
              placeholderIcon="person-outline"
            />
            <DocumentPhotoField
              label="Documento — por delante"
              uri={idFrontUri}
              onChange={setIdFrontUri}
            />
            <DocumentPhotoField
              label="Documento — por detrás"
              uri={idBackUri}
              onChange={setIdBackUri}
            />

            <FormSection label="Vehículo y documentos" />
            <TextField
              label="Placa del vehículo"
              icon="bicycle-outline"
              format="identification"
              value={vehiclePlate}
              onChangeText={setVehiclePlate}
              placeholder="ABC12D"
            />
            <DocumentPhotoField
              label="Licencia de conducción — por delante"
              uri={licenseFrontUri}
              onChange={setLicenseFrontUri}
              placeholderIcon="car-outline"
            />
            <DocumentPhotoField
              label="Licencia de conducción — por detrás"
              uri={licenseBackUri}
              onChange={setLicenseBackUri}
              placeholderIcon="car-outline"
            />
            <VehicleDocumentField label="SOAT" value={soat} onChange={setSoat} />
            <VehicleDocumentField
              label="Tecnomecánica"
              value={technicalInspection}
              onChange={setTechnicalInspection}
            />

            <View className="mt-2">
              <Button
                label="Enviar para revisión"
                onPress={handleSave}
                loading={saving}
                disabled={!dirty}
              />
            </View>
          </View>
        </KeyboardAwareScroll>
      )}
    </SafeAreaView>
  );
}
