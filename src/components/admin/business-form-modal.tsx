import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { OwnerField } from '@/components/admin/owner-field';
import { Checkbox } from '@/components/ui/checkbox';
import { ChipMultiSelect } from '@/components/ui/chip-multi-select';
import { DocumentPhotoField } from '@/components/ui/document-photo-field';
import { FormModal } from '@/components/ui/form-modal';
import { PhotoField } from '@/components/ui/photo-field';
import { Select } from '@/components/ui/select';
import { TextField } from '@/components/ui/text-field';
import { useAppData } from '@/context/app-data';
import { useFormErrors } from '@/hooks/use-form-errors';
import { useMunicipalities } from '@/hooks/use-municipalities';
import { DeviceCoords, getDeviceLocation } from '@/lib/location';
import { extractCoordsFromMapsUrl } from '@/lib/maps-url';
import {
  EMAIL_RE,
  formatHour12,
  formatText,
  normalizePhone,
  PHONE_PREFIX,
  phoneOrNull,
} from '@/lib/text-format';
import {
  AdminBusiness,
  AdminBusinessPayload,
  adminBusinessesService,
  BusinessOwner,
} from '@/services/admin-businesses';
import { adminTagsService, CatalogItem } from '@/services/admin-catalogs';
import { businessService } from '@/services/business';

/** Días de la semana para el horario (números JS: 0 = domingo). */
const DAY_ITEMS = [
  { id: 1, name: 'Lun' },
  { id: 2, name: 'Mar' },
  { id: 3, name: 'Mié' },
  { id: 4, name: 'Jue' },
  { id: 5, name: 'Vie' },
  { id: 6, name: 'Sáb' },
  { id: 0, name: 'Dom' },
];
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

/**
 * "Sin definir" + cada media hora del día para los selects del horario.
 * El value viaja en 24 h ("HH:MM", formato de la DB); el label se muestra en
 * 12 horas ("8:00 a. m.").
 */
const TIME_OPTIONS = [
  { label: 'Sin definir', value: '' },
  ...Array.from({ length: 48 }, (_, i) => {
    const time = `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`;
    return { label: formatHour12(time), value: time };
  }),
];

function parseOpenDays(openDays: string | null | undefined): number[] {
  if (!openDays?.trim()) return ALL_DAYS;
  return openDays
    .split(',')
    .map((d) => Number(d.trim()))
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
}

/** Días elegidos → valor del payload (todos o ninguno = null = "todos"). */
function daysToPayload(days: number[]): string | null {
  if (days.length === 0 || days.length === 7) return null;
  return [...days].sort((a, b) => a - b).join(',');
}

type Props = {
  visible: boolean;
  /** Negocio a editar; null = crear. */
  editing: AdminBusiness | null;
  /**
   * Edición del negocio PROPIO (panel del rol NEGO): oculta dueño/cuenta de
   * acceso/estado activo (solo admin) y guarda contra /organizational/mine.
   */
  selfBusiness?: boolean;
  onClose: () => void;
  /** Se guardó bien: la pantalla recarga el listado y cierra el modal. */
  onSaved: () => void;
};

