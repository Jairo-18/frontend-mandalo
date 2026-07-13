import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { UserDocuments } from '@/components/admin/user-documents';
import { Checkbox } from '@/components/ui/checkbox';
import { FormModal } from '@/components/ui/form-modal';
import { PhotoField } from '@/components/ui/photo-field';
import { Select } from '@/components/ui/select';
import { TextField } from '@/components/ui/text-field';
import { useAppData } from '@/context/app-data';
import { useFormErrors } from '@/hooks/use-form-errors';
import { useMunicipalities } from '@/hooks/use-municipalities';
import {
  DeviceCoords,
  getDeviceLocation,
  samePlaceName,
} from '@/lib/location';
import { EMAIL_RE, formatText, normalizePhone } from '@/lib/text-format';
import {
  AdminUser,
  AdminUserPayload,
  adminUsersService,
  RoleCode,
} from '@/services/admin-users';
import { authService } from '@/services/auth';

type Props = {
  visible: boolean;
  /** Rol con el que se crean las cuentas nuevas (USER / DELI). */
  roleCode: RoleCode;
  /** Nombre en singular para los textos ("usuario", "repartidor"). */
  entityName: string;
  /** Usuario a editar; null = crear. */
  editing: AdminUser | null;
  /**
   * Edición del propio perfil (sidebar admin): oculta los checkboxes de
   * estado de cuenta y no los envía (nadie se banea/desactiva a sí mismo).
   */
  selfProfile?: boolean;
  onClose: () => void;
  /** Se guardó bien: la pantalla recarga el listado y cierra el modal. */
  onSaved: () => void;
};

