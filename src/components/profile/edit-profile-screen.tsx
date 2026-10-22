import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, BackHandler, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { KeyboardAwareScroll } from '@/components/ui/keyboard-aware-scroll';
import { PanelHeader, PanelSafeArea } from '@/components/ui/panel-header';
import { PhotoField } from '@/components/ui/photo-field';
import { Select } from '@/components/ui/select';
import { TextField } from '@/components/ui/text-field';
import { useAppData } from '@/context/app-data';
import { useFormErrors } from '@/hooks/use-form-errors';
import { useMunicipalities } from '@/hooks/use-municipalities';
import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';
import { useSession } from '@/hooks/use-session';
import { DEFAULT_USER_AVATAR } from '@/lib/default-images';
import {
  DeviceCoords,
  getDeviceLocation,
  samePlaceName,
} from '@/lib/location';
import { getSession, profilePathFor, setSession } from '@/lib/session';
import { formatText, normalizePhone, PHONE_PREFIX } from '@/lib/text-format';
import { toast } from '@/lib/toast';
import { identificationErrorFor } from '@/lib/identification';
import { MyProfile, profileService } from '@/services/profile';

/** Campos editables cuyo valor inicial se recuerda para detectar cambios. */
type FormSnapshot = {
  fullName: string;
  username: string;
  phone: string;
  address: string;
  identificationNumber: string;
  identificationTypeId?: number;
  departmentId?: number;
  municipalityId?: number;
};

/**
 * "Editar información" del cliente y el repartidor (antes el formulario
 * vivía dentro de "Mi cuenta"; ahora esa pantalla solo muestra los datos y
 * se entra acá con el lápiz de la foto o el botón "Editar información").
 * Al guardar vuelve a "Mi cuenta".
 */