/** Formulario de crear/editar negocio (panel admin y "Editar mi negocio" del NEGO). */
export function BusinessFormModal({
  visible,
  editing,
  selfBusiness = false,
  onClose,
  onSaved,
}: Props) {
  const { departments, identificationTypes } = useAppData();
  const muni = useMunicipalities();

  const [legalName, setLegalName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [identificationNumber, setIdentificationNumber] = useState('');
  const [identificationTypeId, setIdentificationTypeId] = useState<number>();
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  // Ubicación del local: se extrae del link "Compartir" de Google Maps
  // (alimenta el radio de cercanía del explorar y la ETA de entrega).
  const [mapsUrl, setMapsUrl] = useState('');
  const [coords, setCoords] = useState<DeviceCoords | null>(null);
  const [extracting, setExtracting] = useState(false);
  // GPS del dueño (solo panel NEGO: el dueño suele estar EN el negocio).
  const [locating, setLocating] = useState(false);
  // Dueño/representante: usuario existente elegido con el buscador…
  const [owner, setOwner] = useState<BusinessOwner | null>(null);
  // …o cuenta nueva del negocio (correo + contraseña, solo al crear).
  const [accountEmail, setAccountEmail] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [accountConfirm, setAccountConfirm] = useState('');

  const [tagIds, setTagIds] = useState<number[]>([]);
  const [isActive, setIsActive] = useState(true);
  // Comisión sobre lo vendido: 5% el primer mes, 12% después (el admin la
  // sube a mano cuando corresponda, sin lógica automática por fecha).
  const [commissionOrderRate, setCommissionOrderRate] = useState(5);
  // Horario de atención (hora Colombia). Sin horas = siempre abierto.
  const [openTime, setOpenTime] = useState('');
  const [closeTime, setCloseTime] = useState('');
  const [openDaysSel, setOpenDaysSel] = useState<number[]>(ALL_DAYS);
  const [temporarilyClosed, setTemporarilyClosed] = useState(false);
  // Logo recortado por el PhotoEditor pendiente de subir (se sube al guardar).
  const [pendingLogo, setPendingLogo] = useState<string | null>(null);
  // Datos de pago (el cliente los ve en el checkout si no paga en efectivo).
  const [paymentHolderName, setPaymentHolderName] = useState('');
  const [nequiNumber, setNequiNumber] = useState('');
  const [nequiKey, setNequiKey] = useState('');
  const [bancolombiaAccount, setBancolombiaAccount] = useState('');
  // QR de Bancolombia pendiente de subir (se sube al guardar, como el logo).
  const [pendingQr, setPendingQr] = useState<string | null>(null);

  // Etiquetas disponibles para los chips.
  const [allTags, setAllTags] = useState<CatalogItem[]>([]);

  const [saving, setSaving] = useState(false);
  const { errors, setErrors, clearError, bind, validate } = useFormErrors();

  const isEdit = !!editing;

  // Prellena (edición) o limpia (creación) el formulario cada vez que se abre.
  useEffect(() => {
    if (!visible) return;

    setErrors({});
    setPendingLogo(null);
    // La razón social va SIEMPRE en mayúsculas (también las guardadas antes).
    setLegalName(formatText('upper', editing?.legalName ?? ''));
    setTradeName(editing?.tradeName ?? '');
    setIdentificationNumber(editing?.identificationNumber ?? '');
    setIdentificationTypeId(
      editing?.identificationType
        ? Number(editing.identificationType.id)
        : undefined,
    );
    setDescription(editing?.description ?? '');
    // Al crear nace con el indicativo "+57 - " (borrable, como el registro);
    // al editar muestra el guardado ya formateado.
    setPhone(editing ? formatText('phone', editing.phone ?? '') : PHONE_PREFIX);
    setAddress(editing?.address ?? '');
    setMapsUrl('');
    setCoords(
      editing?.latitude != null && editing?.longitude != null
        ? { latitude: editing.latitude, longitude: editing.longitude }
        : null,
    );
    setOwner(editing?.legalPerson ?? null);
    setAccountEmail('');
    setAccountPassword('');
    setAccountConfirm('');
    setTagIds(editing?.tags?.map((t) => t.id) ?? []);
    setIsActive(editing?.isActive ?? true);
    setCommissionOrderRate(editing?.commissionOrderRate ?? 5);
    setOpenTime(editing?.openTime ?? '');
    setCloseTime(editing?.closeTime ?? '');
    setOpenDaysSel(parseOpenDays(editing?.openDays));
    setTemporarilyClosed(editing?.temporarilyClosed ?? false);
    setPaymentHolderName(editing?.paymentHolderName ?? '');
    setNequiNumber(editing?.nequiNumber ?? '');
    setNequiKey(editing?.nequiKey ?? '');
    setBancolombiaAccount(editing?.bancolombiaAccount ?? '');
    setPendingQr(null);

    muni.preload(
      editing?.department ? Number(editing.department.id) : undefined,
      editing?.municipality ? Number(editing.municipality.id) : undefined,
    );

    // Etiquetas para los chips.
    adminTagsService
      .paginated({ page: 1, perPage: 200 })
      .then((res) => setAllTags(res.data))
      .catch(() => {});
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

  function toggleTag(id: number) {
    setTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  // La cuenta nueva solo aplica al crear y sin un usuario ya vinculado.
  const wantsAccount =
    !isEdit &&
    !owner &&
    !!(accountEmail.trim() || accountPassword || accountConfirm);

  /** Saca lat/lng del link pegado (o de "lat, lng" a mano). */
  async function handleExtractLocation() {
    if (!mapsUrl.trim() || extracting) return;
    setExtracting(true);
    try {
      const result = await extractCoordsFromMapsUrl(mapsUrl);
      if (result) {
        setCoords(result);
        clearError('location');
      } else {
        setErrors((prev) => ({
          ...prev,
          location:
            'No pudimos leer la ubicación de ese link. Usa el botón "Compartir" del negocio en Google Maps.',
        }));
      }
    } finally {
      setExtracting(false);
    }
  }

  /** GPS del dispositivo como alternativa al link (dueño parado en el local). */
  async function handleUseGps() {
    setLocating(true);
    try {
      const result = await getDeviceLocation();
      if (result) {
        setCoords(result.coords);
        clearError('location');
      }
    } finally {
      setLocating(false);
    }
  }

  // En edición, guardar solo se habilita si algo cambió respecto a lo cargado
  // (evita PATCH inútiles); al crear siempre está habilitado.
  const dirty =
    !isEdit ||
    !!pendingLogo ||
    legalName !== formatText('upper', editing?.legalName ?? '') ||
    tradeName !== (editing?.tradeName ?? '') ||
    identificationNumber !== (editing?.identificationNumber ?? '') ||
    identificationTypeId !==
      (editing?.identificationType
        ? Number(editing.identificationType.id)
        : undefined) ||
    description !== (editing?.description ?? '') ||
    normalizePhone(phone) !== (editing?.phone ?? '') ||
    address !== (editing?.address ?? '') ||
    coords?.latitude !== (editing?.latitude ?? undefined) ||
    coords?.longitude !== (editing?.longitude ?? undefined) ||
    muni.departmentId !==
      (editing?.department ? Number(editing.department.id) : undefined) ||
    muni.municipalityId !==
      (editing?.municipality ? Number(editing.municipality.id) : undefined) ||
    owner?.id !== (editing?.legalPerson?.id ?? undefined) ||
    [...tagIds].sort((a, b) => a - b).join(',') !==
      (editing?.tags?.map((t) => t.id) ?? []).sort((a, b) => a - b).join(',') ||
    (!selfBusiness && isActive !== (editing?.isActive ?? true)) ||
    (!selfBusiness &&
      commissionOrderRate !== (editing?.commissionOrderRate ?? 5)) ||
    openTime !== (editing?.openTime ?? '') ||
    closeTime !== (editing?.closeTime ?? '') ||
    daysToPayload(openDaysSel) !== daysToPayload(parseOpenDays(editing?.openDays)) ||
    temporarilyClosed !== (editing?.temporarilyClosed ?? false) ||
    !!pendingQr ||
    paymentHolderName !== (editing?.paymentHolderName ?? '') ||
    nequiNumber !== (editing?.nequiNumber ?? '') ||
    nequiKey !== (editing?.nequiKey ?? '') ||
    bancolombiaAccount !== (editing?.bancolombiaAccount ?? '');

  function validateForm() {
    return validate({
      legalName: legalName.trim() ? undefined : 'Ingresa la razón social.',
      identificationTypeId:
        identificationNumber.trim() && !identificationTypeId
          ? 'Selecciona el tipo.'
          : undefined,
      // Sin coordenadas el negocio NO aparece en el explorar (filtro por
      // cercanía) ni se puede estimar la entrega.
      location: coords
        ? undefined
        : 'Pega el link de Google Maps del negocio y toca "Extraer ubicación".',
      // El horario va en pareja: con una sola hora no se puede saber si abre.
      schedule:
        (openTime && !closeTime) || (!openTime && closeTime)
          ? 'Define la hora de apertura Y la de cierre (o deja ambas sin definir).'
          : undefined,
      // Un dato de pago sin titular no le sirve al cliente (¿a nombre de
      // quién transfiere?).
      paymentHolderName:
        (nequiNumber.trim() ||
          nequiKey.trim() ||
          bancolombiaAccount.trim() ||
          pendingQr ||
          editing?.bancolombiaQrUrl) &&
        !paymentHolderName.trim()
          ? 'Ingresa el nombre del titular de los pagos.'
          : undefined,
      ...(wantsAccount && {
        accountEmail: !accountEmail.trim()
          ? 'Ingresa el correo.'
          : !EMAIL_RE.test(accountEmail.trim())
            ? 'Ingresa un correo válido.'
            : undefined,
        accountPassword: !accountPassword
          ? 'Ingresa una contraseña.'
          : accountPassword.length < 8
            ? 'Mínimo 8 caracteres.'
            : undefined,
        accountConfirm: !accountConfirm
          ? 'Confirma la contraseña.'
          : accountPassword !== accountConfirm
            ? 'Las contraseñas no coinciden.'
            : undefined,
      }),
    });
  }

  async function handleSave() {
    if (!validateForm()) return;

    // En edición, los campos opcionales vacíos van en null para poder limpiarlos.
    const payload: AdminBusinessPayload = {
      legalName: legalName.trim().toUpperCase(),
      tradeName: tradeName.trim() || null,
      identificationNumber: identificationNumber.trim() || null,
      description: description.trim() || null,
      // Solo el prefijo (sin número real) cuenta como vacío.
      phone: phoneOrNull(phone),
      address: address.trim() || null,
      ...(coords && {
        latitude: coords.latitude,
        longitude: coords.longitude,
      }),
      ...(identificationTypeId && { identificationTypeId }),
      ...(muni.departmentId && { departmentId: muni.departmentId }),
      ...(muni.municipalityId && { municipalityId: muni.municipalityId }),
      // Dueño/cuenta/estado son cosas del admin; el NEGO no las envía.
      ...(!selfBusiness && owner && { legalPersonId: owner.id }),
      ...(!selfBusiness &&
        wantsAccount && {
          accountEmail: accountEmail.trim(),
          accountPassword,
        }),
      tagIds,
      ...(selfBusiness ? {} : { isActive, commissionOrderRate }),
      openTime: openTime || null,
      closeTime: closeTime || null,
      openDays: daysToPayload(openDaysSel),
      temporarilyClosed,
      paymentHolderName: paymentHolderName.trim() || null,
      nequiNumber: nequiNumber.trim() || null,
      nequiKey: nequiKey.trim() || null,
      bancolombiaAccount: bancolombiaAccount.trim() || null,
    };

    try {
      setSaving(true);
      if (selfBusiness) {
        // Panel del negocio: el backend resuelve el id desde el JWT.
        await businessService.updateMine(payload);
        if (pendingLogo) await businessService.uploadMyLogo(pendingLogo);
        if (pendingQr) await businessService.uploadMyPaymentQr(pendingQr);
        onSaved();
        return;
      }

      let businessId = editing?.id;
      if (isEdit) {
        await adminBusinessesService.update(editing.id, payload);
      } else {
        const created = await adminBusinessesService.create(payload);
        businessId = Number(created.data.rowId);
      }
      // El logo y el QR se suben después de guardar (al crear recién existe el id).
      if (pendingLogo && businessId) {
        await adminBusinessesService.uploadLogo(businessId, pendingLogo);
      }
      if (pendingQr && businessId) {
        await adminBusinessesService.uploadPaymentQr(businessId, pendingQr);
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
      title={
        selfBusiness
          ? 'Editar mi negocio'
          : isEdit
            ? 'Editar negocio'
            : 'Nuevo negocio'
      }
      onClose={onClose}
      saveLabel={isEdit ? 'Guardar cambios' : 'Crear negocio'}
      onSave={handleSave}
      saving={saving}
      saveDisabled={!dirty}
    >
      <PhotoField
        label={
          pendingLogo ? 'Logo listo (se sube al guardar)' : 'Logo del negocio'
        }
        imageUrl={editing?.logoUrl}
        pendingUri={pendingLogo}
        onChange={setPendingLogo}
        shape="rounded"
        placeholderIcon="storefront-outline"
      />

      <TextField
        label="Razón social"
        icon="business-outline"
        format="upper"
        value={legalName}
        onChangeText={bind('legalName', setLegalName)}
        error={errors.legalName}
        placeholder="INVERSIONES EL SABOR S.A.S."
      />

      <TextField
        label="Nombre comercial (el que ve el cliente)"
        icon="storefront-outline"
        format="name"
        value={tradeName}
        onChangeText={bind('tradeName', setTradeName)}
        error={errors.tradeName}
        placeholder="El Sabor Parrilla"
      />

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
        label="Número de identificación (NIT)"
        icon="id-card-outline"
        format="nit"
        value={identificationNumber}
        onChangeText={bind('identificationNumber', setIdentificationNumber)}
        error={errors.identificationNumber}
        placeholder="901234567-8"
      />

      <TextField
        label="Descripción"
        icon="document-text-outline"
        format="text"
        value={description}
        onChangeText={bind('description', setDescription)}
        error={errors.description}
        placeholder="Parrilla y comidas rápidas…"
        multiline
        numberOfLines={3}
      />

      <TextField
        label="Teléfono de contacto"
        icon="call-outline"
        format="phone"
        value={phone}
        onChangeText={bind('phone', setPhone)}
        error={errors.phone}
        placeholder="+57 - 300 123 456 7"
      />

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
        label="Dirección"
        icon="home-outline"
        format="text"
        value={address}
        onChangeText={bind('address', setAddress)}
        error={errors.address}
        placeholder="Cra 5 # 10-23, Centro"
      />

      {/* Ubicación exacta: link "Compartir" de Google Maps del negocio */}
      <TextField
        label="Ubicación (link de Google Maps)"
        icon="map-outline"
        value={mapsUrl}
        onChangeText={(text) => {
          setMapsUrl(text);
          clearError('location');
        }}
        placeholder="https://maps.app.goo.gl/…"
        autoCapitalize="none"
      />
      <Pressable
        onPress={handleExtractLocation}
        disabled={extracting || !mapsUrl.trim()}
        className="-mt-2 mb-1 flex-row items-center gap-1.5 self-start"
      >
        {extracting ? (
          <ActivityIndicator size="small" color="#FF5A3C" />
        ) : (
          <Ionicons
            name={coords ? 'checkmark-circle' : 'locate-outline'}
            size={16}
            color="#FF5A3C"
          />
        )}
        <Text className="text-[13px] font-bold text-primary">
          {extracting
            ? 'Leyendo el link…'
            : coords
              ? 'Ubicación guardada — pega otro link para cambiarla'
              : 'Extraer ubicación del link (obligatorio)'}
        </Text>
      </Pressable>
      {/* Alternativa para el dueño: marcar la ubicación parado en el local */}
      {selfBusiness && (
        <Pressable
          onPress={handleUseGps}
          disabled={locating}
          className="mt-1 flex-row items-center gap-1.5 self-start"
        >
          {locating ? (
            <ActivityIndicator size="small" color="#FF5A3C" />
          ) : (
            <Ionicons name="locate-outline" size={16} color="#FF5A3C" />
          )}
          <Text className="text-[13px] font-bold text-primary">
            {locating
              ? 'Obteniendo ubicación…'
              : '…o usar mi ubicación actual (si estás en el negocio)'}
          </Text>
        </Pressable>
      )}
      {!!errors.location && (
        <Text className="mb-3 text-xs text-red-600">{errors.location}</Text>
      )}
      <View className="mb-4" />

      {/* Dueño/representante y cuenta de acceso: solo los maneja el admin */}
      {!selfBusiness && (
        <>
          <OwnerField owner={owner} onChange={setOwner} />

          {!isEdit && !owner && (
            <>
              <Text className="mb-1 text-sm font-bold text-gray-700">
                Cuenta de acceso del negocio
              </Text>
              <Text className="mb-3 text-xs text-muted">
                Con este correo y contraseña el negocio inicia sesión en la
                app para gestionar sus productos. Déjalo vacío si vinculaste
                un usuario existente arriba.
              </Text>
              <TextField
                label="Correo de acceso"
                icon="mail-outline"
                format="email"
                value={accountEmail}
                onChangeText={bind('accountEmail', setAccountEmail)}
                error={errors.accountEmail}
                placeholder="negocio@correo.com"
              />
              <TextField
                label="Contraseña"
                icon="lock-closed-outline"
                secure
                value={accountPassword}
                onChangeText={bind('accountPassword', setAccountPassword)}
                error={errors.accountPassword}
                placeholder="Mínimo 8 caracteres"
              />
              <TextField
                label="Confirmar contraseña"
                icon="lock-closed-outline"
                secure
                value={accountConfirm}
                onChangeText={bind('accountConfirm', setAccountConfirm)}
                error={errors.accountConfirm}
                placeholder="Repite la contraseña"
              />
            </>
          )}
        </>
      )}

      {/* Datos de pago: cuando el cliente elige un método distinto a efectivo,
          el checkout le muestra ESTOS datos para transferir y subir el
          soporte. Solo se ofrecen los métodos diligenciados. */}
      <Text className="mb-1 text-sm font-bold text-gray-700">
        Datos de pago (transferencias)
      </Text>
      <Text className="mb-3 text-xs text-muted">
        El cliente ve estos datos al pagar por Nequi o Bancolombia. Llena solo
        los que el negocio tenga; si no llenas ninguno, los clientes solo
        podrán pagar en efectivo.
      </Text>
      <TextField
        label="Titular (a nombre de quién transfieren)"
        icon="person-outline"
        format="name"
        value={paymentHolderName}
        onChangeText={bind('paymentHolderName', setPaymentHolderName)}
        error={errors.paymentHolderName}
        placeholder="Juan Pérez"
      />
      <TextField
        label="Número de Nequi"
        icon="phone-portrait-outline"
        format="digits"
        value={nequiNumber}
        onChangeText={bind('nequiNumber', setNequiNumber)}
        error={errors.nequiNumber}
        placeholder="3001234567"
      />
      <TextField
        label="Llave de Nequi"
        icon="key-outline"
        value={nequiKey}
        onChangeText={bind('nequiKey', setNequiKey)}
        error={errors.nequiKey}
        placeholder="@elsabor"
        autoCapitalize="none"
      />
      <TextField
        label="Cuenta Bancolombia"
        icon="business-outline"
        format="nit"
        value={bancolombiaAccount}
        onChangeText={bind('bancolombiaAccount', setBancolombiaAccount)}
        error={errors.bancolombiaAccount}
        placeholder="123-456789-01"
      />
      <DocumentPhotoField
        label={
          pendingQr
            ? 'QR de Bancolombia listo (se sube al guardar)'
            : 'QR de Bancolombia'
        }
        uri={pendingQr ?? editing?.bancolombiaQrUrl}
        onChange={setPendingQr}
        placeholderIcon="qr-code-outline"
      />

      {/* Horario de atención: fuera de él, el cliente ve el negocio "Cerrado"
          y el backend rechaza los pedidos. Sin horas = siempre abierto. */}
      <Text className="mb-1 text-sm font-bold text-gray-700">
        Horario de atención
      </Text>
      <Text className="mb-3 text-xs text-muted">
        Fuera del horario los clientes ven el negocio como &quot;Cerrado&quot; y
        no pueden pedir. Deja las horas sin definir si atiende a toda hora. Si
        cierra después de medianoche, pon la hora tal cual (ej. 18:00 a 02:00).
      </Text>
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Select
            label="Abre a las"
            icon="time-outline"
            options={TIME_OPTIONS}
            value={openTime}
            onSelect={(value) => {
              setOpenTime(String(value));
              clearError('schedule');
            }}
          />
        </View>
        <View className="flex-1">
          <Select
            label="Cierra a las"
            icon="time-outline"
            options={TIME_OPTIONS}
            value={closeTime}
            onSelect={(value) => {
              setCloseTime(String(value));
              clearError('schedule');
            }}
          />
        </View>
      </View>
      {!!errors.schedule && (
        <Text className="mb-3 -mt-2 text-xs text-red-600">
          {errors.schedule}
        </Text>
      )}
      <ChipMultiSelect
        label="Días que abre"
        items={DAY_ITEMS}
        selectedIds={openDaysSel}
        onToggle={(id) =>
          setOpenDaysSel((prev) =>
            prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
          )
        }
      />
      <View className="mb-4">
        <Checkbox
          checked={temporarilyClosed}
          onChange={setTemporarilyClosed}
          label="Cerrado temporalmente (no recibe pedidos)"
        />
      </View>

      <ChipMultiSelect
        label="Etiquetas"
        items={allTags}
        selectedIds={tagIds}
        onToggle={toggleTag}
        emptyMessage="Aún no hay etiquetas creadas (se crean en la sección Etiquetas)."
      />

      {!selfBusiness && (
        <View className="mb-4">
          <Text className="mb-2 text-sm font-bold text-gray-700">
            Comisión sobre lo vendido
          </Text>
          <View className="flex-row gap-2.5">
            <CommissionChip
              label="5% (primer mes)"
              active={commissionOrderRate === 5}
              onPress={() => setCommissionOrderRate(5)}
            />
            <CommissionChip
              label="12% (regular)"
              active={commissionOrderRate === 12}
              onPress={() => setCommissionOrderRate(12)}
            />
          </View>
        </View>
      )}

      {!selfBusiness && (
        <View className="mb-6 mt-1">
          <Checkbox
            checked={isActive}
            onChange={setIsActive}
            label="Negocio activo (visible en la app)"
          />
        </View>
      )}
    </FormModal>
  );
}

function CommissionChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 items-center rounded-full border py-2.5 active:opacity-70 ${
        active ? 'border-primary bg-primary-tint' : 'border-gray-200 bg-white'
      }`}
    >
      <Text
        className={`text-[13px] font-bold ${active ? 'text-primary' : 'text-muted'}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
