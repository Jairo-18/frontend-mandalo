import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { AuthHeader } from '@/components/auth/auth-header';
import { DeliveryVerification } from '@/components/auth/delivery-verification';
import { TermsCheckbox } from '@/components/auth/terms-checkbox';
import { Button } from '@/components/ui/button';
import { DeveloperCredit } from '@/components/ui/developer-credit';
import { FormSection } from '@/components/ui/form-section';
import { KeyboardAwareScroll } from '@/components/ui/keyboard-aware-scroll';
import { Select } from '@/components/ui/select';
import { TextField } from '@/components/ui/text-field';
import { useAppData } from '@/context/app-data';
import { useFormErrors } from '@/hooks/use-form-errors';
import { useMunicipalities } from '@/hooks/use-municipalities';
import { useSession } from '@/hooks/use-session';
import {
  DeviceCoords,
  getDeviceLocation,
  samePlaceName,
} from '@/lib/location';
import { getSession, homePathFor, setSession } from '@/lib/session';
import { signOutEverywhere } from '@/lib/sign-out';
import { normalizePhone, PHONE_PREFIX } from '@/lib/text-format';
import { DocumentValue } from '@/lib/upload';
import { authService } from '@/services/auth';
import { profileService } from '@/services/profile';
import { userAddressesService } from '@/services/user-addresses';

type Role = 'client' | 'delivery';

/**
 * Onboarding post-Google: la cuenta ya existe (la creó `/auth/google`) pero
 * faltan el rol y los datos que el registro normal sí pide. Se llega acá
 * cuando el sign-in devuelve `isNewUser` (o al reabrir la app con
 * `needsOnboarding` en la sesión). Cliente: celular + ubicación + dirección
 * → home. Repartidor: además identificación + fotos → cuenta en revisión.
 */
