import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GoogleButton } from '@/components/auth/google-button';
import { Button } from '@/components/ui/button';
import { KeyboardAwareScroll } from '@/components/ui/keyboard-aware-scroll';
import { PanelHeader } from '@/components/ui/panel-header';
import { PhotoField } from '@/components/ui/photo-field';
import { Select } from '@/components/ui/select';
import { TextField } from '@/components/ui/text-field';
import { YesNoDialog } from '@/components/ui/yes-no-dialog';
import { useAppData } from '@/context/app-data';
import { useFormErrors } from '@/hooks/use-form-errors';
import { useMunicipalities } from '@/hooks/use-municipalities';
import { getGoogleIdToken } from '@/lib/google-auth';
import {
  DeviceCoords,
  getDeviceLocation,
  samePlaceName,
} from '@/lib/location';
import { getSession, setSession } from '@/lib/session';
import { formatText, normalizePhone } from '@/lib/text-format';
import { MyProfile, profileService } from '@/services/profile';

/** Campos editables cuyo valor inicial se recuerda para detectar cambios. */
type FormSnapshot = {
  fullName: string;
  phone: string;
  address: string;
  identificationNumber: string;
  identificationTypeId?: number;
  departmentId?: number;
  municipalityId?: number;
};

type Props = {
  /** Botón de la navbar (hamburguesa del drawer del rol correspondiente). */
  menu: ReactNode;
  /** Ruta de la pantalla "Cambiar contraseña" del panel correspondiente. */
  changePasswordHref: '/change-password' | '/delivery/change-password';
};

/**
 * Pantalla "Mi perfil" COMPARTIDA entre los paneles con drawer (cliente y
 * repartidor): editar datos personales (nombre, teléfono, foto), completar
 * la identificación, vincular la cuenta con Google y entrar a cambiar la
 * contraseña. Los datos de la cabecera del drawer (nombre/foto) se refrescan
 * en la sesión al guardar. Cada rol la monta desde su propia ruta.
 */
