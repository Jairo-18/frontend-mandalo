import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { OwnerField } from '@/components/admin/owner-field';
import { Checkbox } from '@/components/ui/checkbox';
import { ChipMultiSelect } from '@/components/ui/chip-multi-select';
import { FormModal } from '@/components/ui/form-modal';
import { PhotoField } from '@/components/ui/photo-field';
import { Select } from '@/components/ui/select';
import { TextField } from '@/components/ui/text-field';
import { useAppData } from '@/context/app-data';
import { useFormErrors } from '@/hooks/use-form-errors';
import { useMunicipalities } from '@/hooks/use-municipalities';
import { EMAIL_RE } from '@/lib/text-format';
import {
  AdminBusiness,
  AdminBusinessPayload,
  adminBusinessesService,
  BusinessOwner,
} from '@/services/admin-businesses';
import { adminTagsService, CatalogItem } from '@/services/admin-catalogs';
import { businessService } from '@/services/business';

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
  // Dueño/representante: usuario existente elegido con el buscador…
  const [owner, setOwner] = useState<BusinessOwner | null>(null);
  // …o cuenta nueva del negocio (correo + contraseña, solo al crear).
  const [accountEmail, setAccountEmail] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [accountConfirm, setAccountConfirm] = useState('');

  const [tagIds, setTagIds] = useState<number[]>([]);
  const [isActive, setIsActive] = useState(true);
  // Logo recortado por el PhotoEditor pendiente de subir (se sube al guardar).
  const [pendingLogo, setPendingLogo] = useState<string | null>(null);

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
    setLegalName(editing?.legalName ?? '');
    setTradeName(editing?.tradeName ?? '');
    setIdentificationNumber(editing?.identificationNumber ?? '');
    setIdentificationTypeId(
      editing?.identificationType
        ? Number(editing.identificationType.id)
        : undefined,
    );
    setDescription(editing?.description ?? '');
    setPhone(editing?.phone ?? '');
    setAddress(editing?.address ?? '');
    setOwner(editing?.legalPerson ?? null);
    setAccountEmail('');
    setAccountPassword('');
    setAccountConfirm('');
    setTagIds(editing?.tags?.map((t) => t.id) ?? []);
    setIsActive(editing?.isActive ?? true);

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

  function validateForm() {
    return validate({
      legalName: legalName.trim() ? undefined : 'Ingresa la razón social.',
      identificationTypeId:
        identificationNumber.trim() && !identificationTypeId
          ? 'Selecciona el tipo.'
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
      legalName: legalName.trim(),
      tradeName: tradeName.trim() || null,
      identificationNumber: identificationNumber.trim() || null,
      description: description.trim() || null,
      phone: phone.trim() || null,
      address: address.trim() || null,
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
      ...(selfBusiness ? {} : { isActive }),
    };

    try {
      setSaving(true);
      if (selfBusiness) {
        // Panel del negocio: el backend resuelve el id desde el JWT.
        await businessService.updateMine(payload);
        if (pendingLogo) await businessService.uploadMyLogo(pendingLogo);
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
      // El logo se sube después de guardar (al crear recién existe el id).
      if (pendingLogo && businessId) {
        await adminBusinessesService.uploadLogo(businessId, pendingLogo);
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
        value={legalName}
        onChangeText={bind('legalName', setLegalName)}
        error={errors.legalName}
        placeholder="Inversiones El Sabor S.A.S."
      />

      <TextField
        label="Nombre comercial (el que ve el cliente)"
        icon="storefront-outline"
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
        autoCapitalize="none"
        autoCorrect={false}
        value={identificationNumber}
        onChangeText={bind('identificationNumber', setIdentificationNumber)}
        error={errors.identificationNumber}
        placeholder="901234567-8"
      />

      <TextField
        label="Descripción"
        icon="document-text-outline"
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
        format="digits"
        value={phone}
        onChangeText={bind('phone', setPhone)}
        error={errors.phone}
        placeholder="3001234567"
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
        value={address}
        onChangeText={bind('address', setAddress)}
        error={errors.address}
        placeholder="Cra 5 # 10-23, Centro"
      />

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

      <ChipMultiSelect
        label="Etiquetas"
        items={allTags}
        selectedIds={tagIds}
        onToggle={toggleTag}
        emptyMessage="Aún no hay etiquetas creadas (se crean en la sección Etiquetas)."
      />

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