export default function CompleteRegistrationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: Role }>();
  const session = useSession();

  const { departments, identificationTypes } = useAppData();
  const muni = useMunicipalities();
  const { errors, clearError, bind, validate } = useFormErrors();

  // Rol: viene fijo desde la pantalla de registro; desde el login se elige acá.
  const [role, setRole] = useState<Role | null>(params.role ?? null);

  const [phone, setPhone] = useState(PHONE_PREFIX);
  const [address, setAddress] = useState('');
  const [details, setDetails] = useState('');
  const [coords, setCoords] = useState<DeviceCoords>();
  const [locating, setLocating] = useState(false);

  // Solo repartidor: identificación + fotos de verificación.
  const [identificationNumber, setIdentificationNumber] = useState('');
  const [identificationTypeId, setIdentificationTypeId] = useState<number>();
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [idFrontUri, setIdFrontUri] = useState<string | null>(null);
  const [idBackUri, setIdBackUri] = useState<string | null>(null);
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [licenseFrontUri, setLicenseFrontUri] = useState<string | null>(null);
  const [licenseBackUri, setLicenseBackUri] = useState<string | null>(null);
  const [soat, setSoat] = useState<DocumentValue | null>(null);
  const [technicalInspection, setTechnicalInspection] =
    useState<DocumentValue | null>(null);

  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [saving, setSaving] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const isDelivery = role === 'delivery';

  const departmentOptions = useMemo(
    () => departments.map((d) => ({ label: d.name, value: d.id })),
    [departments],
  );
  const municipalityOptions = useMemo(
    () => muni.municipalities.map((m) => ({ label: m.name, value: m.id })),
    [muni.municipalities],
  );
  const identificationTypeOptions = useMemo(
    () => identificationTypes.map((t) => ({ label: t.name, value: t.id })),
    [identificationTypes],
  );

  async function handleUseLocation() {
    setLocating(true);
    try {
      const result = await getDeviceLocation();
      if (result) {
        setCoords(result.coords);
        clearError('location');
        setAddress(
          result.address ??
            `Ubicación GPS (${result.coords.latitude.toFixed(5)}, ${result.coords.longitude.toFixed(5)})`,
        );
        clearError('address');
        if (result.region) {
          const dept = departments.find((d) =>
            samePlaceName(d.name, result.region),
          );
          if (dept && result.city) {
            const muns = await muni.preload(dept.id);
            const mun = muns.find((m) => samePlaceName(m.name, result.city));
            if (mun) muni.setMunicipalityId(mun.id);
            clearError('departmentId');
            clearError('municipalityId');
          }
        }
      }
    } finally {
      setLocating(false);
    }
  }

  function validateForm() {
    return validate({
      phone:
        normalizePhone(phone).replace('+', '').length >= 10
          ? undefined
          : 'Ingresa un número de celular válido.',
      location: coords
        ? undefined
        : 'Marca tu ubicación con "Usar mi ubicación actual".',
      departmentId: muni.departmentId ? undefined : 'Selecciona un departamento.',
      municipalityId: muni.municipalityId ? undefined : 'Selecciona un municipio.',
      acceptedTerms: acceptedTerms
        ? undefined
        : 'Debes aceptar los Términos y la Política de Tratamiento de Datos.',
      ...(isDelivery
        ? {
            identificationTypeId: identificationTypeId
              ? undefined
              : 'Selecciona el tipo.',
            identificationNumber: identificationNumber.trim()
              ? undefined
              : 'Ingresa tu número de identificación.',
            avatar: avatarUri ? undefined : 'Sube una foto de tu rostro.',
            idFront: idFrontUri
              ? undefined
              : 'Sube la foto del frente de tu documento.',
            idBack: idBackUri
              ? undefined
              : 'Sube la foto del respaldo de tu documento.',
            vehiclePlate: vehiclePlate.trim()
              ? undefined
              : 'Ingresa la placa de tu vehículo.',
            licenseFront: licenseFrontUri
              ? undefined
              : 'Sube la foto del frente de tu licencia.',
            licenseBack: licenseBackUri
              ? undefined
              : 'Sube la foto del respaldo de tu licencia.',
            soat: soat ? undefined : 'Sube el SOAT (foto o PDF).',
            technicalInspection: technicalInspection
              ? undefined
              : 'Sube la tecnomecánica (foto o PDF).',
          }
        : {
            details: details.trim()
              ? undefined
              : 'Ingresa la dirección específica (barrio, casa, referencias).',
          }),
    });
  }

  async function handleSave() {
    if (!validateForm()) return;

    try {
      setSaving(true);

      // Datos comunes del perfil (el backend ya tiene nombre/correo de Google).
      await profileService.updateMe({
        phone: normalizePhone(phone),
        address: address.trim(),
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        departmentId: muni.departmentId,
        municipalityId: muni.municipalityId,
        acceptedTerms,
      });

      if (isDelivery) {
        await profileService.becomeDelivery(
          {
            identificationNumber: identificationNumber.trim(),
            identificationTypeId: identificationTypeId!,
            vehiclePlate: vehiclePlate.trim().toUpperCase(),
            acceptedTerms,
          },
          {
            avatar: avatarUri!,
            idFront: idFrontUri!,
            idBack: idBackUri!,
            licenseFront: licenseFrontUri!,
            licenseBack: licenseBackUri!,
            soat: soat!,
            technicalInspection: technicalInspection!,
          },
        );
        // La sesión debe reflejar el rol/estado nuevos (DELI inactivo) para
        // que homePathFor lleve a la pantalla "cuenta en proceso".
        const current = getSession()!;
        const res = await authService.refreshToken(current.refreshToken);
        await setSession({
          ...res.data.tokens,
          user: res.data.user,
          accessSessionId: current.accessSessionId,
        });
        router.replace(homePathFor(res.data.user));
        return;
      }

      // Cliente: su primera dirección de entrega nace como principal (espejo
      // del registro normal, que la crea en el backend).
      await userAddressesService.create({
        label: 'Casa',
        address: address.trim(),
        details: details.trim(),
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      });
      const current = getSession()!;
      await setSession({ ...current, needsOnboarding: undefined });
      router.replace(homePathFor(current.user));
    } catch {
      // El interceptor HTTP ya mostró el mensaje del backend.
    } finally {
      setSaving(false);
    }
  }

  async function handleExit() {
    setLeaving(true);
    // Navega al login por dentro, con el overlay "Cerrando sesión…".
    await signOutEverywhere();
    setLeaving(false);
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      <KeyboardAwareScroll>
        <AuthHeader
          compact
          subtitle="Completa tu registro"
          onBack={handleExit}
        />

        <View className="-mt-7 flex-1 rounded-t-[28px] bg-white px-6 pb-10 pt-7">
          <Text className="text-[26px] font-extrabold text-dark">
            ¡Hola
            {session?.user.fullName
              ? `, ${session.user.fullName.split(' ')[0]}`
              : ''}
            !
          </Text>
          <Text className="mb-6 mt-1 text-sm leading-5 text-muted">
            Tu cuenta de Google quedó lista. Completa estos datos para empezar
            a usar Mándalo.
          </Text>

          {/* Paso 1: elegir rol (solo si no vino fijo desde el registro). */}
          {!params.role && (
            <View className="mb-6 flex-row gap-3">
              <RoleCard
                icon="bag-handle-outline"
                label="Quiero pedir"
                caption="Usuario"
                active={role === 'client'}
                onPress={() => setRole('client')}
              />
              <RoleCard
                icon="bicycle-outline"
                label="Quiero repartir"
                caption="Domiciliario"
                active={role === 'delivery'}
                onPress={() => setRole('delivery')}
              />
            </View>
          )}

          {role && (
            <>
              <FormSection label="Tus datos" />
              <TextField
                label="Celular"
                icon="call-outline"
                format="phone"
                value={phone}
                onChangeText={bind('phone', setPhone)}
                error={errors.phone}
                placeholder="+57 - 310 210 366 0"
              />

              <FormSection label="Tu ubicación" />
              <Select
                label="Departamento"
                icon="map-outline"
                placeholder="Selecciona tu departamento"
                options={departmentOptions}
                value={muni.departmentId}
                onSelect={(id) => {
                  clearError('departmentId');
                  muni.onSelectDepartment(id);
                }}
                error={errors.departmentId}
              />
              <Select
                label="Municipio"
                icon="location-outline"
                placeholder={
                  muni.departmentId
                    ? 'Selecciona tu municipio'
                    : 'Elige un departamento primero'
                }
                options={municipalityOptions}
                value={muni.municipalityId}
                onSelect={(id) => {
                  muni.setMunicipalityId(id);
                  clearError('municipalityId');
                }}
                disabled={!muni.departmentId || muni.loadingMuns}
                loading={muni.loadingMuns}
                error={errors.municipalityId}
              />

              {/* Solo lectura: la llena "Usar mi ubicación actual". */}
              <TextField
                label="Dirección (se llena con tu ubicación)"
                icon="home-outline"
                format="text"
                value={address}
                error={errors.address}
                placeholder="Toca «Usar mi ubicación actual»"
                editable={false}
              />
              <Pressable
                onPress={handleUseLocation}
                disabled={locating}
                className="-mt-2 mb-4 flex-row items-center gap-1.5 self-start"
              >
                {locating ? (
                  <ActivityIndicator size="small" color="#FF5A3C" />
                ) : (
                  <Ionicons
                    name={coords ? 'checkmark-circle' : 'locate-outline'}
                    size={16}
                    color="#FF5A3C"
                  />
                )}
                <Text className="text-[13px] font-bold text-primary">
                  {locating
                    ? 'Obteniendo ubicación…'
                    : coords
                      ? 'Ubicación marcada — toca para actualizar'
                      : 'Usar mi ubicación actual (obligatorio)'}
                </Text>
              </Pressable>
              {!!errors.location && (
                <Text className="-mt-2 mb-3 text-xs text-red-600">
                  {errors.location}
                </Text>
              )}

              {!isDelivery && (
                <TextField
                  label="Dirección específica"
                  icon="information-circle-outline"
                  format="text"
                  value={details}
                  onChangeText={bind('details', setDetails)}
                  error={errors.details}
                  placeholder="Barrio Centro, casa esquinera, portón café"
                />
              )}

              {isDelivery && (
                <>
                  <FormSection label="Identidad del domiciliario" />
                  <Select
                    label="Tipo de identificación"
                    icon="card-outline"
                    placeholder="Selecciona el tipo"
                    options={identificationTypeOptions}
                    value={identificationTypeId}
                    onSelect={(id) => {
                      setIdentificationTypeId(id);
                      clearError('identificationTypeId');
                    }}
                    error={errors.identificationTypeId}
                  />
                  <TextField
                    label="Número de identificación"
                    icon="finger-print-outline"
                    format="identification"
                    value={identificationNumber}
                    onChangeText={bind(
                      'identificationNumber',
                      setIdentificationNumber,
                    )}
                    error={errors.identificationNumber}
                    placeholder="1090123456"
                  />
                  <DeliveryVerification
                    avatarUri={avatarUri}
                    idFrontUri={idFrontUri}
                    idBackUri={idBackUri}
                    onAvatar={(uri) => {
                      setAvatarUri(uri);
                      clearError('avatar');
                    }}
                    onIdFront={(uri) => {
                      setIdFrontUri(uri);
                      clearError('idFront');
                    }}
                    onIdBack={(uri) => {
                      setIdBackUri(uri);
                      clearError('idBack');
                    }}
                    vehiclePlate={vehiclePlate}
                    onVehiclePlate={bind('vehiclePlate', setVehiclePlate)}
                    licenseFrontUri={licenseFrontUri}
                    licenseBackUri={licenseBackUri}
                    onLicenseFront={(uri) => {
                      setLicenseFrontUri(uri);
                      clearError('licenseFront');
                    }}
                    onLicenseBack={(uri) => {
                      setLicenseBackUri(uri);
                      clearError('licenseBack');
                    }}
                    soat={soat}
                    onSoat={(value) => {
                      setSoat(value);
                      clearError('soat');
                    }}
                    technicalInspection={technicalInspection}
                    onTechnicalInspection={(value) => {
                      setTechnicalInspection(value);
                      clearError('technicalInspection');
                    }}
                    errors={errors}
                  />
                </>
              )}

              <View className="mt-2">
                <TermsCheckbox
                  checked={acceptedTerms}
                  onChange={(value) => {
                    setAcceptedTerms(value);
                    clearError('acceptedTerms');
                  }}
                  error={errors.acceptedTerms}
                />
                <Button
                  label={isDelivery ? 'Enviar para revisión' : 'Empezar a pedir'}
                  onPress={handleSave}
                  loading={saving}
                />
              </View>
            </>
          )}

          <Pressable
            onPress={handleExit}
            disabled={leaving}
            className="mt-6 flex-row items-center justify-center gap-1.5"
          >
            {leaving ? (
              <ActivityIndicator size="small" color="#7A7A8A" />
            ) : (
              <Ionicons name="log-out-outline" size={16} color="#7A7A8A" />
            )}
            <Text className="text-[13px] font-semibold text-muted">
              Salir y continuar después
            </Text>
          </Pressable>

          <View className="mt-4">
            <DeveloperCredit />
          </View>
        </View>
      </KeyboardAwareScroll>
    </View>
  );
}

function RoleCard({
  icon,
  label,
  caption,
  active,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  caption: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 items-center rounded-2xl border-2 px-3 py-5 active:opacity-80 ${
        active ? 'border-primary bg-primary-tint' : 'border-gray-200 bg-white'
      }`}
    >
      <Ionicons name={icon} size={28} color={active ? '#FF5A3C' : '#7A7A8A'} />
      <Text
        className={`mt-2 text-[15px] font-extrabold ${
          active ? 'text-primary' : 'text-dark'
        }`}
      >
        {label}
      </Text>
      <Text className="text-xs text-muted">{caption}</Text>
    </Pressable>
  );
}
