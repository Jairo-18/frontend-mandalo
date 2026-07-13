import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { ProductPhotosField } from '@/components/business/product-photos-field';
import { Checkbox } from '@/components/ui/checkbox';
import { FormModal } from '@/components/ui/form-modal';
import { Select, SelectOption } from '@/components/ui/select';
import { TextField } from '@/components/ui/text-field';
import { useFormErrors } from '@/hooks/use-form-errors';
import { copToNumber, formatText } from '@/lib/text-format';
import { adminCategoriesService } from '@/services/admin-catalogs';
import {
  BusinessProduct,
  BusinessProductPayload,
  businessService,
} from '@/services/business';

/** Valor del Select para "sin categoría" (el payload manda null). */
const NO_CATEGORY = 0;

type Props = {
  visible: boolean;
  /** Producto a editar; null = crear. */
  editing: BusinessProduct | null;
  onClose: () => void;
  /** Se guardó bien: la pantalla recarga el listado y cierra el modal. */
  onSaved: () => void;
};

/**
 * Crear/editar un producto del negocio. Las fotos elegidas quedan pendientes
 * y se suben AL GUARDAR (crear primero el producto para tener el id); las
 * marcadas para quitar se eliminan también al guardar. Cancelar no deja
 * huérfanos (mismo patrón que el avatar/logo del panel admin).
 */