export function ProfileScreen({ menu, changePasswordHref }: Props) {
  const router = useRouter();
  const { departments, identificationTypes } = useAppData();
  const muni = useMunicipalities();
  const { errors, clearError, bind, validate } = useFormErrors();

  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Datos personales
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [identificationNumber, setIdentificationNumber] = useState('');
  const [identificationTypeId, setIdentificationTypeId] = useState<number>();
  const [pendingAvatar, setPendingAvatar] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Ubicación re-marcada con el GPS en ESTA visita (null = quedó la guardada).
  const [coords, setCoords] = useState<DeviceCoords | null>(null);
  const [locating, setLocating] = useState(false);
  // Valores con los que se prellenó el form: guardar se habilita solo si algo cambió.
  const [initial, setInitial] = useState<FormSnapshot | null>(null);

  // Cuenta: vínculo con Google
  const [linkingGoogle, setLinkingGoogle] = useState(false);
  const [confirmUnlink, setConfirmUnlink] = useState(false);

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

  useEffect(() => {
    profileService
      .getMe()
      .then((res) => {
        const p = res.data;
        setProfile(p);
        setFullName(p.fullName ?? '');
        // El backend guarda "+573102103660"; acá se muestra legible.
        setPhone(formatText('phone', p.phone ?? ''));
        setAddress(p.address ?? '');
        setIdentificationNumber(p.identificationNumber ?? '');
        setIdentificationTypeId(p.identificationTypeId ?? undefined);
        muni.preload(
          p.departmentId ?? undefined,
          p.municipalityId ?? undefined,
        );
        setInitial({
          fullName: p.fullName ?? '',
          phone: formatText('phone', p.phone ?? ''),
          address: p.address ?? '',
          identificationNumber: p.identificationNumber ?? '',
          identificationTypeId: p.identificationTypeId ?? undefined,
          departmentId: p.departmentId ?? undefined,
          municipalityId: p.municipalityId ?? undefined,
        });
      })
      .catch(() => {
        // El interceptor HTTP ya mostró el toast.
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Refresca nombre/foto en la sesión persistida (cabecera del drawer). */
  async function refreshSessionUser(changes: {
    fullName?: string;
    avatarUrl?: string | null;
  }) {
    const session = getSession();
    if (!session) return;
    await setSession({
      ...session,
      user: { ...session.user, ...changes },
    });
  }

  // Sin cambios no hay nada que guardar (evita PATCH inútiles al backend).
  const dirty =
    !!pendingAvatar ||
    !!coords ||
    (!!initial &&
      (fullName !== initial.fullName ||
        phone !== initial.phone ||
        address !== initial.address ||
        identificationNumber !== initial.identificationNumber ||
        identificationTypeId !== initial.identificationTypeId ||
        muni.departmentId !== initial.departmentId ||
        muni.municipalityId !== initial.municipalityId));

  /**
   * Re-marca la ubicación con el GPS (espejo del registro): actualiza las
   * coordenadas, la dirección legible y preselecciona depto/municipio según
   * el geocoder. La dirección es de solo lectura para que el texto siempre
   * corresponda a las coordenadas guardadas.
   */
  async function handleUseLocation() {
    setLocating(true);
    try {
      const result = await getDeviceLocation();
      if (result) {
        setCoords(result.coords);
        setAddress(
          result.address ??
            `Ubicación GPS (${result.coords.latitude.toFixed(5)}, ${result.coords.longitude.toFixed(5)})`,
        );
        clearError('address');
        // Preselección de departamento/municipio según el geocoder (los
        // selects siguen editables por si el nombre no matchea con el DANE).
        if (result.region) {
          const dept = departments.find((d) =>
            samePlaceName(d.name, result.region),
          );
          if (dept && result.city) {
            const muns = await muni.preload(dept.id);
            const mun = muns.find((m) => samePlaceName(m.name, result.city));
            if (mun) muni.setMunicipalityId(mun.id);
          }
        }
      }
    } finally {
      setLocating(false);
    }
  }

  async function handleSave() {
    const ok = validate({
      fullName: fullName.trim() ? undefined : 'Ingresa tu nombre completo.',
      // La identificación es opcional (registro rápido), pero si se llena un
      // campo del par tipo+número, se exige el otro.
      identificationTypeId:
        identificationNumber.trim() && !identificationTypeId
          ? 'Selecciona el tipo.'
          : undefined,
      identificationNumber:
        identificationTypeId && !identificationNumber.trim()
          ? 'Ingresa tu número de identificación.'
          : undefined,
    });
    if (!ok) return;

    try {
      setSaving(true);
      await profileService.updateMe({
        fullName: fullName.trim(),
        phone: normalizePhone(phone) || undefined,
        address: address.trim() || undefined,
        departmentId: muni.departmentId,
        municipalityId: muni.municipalityId,
        identificationNumber: identificationNumber.trim() || undefined,
        identificationTypeId,
        // Solo si se re-marcó con el GPS (si no, quedan las guardadas).
        ...(coords && {
          latitude: coords.latitude,
          longitude: coords.longitude,
        }),
      });

      let avatarUrl = profile?.avatarUrl ?? null;
      if (pendingAvatar) {
        const res = await profileService.uploadAvatar(pendingAvatar);
        avatarUrl = res.data.avatarUrl;
        setPendingAvatar(null);
        setProfile((p) => (p ? { ...p, avatarUrl } : p));
      }
      await refreshSessionUser({ fullName: fullName.trim(), avatarUrl });

      // Lo recién guardado pasa a ser el punto de partida: el botón vuelve
      // a deshabilitarse hasta que algo cambie de nuevo.
      if (coords) {
        setProfile((p) =>
          p ? { ...p, latitude: coords.latitude, longitude: coords.longitude } : p,
        );
        setCoords(null);
      }
      setInitial({
        fullName,
        phone,
        address,
        identificationNumber,
        identificationTypeId,
        departmentId: muni.departmentId,
        municipalityId: muni.municipalityId,
      });
    } catch {
      // El interceptor HTTP ya mostró el toast (409 de duplicados, etc.).
    } finally {
      setSaving(false);
    }
  }

  async function handleLinkGoogle() {
    try {
      setLinkingGoogle(true);
      const idToken = await getGoogleIdToken();
      if (!idToken) return;
      await profileService.linkGoogle(idToken);
      // Recarga el perfil para reflejar el vínculo (y el avatar de Google si entró).
      const res = await profileService.getMe();
      setProfile(res.data);
      await refreshSessionUser({ avatarUrl: res.data.avatarUrl });
    } catch {
      // El interceptor HTTP ya mostró el toast (p. ej. 409 vinculada a otro).
    } finally {
      setLinkingGoogle(false);
    }
  }

  async function handleUnlinkGoogle() {
    try {
      await profileService.unlinkGoogle();
      const res = await profileService.getMe();
      setProfile(res.data);
    } catch {
      // El interceptor HTTP ya mostró el toast.
    } finally {
      setConfirmUnlink(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-dark">
        <StatusBar style="light" />
        <View className="flex-1 bg-surface">
          <PanelHeader title="Mi perfil" menu={menu} />
          <ActivityIndicator
            size="large"
            color="#FF5A3C"
            style={{ paddingTop: 48 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-dark">
      <StatusBar style="light" />

      <View className="flex-1 bg-surface">
      <PanelHeader title="Mi perfil" menu={menu} />

      <KeyboardAwareScroll>
        <View className="px-5 pb-10">
          {/* ---- Datos personales ---- */}
          <View className="mt-2 rounded-2xl bg-white p-4">
            <View className="items-center">
              <PhotoField
                label="Foto de perfil"
                imageUrl={profile?.avatarUrl}
                pendingUri={pendingAvatar}
                onChange={setPendingAvatar}
              />
            </View>

            <TextField
              label="Nombre completo"
              icon="person-outline"
              format="name"
              value={fullName}
              onChangeText={bind('fullName', setFullName)}
              error={errors.fullName}
              placeholder="Juan Pérez"
            />
            <TextField
              label="Celular"
              icon="call-outline"
              format="phone"
              value={phone}
              onChangeText={bind('phone', setPhone)}
              error={errors.phone}
              placeholder="+57 - 310 210 366 0"
            />

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
            {/* Solo lectura: la llena "Usar mi ubicación actual" para que el
                texto siempre corresponda a las coordenadas reales (igual que
                en el registro). */}
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
                    ? 'Ubicación actualizada — se guarda al guardar cambios'
                    : profile?.latitude != null
                      ? 'Actualizar con mi ubicación actual'
                      : 'Usar mi ubicación actual'}
              </Text>
            </Pressable>

            <Button
              label="Guardar cambios"
              onPress={handleSave}
              loading={saving}
              disabled={!dirty}
            />
          </View>

          {/* ---- Cuenta ---- */}
          <Text className="mb-2 mt-6 text-base font-extrabold text-dark">
            Cuenta
          </Text>
          <View className="rounded-2xl bg-white p-4">
            {/* Correo (solo lectura: cambiarlo requeriría re-verificación) */}
            <View className="mb-4 flex-row items-center gap-3">
              <Ionicons name="mail-outline" size={20} color="#7A7A8A" />
              <View className="flex-1">
                <Text className="text-[11px] font-bold uppercase tracking-wide text-muted">
                  Correo
                </Text>
                <Text className="text-[14px] font-medium text-dark">
                  {profile?.email}
                </Text>
              </View>
            </View>

            {/* Google */}
            {profile?.googleId ? (
              <View className="mb-4 flex-row items-center gap-3 rounded-xl bg-surface px-3.5 py-3">
                <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                <Text className="flex-1 text-[14px] font-medium text-dark">
                  Cuenta vinculada con Google
                </Text>
                <Pressable
                  onPress={() => setConfirmUnlink(true)}
                  hitSlop={6}
                  className="rounded-lg border border-red-200 px-2.5 py-1.5 active:opacity-70"
                >
                  <Text className="text-xs font-bold text-red-600">
                    Desvincular
                  </Text>
                </Pressable>
              </View>
            ) : Platform.OS !== 'web' ? (
              // Vincular usa el sign-in NATIVO de Google → solo en la app.
              // (Desvincular sí queda en web: es una llamada normal al API.)
              <View className="mb-4">
                <GoogleButton
                  label="Vincular con Google"
                  onPress={handleLinkGoogle}
                  loading={linkingGoogle}
                />
              </View>
            ) : null}

            {/* Cambiar contraseña: pantalla propia */}
            <Pressable
              onPress={() => router.push(changePasswordHref)}
              className="flex-row items-center gap-3 rounded-xl bg-surface px-3.5 py-3 active:opacity-70"
            >
              <Ionicons name="key-outline" size={20} color="#FF5A3C" />
              <Text className="flex-1 text-[14px] font-bold text-dark">
                Cambiar contraseña
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#7A7A8A" />
            </Pressable>
          </View>
        </View>
      </KeyboardAwareScroll>
      </View>

      <YesNoDialog
        visible={confirmUnlink}
        destructive
        icon="unlink-outline"
        title="¿Desvincular Google?"
        message="Tu cuenta quedará solo con el acceso por correo y contraseña. Si no la recuerdas, usa '¿Olvidaste tu contraseña?' desde el login."
        confirmLabel="Sí, desvincular"
        cancelLabel="No"
        onConfirm={handleUnlinkGoogle}
        onCancel={() => setConfirmUnlink(false)}
      />
    </SafeAreaView>
  );
}