/** Formulario de crear/editar usuario del panel admin (modal a pantalla completa). */
export function UserFormModal({
  visible,
  roleCode,
  entityName,
  editing,
  selfProfile = false,
  onClose,
  onSaved,
}: Props) {
  const { departments, identificationTypes } = useAppData();
  const muni = useMunicipalities();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [address, setAddress] = useState('');
  const [identificationNumber, setIdentificationNumber] = useState('');
  const [identificationTypeId, setIdentificationTypeId] = useState<number>();
  const [isActive, setIsActive] = useState(true);
  const [isBanned, setIsBanned] = useState(false);
  // Nota del admin PARA el usuario (p. ej. por qué su cuenta DELI no se activa).
  const [observations, setObservations] = useState('');
  // Foto recortada por el PhotoEditor pendiente de subir (se sube al guardar).
  const [pendingAvatar, setPendingAvatar] = useState<string | null>(null);
  // Ubicación re-marcada con el GPS (solo edición del propio perfil).
  const [coords, setCoords] = useState<DeviceCoords | null>(null);
  const [locating, setLocating] = useState(false);

  const [saving, setSaving] = useState(false);
  const [sendingRecovery, setSendingRecovery] = useState(false);
  const { errors, setErrors, clearError, bind, validate } = useFormErrors();

  const isEdit = !!editing;

  // Prellena (edición) o limpia (creación) el formulario cada vez que se abre.
  useEffect(() => {
    if (!visible) return;

    setErrors({});
    setPassword('');
    setConfirm('');
    setPendingAvatar(null);
    setCoords(null);
    setFullName(editing?.fullName ?? '');
    setUsername(editing?.username ?? '');
    setEmail(editing?.email ?? '');
    setPhone(formatText('phone', editing?.phone ?? ''));
    setAddress(editing?.address ?? '');
    setIdentificationNumber(editing?.identificationNumber ?? '');
    setIdentificationTypeId(
      editing?.identificationType ? Number(editing.identificationType.id) : undefined,
    );
    setIsActive(editing?.isActive ?? true);
    setIsBanned(editing?.isBanned ?? false);
    setObservations(editing?.observations ?? '');

    muni.preload(
      editing?.department ? Number(editing.department.id) : undefined,
      editing?.municipality ? Number(editing.municipality.id) : undefined,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, editing]);

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

  // En edición, guardar solo se habilita si algo cambió respecto a lo cargado
  // (evita PATCH inútiles); al crear siempre está habilitado.
  const dirty =
    !isEdit ||
    !!pendingAvatar ||
    !!coords ||
    fullName !== (editing?.fullName ?? '') ||
    username !== (editing?.username ?? '') ||
    email !== (editing?.email ?? '') ||
    normalizePhone(phone) !== (editing?.phone ?? '') ||
    address !== (editing?.address ?? '') ||
    identificationNumber !== (editing?.identificationNumber ?? '') ||
    identificationTypeId !==
      (editing?.identificationType
        ? Number(editing.identificationType.id)
        : undefined) ||
    muni.departmentId !==
      (editing?.department ? Number(editing.department.id) : undefined) ||
    muni.municipalityId !==
      (editing?.municipality ? Number(editing.municipality.id) : undefined) ||
    (!selfProfile &&
      (isActive !== (editing?.isActive ?? true) ||
        isBanned !== (editing?.isBanned ?? false) ||
        observations !== (editing?.observations ?? '')));

  /**
   * Ubicación GPS del propio admin (espejo del perfil de cliente/repartidor):
   * marca coordenadas, llena la dirección legible y preselecciona
   * depto/municipio según el geocoder.
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

  function validateForm() {
    return validate({
      fullName: fullName.trim() ? undefined : 'Ingresa el nombre completo.',
      email: !email.trim()
        ? 'Ingresa el correo.'
        : !EMAIL_RE.test(email.trim())
          ? 'Ingresa un correo válido.'
          : undefined,
      password: isEdit
        ? undefined
        : !password
          ? 'Ingresa una contraseña.'
          : password.length < 8
            ? 'Mínimo 8 caracteres.'
            : undefined,
      confirm: isEdit
        ? undefined
        : !confirm
          ? 'Confirma la contraseña.'
          : password !== confirm
            ? 'Las contraseñas no coinciden.'
            : undefined,
      identificationTypeId:
        identificationNumber.trim() && !identificationTypeId
          ? 'Selecciona el tipo.'
          : undefined,
    });
  }

  /** Dispara el forgot-password del usuario (código de 6 dígitos a SU correo). */
  async function handleSendRecovery() {
    if (!editing?.email || sendingRecovery) return;
    try {
      setSendingRecovery(true);
      await authService.forgotPassword(editing.email);
    } catch {
      // El interceptor HTTP ya mostró el error.
    } finally {
      setSendingRecovery(false);
    }
  }

  async function handleSave() {
    if (!validateForm()) return;

    // En edición, los campos opcionales vacíos van en null para poder limpiarlos.
    const payload: AdminUserPayload = {
      fullName: fullName.trim(),
      email: email.trim(),
      username: username.trim() || null,
      phone: normalizePhone(phone) || null,
      address: address.trim() || null,
      // Coordenadas: solo del GPS del propio perfil (para otro usuario el
      // admin no está en la casa de esa persona).
      ...(selfProfile &&
        coords && { latitude: coords.latitude, longitude: coords.longitude }),
      identificationNumber: identificationNumber.trim() || null,
      ...(muni.departmentId && { departmentId: muni.departmentId }),
      ...(muni.municipalityId && { municipalityId: muni.municipalityId }),
      ...(identificationTypeId && { identificationTypeId }),
      ...(selfProfile ? {} : { isActive }),
    };

    try {
      setSaving(true);
      let userId = editing?.id;
      if (isEdit) {
        await adminUsersService.update(
          editing.id,
          selfProfile
            ? payload
            : { ...payload, isBanned, observations: observations.trim() || null },
        );
      } else {
        const created = await adminUsersService.create({
          ...payload,
          password,
          roleTypeCode: roleCode,
        });
        userId = created.data.rowId;
      }
      // La foto se sube después de guardar (al crear recién existe el id).
      if (pendingAvatar && userId) {
        await adminUsersService.uploadAvatar(userId, pendingAvatar);
      }
      onSaved();
    } catch {
      // El interceptor HTTP ya mostró el mensaje del backend.
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormModal
      visible={visible}
      title={isEdit ? `Editar ${entityName}` : `Nuevo ${entityName}`}
      onClose={onClose}
      saveLabel={isEdit ? 'Guardar cambios' : `Crear ${entityName}`}
      onSave={handleSave}
      saving={saving}
      saveDisabled={!dirty}
    >
      <PhotoField
        label={
          pendingAvatar ? 'Foto lista (se sube al guardar)' : 'Foto de perfil'
        }
        imageUrl={editing?.avatarUrl}
        pendingUri={pendingAvatar}
        onChange={setPendingAvatar}
        shape="circle"
        placeholderIcon="person-outline"
      />

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
        label="Nombre de usuario"
        icon="at-outline"
        format="username"
        value={username}
        onChangeText={bind('username', setUsername)}
        error={errors.username}
        placeholder="juanp"
      />

      <TextField
        label="Correo electrónico"
        icon="mail-outline"
        format="email"
        value={email}
        onChangeText={bind('email', setEmail)}
        error={errors.email}
        placeholder="juan@correo.com"
      />

      <TextField
        label="Celular"
        icon="call-outline"
        format="phone"
        value={phone}
        onChangeText={bind('phone', setPhone)}
        error={errors.phone}
        placeholder="3001234567"
      />

      {!isEdit && (
        <>
          <TextField
            label="Contraseña"
            icon="lock-closed-outline"
            secure
            value={password}
            onChangeText={bind('password', setPassword)}
            error={errors.password}
            placeholder="Mínimo 8 caracteres"
          />
          <TextField
            label="Confirmar contraseña"
            icon="lock-closed-outline"
            secure
            value={confirm}
            onChangeText={bind('confirm', setConfirm)}
            error={errors.confirm}
            placeholder="Repite la contraseña"
          />
        </>
      )}

      <Select
        label="Departamento"
        icon="map-outline"
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
        options={municipalityOptions}
        value={muni.municipalityId}
        onSelect={(id) => {
          muni.setMunicipalityId(id);
          clearError('municipalityId');
        }}
        disabled={!muni.departmentId}
        loading={muni.loadingMuns}
        placeholder={
          muni.departmentId
            ? 'Selecciona un municipio'
            : 'Elige primero el departamento'
        }
        error={errors.municipalityId}
      />

      <TextField
        label={
          selfProfile ? 'Dirección (se llena con tu ubicación)' : 'Dirección'
        }
        icon="home-outline"
        format="text"
        value={address}
        onChangeText={bind('address', setAddress)}
        error={errors.address}
        placeholder={
          selfProfile ? 'Toca «Usar mi ubicación actual»' : 'Calle 1 # 2-3'
        }
        editable={!selfProfile}
      />
      {selfProfile && (
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
                : 'Usar mi ubicación actual'}
          </Text>
        </Pressable>
      )}

      <Select
        label="Tipo de identificación"
        icon="card-outline"
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
        icon="id-card-outline"
        format="identification"
        value={identificationNumber}
        onChangeText={bind('identificationNumber', setIdentificationNumber)}
        error={errors.identificationNumber}
        placeholder="1090123456"
      />

      {/* Documento del repartidor (solo lectura): lo subió al registrarse y
          el admin lo revisa antes de marcar "Cuenta activa". */}
      {!selfProfile && isEdit && (
        <UserDocuments
          frontUrl={editing?.identificationFrontUrl}
          backUrl={editing?.identificationBackUrl}
        />
      )}

      {!selfProfile && isEdit && (
        <TextField
          label="Observaciones para el usuario (opcional)"
          icon="chatbox-ellipses-outline"
          value={observations}
          onChangeText={setObservations}
          placeholder="Ej: La foto de tu documento está borrosa, vuelve a subirla."
          multiline
        />
      )}

      {!selfProfile && (
        <View className="mb-6 mt-1 gap-3">
          <Checkbox
            checked={isActive}
            onChange={setIsActive}
            label="Cuenta activa"
          />
          {isEdit && (
            <Checkbox
              checked={isBanned}
              onChange={setIsBanned}
              label="Cuenta baneada (bloquea el inicio de sesión)"
            />
          )}
        </View>
      )}

      {/* El admin no maneja contraseñas ajenas: dispara el flujo de
          recuperación (código de 6 dígitos al correo del usuario). */}
      {!selfProfile && isEdit && (
        <Pressable
          onPress={handleSendRecovery}
          disabled={sendingRecovery}
          className="mb-6 flex-row items-center gap-2.5 rounded-2xl border border-gray-200 px-4 py-3 active:opacity-70"
        >
          {sendingRecovery ? (
            <ActivityIndicator size="small" color="#FF5A3C" />
          ) : (
            <Ionicons name="key-outline" size={18} color="#FF5A3C" />
          )}
          <Text className="flex-1 text-[13px] font-bold text-dark">
            Enviar correo de recuperación de contraseña
          </Text>
        </Pressable>
      )}
    </FormModal>
  );
}