export function ProductFormModal({ visible, editing, onClose, onSaved }: Props) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [price, setPrice] = useState('');
  const [discount, setDiscount] = useState('');
  const [categoryTypeId, setCategoryTypeId] = useState<number>(NO_CATEGORY);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Fotos: las guardadas en el backend (menos las marcadas para quitar) +
  // las nuevas pendientes de subir (uris locales del editor).
  const [savedImages, setSavedImages] = useState<string[]>([]);
  const [removedUrls, setRemovedUrls] = useState<string[]>([]);
  const [pendingUris, setPendingUris] = useState<string[]>([]);

  const [categories, setCategories] = useState<SelectOption[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const [saving, setSaving] = useState(false);
  const { errors, setErrors, clearError, validate } = useFormErrors();

  const isEdit = !!editing;

  // Prellena (edición) o limpia (creación) el formulario cada vez que se abre.
  useEffect(() => {
    if (!visible) return;
    setErrors({});
    setName(editing?.name ?? '');
    setCode(editing?.code ?? '');
    // El precio guardado se muestra con puntos de miles ("25.000").
    setPrice(
      editing ? formatText('cop', String(Math.round(editing.priceSale))) : '',
    );
    setDiscount(
      editing && editing.discount > 0 ? String(editing.discount) : '',
    );
    setCategoryTypeId(editing?.categoryTypeId ?? NO_CATEGORY);
    setDescription(editing?.description ?? '');
    setIsActive(editing?.isActive ?? true);
    setSavedImages(editing?.images ?? []);
    setRemovedUrls([]);
    setPendingUris([]);
  }, [visible, editing, setErrors]);

  // Categorías de producto para el Select (una vez por apertura).
  useEffect(() => {
    if (!visible) return;
    let alive = true;
    setLoadingCategories(true);
    adminCategoriesService
      .paginated({ page: 1, perPage: 100 })
      .then((res) => {
        if (!alive) return;
        setCategories(res.data.map((c) => ({ label: c.name, value: c.id })));
      })
      .catch(() => {
        // El interceptor HTTP ya mostró el error; se puede guardar sin categoría.
      })
      .finally(() => {
        if (alive) setLoadingCategories(false);
      });
    return () => {
      alive = false;
    };
  }, [visible]);

  function validateForm() {
    const priceValue = copToNumber(price);
    const discountValue = Number(discount);
    return validate({
      name: name.trim() ? undefined : 'Ingresa el nombre del producto.',
      price:
        !price.trim() || Number.isNaN(priceValue) || priceValue <= 0
          ? 'Ingresa un precio válido.'
          : undefined,
      discount:
        discount.trim() &&
        (Number.isNaN(discountValue) || discountValue < 0 || discountValue > 100)
          ? 'El descuento va de 0 a 100.'
          : undefined,
    });
  }

  async function handleSave() {
    if (!validateForm()) return;

    const payload: BusinessProductPayload = {
      name: name.trim(),
      code: code.trim() || null,
      description: description.trim() || null,
      categoryTypeId: categoryTypeId === NO_CATEGORY ? null : categoryTypeId,
      priceSale: copToNumber(price),
      discount: discount.trim() ? Number(discount) : 0,
      isActive,
    };

    try {
      setSaving(true);

      let productId: number;
      if (isEdit) {
        await businessService.products.update(editing.id, payload);
        productId = editing.id;
      } else {
        const res = await businessService.products.create(payload);
        productId = Number(res.data.rowId);
      }

      // Fotos: primero las quitadas (edición), luego las nuevas en orden.
      for (const url of removedUrls) {
        await businessService.products.removeImage(productId, url);
      }
      for (const uri of pendingUris) {
        await businessService.products.uploadImage(productId, uri);
      }

      onSaved();
    } catch {
      // El interceptor HTTP ya mostró el mensaje del backend.
    } finally {
      setSaving(false);
    }
  }

  const categoryOptions: SelectOption[] = [
    { label: 'Sin categoría', value: NO_CATEGORY },
    ...categories,
  ];

  return (
    <FormModal
      visible={visible}
      title={isEdit ? 'Editar producto' : 'Nuevo producto'}
      onClose={onClose}
      saveLabel={isEdit ? 'Guardar cambios' : 'Crear producto'}
      onSave={handleSave}
      saving={saving}
    >
      <ProductPhotosField
        savedImages={savedImages}
        pendingUris={pendingUris}
        onRemoveSaved={(url) => {
          setSavedImages((p) => p.filter((u) => u !== url));
          setRemovedUrls((p) => [...p, url]);
        }}
        onRemovePending={(uri) =>
          setPendingUris((p) => p.filter((u) => u !== uri))
        }
        onAdded={(uri) => setPendingUris((p) => [...p, uri])}
      />

      <TextField
        label="Nombre"
        icon="cube-outline"
        format="name"
        value={name}
        onChangeText={(v) => {
          setName(v);
          clearError('name');
        }}
        error={errors.name}
        placeholder="Hamburguesa Doble"
      />

      <TextField
        label="Precio de venta (COP)"
        icon="cash-outline"
        format="cop"
        value={price}
        onChangeText={(v) => {
          setPrice(v);
          clearError('price');
        }}
        error={errors.price}
        placeholder="25.000"
      />

      <TextField
        label="Descuento % (opcional)"
        icon="pricetag-outline"
        format="digits"
        value={discount}
        onChangeText={(v) => {
          setDiscount(v);
          clearError('discount');
        }}
        error={errors.discount}
        placeholder="0"
      />

      <Select
        label="Categoría"
        icon="grid-outline"
        options={categoryOptions}
        value={categoryTypeId}
        onSelect={setCategoryTypeId}
        loading={loadingCategories}
      />

      <TextField
        label="Código / SKU (opcional)"
        icon="key-outline"
        autoCapitalize="characters"
        autoCorrect={false}
        value={code}
        onChangeText={setCode}
        placeholder="HAMB-002"
      />

      <TextField
        label="Descripción (opcional)"
        icon="document-text-outline"
        format="sentence"
        value={description}
        onChangeText={setDescription}
        placeholder="Doble carne, queso y tocineta."
        multiline
      />

      <View className="mb-6 mt-1">
        <Checkbox
          checked={isActive}
          onChange={setIsActive}
          label="Producto activo (visible para los clientes)"
        />
      </View>
    </FormModal>
  );
}