export function EditProfileScreen() {
  const colors = useResolvedAppColors();
  const router = useRouter();
  const session = useSession();
  const profileHref = profilePathFor(session?.user);
  const isClient = profileHref === '/profile';
  const { departments, identificationTypes } = useAppData();
  const muni = useMunicipalities();
  const { errors, clearError, bind, validate, applyServerErrors } = useFormErrors();

  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Datos personales
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [identificationNumber, setIdentificationNumber] = useState('');
  const [identificationTypeId, setIdentificationTypeId] = useState<number>();
  const [pendingAvatar, setPendingAvatar] = useState<string | null>(null);
  const [avatarRemoved, setAvatarRemoved] = useState(false);
  const [saving, setSaving] = useState(false);
  // Ubicación re-marcada con el GPS en ESTA visita (null = quedó la guardada).
  const [coords, setCoords] = useState<DeviceCoords | null>(null);
  const [locating, setLocating] = useState(false);
  // Valores con los que se prellenó el form: guardar se habilita solo si algo cambió.
  const [initial, setInitial] = useState<FormSnapshot | null>(null);


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
        setUsername(p.username ?? '');
        // El backend guarda "+573102103660"; acá se muestra legible.
        setPhone(p.phone ? formatText('phone', p.phone) : PHONE_PREFIX);
        setAddress(p.address ?? '');
        setIdentificationNumber(p.identificationNumber ?? '');
        setIdentificationTypeId(p.identificationTypeId ?? undefined);
        muni.preload(
          p.departmentId ?? undefined,
          p.municipalityId ?? undefined,
        );
        setInitial({
          fullName: p.fullName ?? '',
          username: p.username ?? '',
          phone: p.phone ? formatText('phone', p.phone) : PHONE_PREFIX,
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


  // Volver = a "Mi cuenta" (no back(): en un Tabs vuelve al home).
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        router.replace(profileHref);
        return true;
      });
      return () => sub.remove();
    }, [router, profileHref]),
  );

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
    avatarRemoved ||
    !!coords ||
    (!!initial &&
      (fullName !== initial.fullName ||
        username !== initial.username ||
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
      fullName: fullName.trim()
        ? undefined
        : 'Ingresa tus nombres y apellidos completos.',
      // La identificación es opcional (registro rápido), pero si se llena un
      // campo del par tipo+número, se exige el otro.
      identificationTypeId:
        identificationNumber.trim() && !identificationTypeId
          ? 'Selecciona el tipo.'
          : undefined,
      identificationNumber:
        identificationTypeId && !identificationNumber.trim()
          ? 'Ingresa tu número de identificación.'
          : identificationErrorFor(
              identificationTypes,
              identificationTypeId,
              identificationNumber,
            ),
    });
    if (!ok) return;

    try {
      setSaving(true);
      await profileService.updateMe({
        fullName: fullName.trim(),
        username: username.trim() || undefined,
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
      } else if (avatarRemoved && profile?.avatarUrl) {
        await profileService.removeAvatar();
        avatarUrl = null;
        setProfile((p) => (p ? { ...p, avatarUrl: null } : p));
      }
      setAvatarRemoved(false);
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
        username,
        phone,
        address,
        identificationNumber,
        identificationTypeId,
        departmentId: muni.departmentId,
        municipalityId: muni.municipalityId,
      });
      toast.success('Tus datos se guardaron.');
      router.replace(profileHref);
    } catch (e) {
      applyServerErrors(e, { latitude: 'address', longitude: 'address' });
      // El interceptor HTTP ya mostró el toast (409 de duplicados, etc.).
    } finally {
      setSaving(false);
    }
  }


  const backButton = (
    <Pressable
      onPress={() => router.replace(profileHref)}
      hitSlop={8}
      className="h-9 w-9 items-center justify-center rounded-full bg-white/10 active:opacity-70"
    >
      <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
    </Pressable>
  );

  return (
    <PanelSafeArea>
      <StatusBar style="light" />
      <View className="flex-1 bg-surface">
        <PanelHeader title="Editar información" menu={backButton} />
        {loading ? (
          <ActivityIndicator
            size="large"
            color={colors.primaryColor}
            style={{ paddingTop: 48 }}
          />
        ) : (
          <KeyboardAwareScroll safeBottom={false}>
            <View className="px-5 pb-4">
          {/* ---- Datos personales (edición) ---- */}
          <View className="mt-5 rounded-2xl border border-border bg-card p-4">
            <View className="items-center">
              <PhotoField
                label="Foto de perfil"
                imageUrl={avatarRemoved ? null : profile?.avatarUrl}
                pendingUri={pendingAvatar}
                onChange={(uri) => {
                  setPendingAvatar(uri);
                  setAvatarRemoved(false);
                }}
                onRemove={
                  pendingAvatar || profile?.avatarUrl
                    ? () => {
                        if (pendingAvatar) setPendingAvatar(null);
                        else setAvatarRemoved(true);
                      }
                    : undefined
                }
                fallbackSource={DEFAULT_USER_AVATAR}
              />
            </View>

            <TextField
              label="Nombres y apellidos completos"
              icon="person-outline"
              format="name"
              value={fullName}
              onChangeText={bind('fullName', setFullName)}
              error={errors.fullName}
              placeholder="Juan Pérez"
            />
            <TextField
              label="Nombre de usuario"
              icon="at-outline"
              format="username"
              value={username}
              onChangeText={bind('username', setUsername)}
              error={errors.username}
              placeholder="juanp"
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
              maxLength={15}
              value={identificationNumber}
              onChangeText={bind(
                'identificationNumber',
                setIdentificationNumber,
              )}
              error={errors.identificationNumber}
              placeholder="1090123456"
            />

            {isClient && (
              <Text className="mb-3 -mt-1 text-xs leading-4 text-muted">
                Esta es la ubicación donde vives siempre (tu perfil). Para
                mandar tus pedidos SIEMPRE se usa la dirección que elijas en
                &quot;Mis direcciones&quot;, no esta.
              </Text>
            )}

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
                <ActivityIndicator size="small" color={colors.primaryColor} />
              ) : (
                <Ionicons
                  name={coords ? 'checkmark-circle' : 'locate-outline'}
                  size={16}
                  color={colors.primaryColor}
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

            </View>
          </KeyboardAwareScroll>
        )}
      </View>
    </PanelSafeArea>
  );
}
