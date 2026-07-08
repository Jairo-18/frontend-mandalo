import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { FormModal } from '@/components/ui/form-modal';
import { TextField } from '@/components/ui/text-field';
import { useFormErrors } from '@/hooks/use-form-errors';
import {
  CatalogCrudService,
  CatalogItem,
  CatalogItemPayload,
} from '@/services/admin-catalogs';

type IconName = keyof typeof Ionicons.glyphMap;

/**
 * Iconos que puede elegir el admin (Ionicons, los mismos de toda la app).
 * Curados para categorías de producto y etiquetas de negocio; el nombre es lo
 * que se guarda en `icon` en el backend.
 */
const ICON_CHOICES: IconName[] = [
  // Comida y comercio
  'fast-food-outline',
  'restaurant-outline',
  'pizza-outline',
  'cafe-outline',
  'ice-cream-outline',
  'fish-outline',
  'nutrition-outline',
  'beer-outline',
  'wine-outline',
  'basket-outline',
  'cart-outline',
  'storefront-outline',
  'bag-handle-outline',
  // Salud y bienestar
  'medkit-outline',
  'bandage-outline',
  'fitness-outline',
  'heart-outline',
  // Servicios y tiendas
  'cut-outline',
  'paw-outline',
  'flower-outline',
  'gift-outline',
  'shirt-outline',
  'construct-outline',
  'hammer-outline',
  'book-outline',
  'school-outline',
  'game-controller-outline',
  'musical-notes-outline',
  'tv-outline',
  'phone-portrait-outline',
  'car-outline',
  'bicycle-outline',
  'home-outline',
  'key-outline',
  'water-outline',
  'flash-outline',
  // Etiquetas / distintivos
  'leaf-outline',
  'time-outline',
  'moon-outline',
  'sparkles-outline',
  'star-outline',
  'ribbon-outline',
  'pricetag-outline',
  'cash-outline',
];

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

  // Si el item editado trae un icono que no está en la lista curada (p. ej.
  // digitado a mano en la DB), se antepone para que siga visible y elegible.
  const iconChoices = useMemo(() => {
    const saved = editing?.icon;
    if (saved && saved in Ionicons.glyphMap && !ICON_CHOICES.includes(saved as IconName)) {
      return [saved as IconName, ...ICON_CHOICES];
    }
    return ICON_CHOICES;
  }, [editing]);

  async function handleSave() {
    const ok = validate({
      name: name.trim() ? undefined : 'Ingresa el nombre.',
      code: code.trim() ? undefined : 'Ingresa el código.',
    });
    if (!ok) return;

    const payload: CatalogItemPayload = {
      code: code.trim().toUpperCase(),
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
        label="Código"
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

      {/* Selector de icono: toca para elegir, toca de nuevo para quitar */}
      <Text className="mb-2 text-sm font-bold text-gray-700">
        Icono (opcional)
      </Text>
      <View className="mb-6 flex-row flex-wrap gap-2">
        {iconChoices.map((name) => {
          const selected = icon === name;
          return (
            <Pressable
              key={name}
              onPress={() => setIcon(selected ? '' : name)}
              className={`h-12 w-12 items-center justify-center rounded-xl border ${
                selected
                  ? 'border-primary bg-primary-tint'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <Ionicons
                name={name}
                size={22}
                color={selected ? '#FF5A3C' : '#7A7A8A'}
              />
            </Pressable>
          );
        })}
      </View>
    </FormModal>
  );
}
