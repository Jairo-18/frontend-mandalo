import { useEffect, useState } from 'react';
import { Text } from 'react-native';

import { IconPicker } from '@/components/admin/icon-picker';
import { FormModal } from '@/components/ui/form-modal';
import { TextField } from '@/components/ui/text-field';
import { useFormErrors } from '@/hooks/use-form-errors';
import {
  CatalogCrudService,
  CatalogItem,
  CatalogItemPayload,
} from '@/services/admin-catalogs';

type Props = {
  visible: boolean;
  /** Servicio del catálogo que edita este modal (categorías o etiquetas). */
  service: CatalogCrudService;
  /** Nombre en singular para los textos ("categoría", "etiqueta"). */
  entityName: string;
  /** Item a editar; null = crear. */
  editing: CatalogItem | null;
  onClose: () => void;
  /** Se guardó bien: la pantalla recarga el listado y cierra el modal. */
  onSaved: () => void;
};

/** Formulario de crear/editar un item de catálogo simple (code/name/icon). */
export function CatalogFormModal({
  visible,
  service,
  entityName,
  editing,
  onClose,
  onSaved,
}: Props) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [saving, setSaving] = useState(false);
  const { errors, setErrors, clearError, validate } = useFormErrors();

  const isEdit = !!editing;

  // Prellena (edición) o limpia (creación) el formulario cada vez que se abre.
  useEffect(() => {
    if (!visible) return;
    setErrors({});
    setCode(editing?.code ?? '');
    setName(editing?.name ?? '');
    setIcon(editing?.icon ?? '');
  }, [visible, editing, setErrors]);

  /** "Comidas Rápidas" → "COMIDAS_RAPIDAS" (cuando no digitan el código). */
  function codeFromName(value: string): string {
    return Array.from(value.normalize('NFD'))
      .filter((ch) => {
        const chCode = ch.charCodeAt(0);
        return chCode < 0x0300 || chCode > 0x036f;
      })
      .join('')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  async function handleSave() {
    const ok = validate({
      name: name.trim() ? undefined : 'Ingresa el nombre.',
    });
    if (!ok) return;

    const payload: CatalogItemPayload = {
      // El código es opcional: sin digitar, se genera del nombre.
      code: code.trim() ? code.trim().toUpperCase() : codeFromName(name),
      name: name.trim(),
      icon: icon || null,
    };

    try {
      setSaving(true);
      if (isEdit) {
        await service.update(editing.id, payload);
      } else {
        await service.create(payload);
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
      title={isEdit ? `Editar ${entityName}` : `Nueva ${entityName}`}
      onClose={onClose}
      saveLabel={isEdit ? 'Guardar cambios' : `Crear ${entityName}`}
      onSave={handleSave}
      saving={saving}
    >
      <TextField
        label="Nombre"
        icon="text-outline"
        format="name"
        value={name}
        onChangeText={(v) => {
          setName(v);
          clearError('name');
        }}
        error={errors.name}
        placeholder="Comidas rápidas"
      />

      <TextField
        label="Código (opcional — se genera del nombre)"
        icon="key-outline"
        autoCapitalize="characters"
        autoCorrect={false}
        value={code}
        onChangeText={(v) => {
          setCode(v.toUpperCase().replace(/\s+/g, '_'));
          clearError('code');
        }}
        error={errors.code}
        placeholder="COMIDA_RAPIDA"
      />

      {/* Selector de icono: buscador + grilla; tocar de nuevo deselecciona */}
      <Text className="mb-2 text-sm font-bold text-gray-700">
        Icono (opcional)
      </Text>
      <IconPicker value={icon} onChange={setIcon} savedIcon={editing?.icon} />
    </FormModal>
  );
}
