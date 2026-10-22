import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Checkbox } from '@/components/ui/checkbox';
import { FilterChipOption, FilterChips } from '@/components/ui/filter-chips';
import { FormModal } from '@/components/ui/form-modal';
import { Paginator } from '@/components/ui/paginator';
import { PhotoActionsSheet } from '@/components/ui/photo-actions-sheet';
import { PhotoEditor } from '@/components/ui/photo-editor';
import { PhotoPreviewModal } from '@/components/ui/photo-preview-modal';
import { SearchBar } from '@/components/ui/search-bar';
import { TextField } from '@/components/ui/text-field';
import { UploadProgressBar } from '@/components/ui/upload-progress-bar';
import { useFormErrors } from '@/hooks/use-form-errors';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';
import { DEFAULT_PRODUCT_IMAGE } from '@/lib/default-images';
import { pickPhoto } from '@/lib/pick-photo';
import { finalPrice, formatPrice } from '@/lib/price';
import { copToNumber, formatText } from '@/lib/text-format';
import { BusinessProduct, businessService } from '@/services/business';
import {
  OwnerPromotion,
  PROMOTION_DURATIONS,
  PromotionPayload,
  promotionsService,
} from '@/services/promotions';

type Props = {
  visible: boolean;
  /** Promoción a editar; null = crear. */
  editing: OwnerPromotion | null;
  onClose: () => void;
  onSaved: () => void;
};

/** "Mantener" la vigencia actual (solo al editar) o renovarla N días desde hoy. */
type DurationChoice = 'keep' | `${(typeof PROMOTION_DURATIONS)[number]}`;

/** Producto elegido: se guarda lo necesario para mostrarlo aunque cambie la página. */
type SelectedItem = {
  name: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
};

const MIN_PRICE = 1000;
/** Productos por página en el buscador del formulario. */
const PRODUCTS_PER_PAGE = 8;
const BANNER_ASPECT = 16 / 9;
const THUMB = 44;

/**
 * Crear/editar una publicidad del negocio: banner 16:9 (encuadrado con el
 * editor de fotos de la app), título, mensaje, productos del catálogo con
 * cantidades (buscador + paginador), precio de la promo y vigencia (1 a 30
 * días desde hoy; al editar se puede mantener o renovar). El banner se sube
 * al guardar.
 */
export function PromotionFormModal({ visible, editing, onClose, onSaved }: Props) {
  const colors = useResolvedAppColors();
  const isEdit = !!editing;
  const { errors, setErrors, clearError, bind, validate, applyServerErrors } =
    useFormErrors();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState<DurationChoice>('7');
  const [isActive, setIsActive] = useState(true);
  /** productId → producto elegido con su cantidad. */
  const [selected, setSelected] = useState<Record<number, SelectedItem>>({});

  // Banner: elegido → editor 16:9 → pendiente de subir.
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [picked, setPicked] = useState<{ uri: string; width: number; height: number } | null>(
    null,
  );
  const [imageMenu, setImageMenu] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  // "Hoy" para el texto de la vigencia (leído una vez, no en cada render).
  const [today] = useState(() => Date.now());
  const [saving, setSaving] = useState(false);
  const [uploadFraction, setUploadFraction] = useState<number | null>(null);

  // Catálogo del negocio: buscador por nombre/código + paginador (solo
  // mientras el formulario está abierto).
  const products = usePaginatedList<BusinessProduct>(
    useCallback(
      (params) =>
        businessService.products.paginated({ ...params, perPage: PRODUCTS_PER_PAGE }),
      [],
    ),
    { enabled: visible },
  );
  const { setSearch } = products;

  // Prellena (edición) o limpia (creación) cada vez que se abre.
  useEffect(() => {
    if (!visible) return;
    setErrors({});
    setTitle(editing?.title ?? '');
    setMessage(editing?.message ?? '');
    setPrice(editing ? formatText('cop', String(Math.round(editing.price))) : '');
    setDuration(editing ? 'keep' : '7');
    setIsActive(editing?.isActive ?? true);
    setSelected(
      Object.fromEntries(
        (editing?.items ?? []).map((i) => [
          i.productId,
          { name: i.name, imageUrl: i.imageUrl, unitPrice: i.unitPrice, quantity: i.quantity },
        ]),
      ),
    );
    setPendingImage(null);
    setSearch('');
  }, [visible, editing, setErrors, setSearch]);

  const selectedEntries = Object.entries(selected).map(
    ([id, item]) => [Number(id), item] as const,
  );

  /** Lo que costarían sueltos los productos elegidos (para mostrar el ahorro). */
  const regularPrice = selectedEntries.reduce(
    (sum, [, item]) => sum + item.unitPrice * item.quantity,
    0,
  );
  const priceValue = copToNumber(price);
  const savings =
    regularPrice > 0 && priceValue > 0 && priceValue < regularPrice
      ? Math.round((1 - priceValue / regularPrice) * 100)
      : 0;

  const durationOptions: FilterChipOption<DurationChoice>[] = [
    ...(isEdit
      ? [{ value: 'keep' as const, label: `Mantener (vence ${shortDate(editing!.endsAt)})` }]
      : []),
    ...PROMOTION_DURATIONS.map((d) => ({
      value: `${d}` as DurationChoice,
      label: d === 1 ? '1 día' : `${d} días`,
    })),
  ];

  function toggleProduct(p: BusinessProduct) {
    clearError('items');
    setSelected((prev) => {
      const next = { ...prev };
      if (next[p.id]) delete next[p.id];
      else
        next[p.id] = {
          name: p.name,
          imageUrl: p.images?.[0] ?? null,
          unitPrice: finalPrice(p.priceSale, p.discount),
          quantity: 1,
        };
      return next;
    });
  }

  function changeQuantity(id: number, delta: number) {
    setSelected((prev) => {
      if (!prev[id]) return prev;
      const quantity = Math.min(20, Math.max(1, prev[id].quantity + delta));
      return { ...prev, [id]: { ...prev[id], quantity } };
    });
  }

  function removeProduct(id: number) {
    setSelected((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function onPicked(uri: string, asset: { width: number; height: number }) {
    setPicked({ uri, width: asset.width, height: asset.height });
  }

  async function handleSave() {
    const items = selectedEntries.map(([productId, item]) => ({
      productId,
      quantity: item.quantity,
    }));
    const ok = validate({
      title: title.trim().length >= 3 ? undefined : 'Escribe un título de al menos 3 caracteres.',
      items: items.length ? undefined : 'Elige al menos un producto de la promoción.',
      price:
        !price.trim() || Number.isNaN(priceValue)
          ? 'Ingresa el precio de la promoción.'
          : priceValue < MIN_PRICE
            ? 'El precio debe ser de mínimo $1.000.'
            : undefined,
      image: editing?.imageUrl || pendingImage ? undefined : 'Sube la imagen de la promoción.',
    });
    if (!ok) return;

    const payload: PromotionPayload = {
      title: title.trim(),
      message: message.trim() || null,
      price: priceValue,
      isActive,
      items,
      ...(duration !== 'keep' && { durationDays: Number(duration) }),
    };

    try {
      setSaving(true);
      const res = isEdit
        ? await promotionsService.update(editing.id, payload)
        : await promotionsService.create({ ...payload, message: payload.message ?? undefined });
      if (pendingImage) {
        setUploadFraction(0);
        await promotionsService.uploadImage(res.data.id, pendingImage, setUploadFraction);
      }
      onSaved();
    } catch (e) {
      applyServerErrors(e);
    } finally {
      setSaving(false);
      setUploadFraction(null);
    }
  }

  const imageUri = pendingImage ?? editing?.imageUrl ?? null;

  return (
    <FormModal
      visible={visible}
      title={isEdit ? 'Editar publicidad' : 'Nueva publicidad'}
      onClose={onClose}
      saveLabel={isEdit ? 'Guardar cambios' : 'Publicar'}
      onSave={handleSave}
      saving={saving}
    >
      {/* Banner 16:9: así se verá en el home. */}
      <Text className="mb-1 text-sm font-bold text-ink">Imagen de la promoción</Text>
      <Text className="mb-2 text-xs text-muted">
        Horizontal, como un banner: al elegirla la encuadras en 16:9.
      </Text>
      <Pressable
        onPress={() => setImageMenu(true)}
        className={`mb-1 w-full items-center justify-center overflow-hidden rounded-2xl border bg-surface active:opacity-80 ${
          imageUri ? '' : 'border-dashed'
        } ${errors.image ? 'border-red-500' : 'border-border'}`}
        style={{ aspectRatio: BANNER_ASPECT }}
      >
        {imageUri ? (
          <>
            <Image
              source={{ uri: imageUri }}
              style={{ width: '100%', height: '100%' }}
              contentFit="contain"
            />
            <View className="absolute bottom-2 right-2 flex-row items-center gap-1 rounded-full bg-black/60 px-2.5 py-1">
              <Ionicons name="camera-outline" size={13} color="#FFFFFF" />
              <Text className="text-[11px] font-bold text-white">Cambiar</Text>
            </View>
          </>
        ) : (
          <>
            <Ionicons name="image-outline" size={30} color={colors.mutedColor} />
            <Text className="mt-1 text-[12px] font-semibold text-muted">Agregar imagen</Text>
          </>
        )}
      </Pressable>
      {!!errors.image && <Text className="mb-2 text-xs text-red-500">{errors.image}</Text>}
      <View className="mb-4" />

      <TextField
        label="Título"
        icon="megaphone-outline"
        format="sentence"
        value={title}
        onChangeText={bind('title', setTitle)}
        error={errors.title}
        placeholder="2x1 en hamburguesas"
        maxLength={80}
      />
      <TextField
        label="Mensaje (opcional)"
        icon="chatbubble-ellipses-outline"
        format="sentence"
        value={message}
        onChangeText={bind('message', setMessage)}
        error={errors.message}
        placeholder="Solo este fin de semana, ¡aprovecha!"
        multiline
        numberOfLines={3}
        maxLength={200}
        showCharCount
      />

      {/* Productos incluidos: elegidos arriba, catálogo con buscador abajo. */}
      <Text className="mb-1 text-sm font-bold text-ink">
        Productos incluidos{selectedEntries.length ? ` (${selectedEntries.length})` : ''}
      </Text>
      <Text className="mb-2 text-xs text-muted">
        Búscalos en tu catálogo y elige cuántos de cada uno trae la promoción.
      </Text>

      {selectedEntries.length > 0 && (
        <View className="mb-3 rounded-2xl border border-border bg-card px-2.5 py-1">
          {selectedEntries.map(([id, item]) => (
            <View key={id} className="flex-row items-center gap-2.5 py-2">
              <ProductThumb uri={item.imageUrl} />
              <View className="flex-1">
                <Text numberOfLines={1} className="text-[14px] font-semibold text-ink">
                  {item.name}
                </Text>
                <Text className="text-[11px] text-muted">
                  {formatPrice(item.unitPrice)} c/u
                </Text>
              </View>
              <View className="flex-row items-center gap-2 rounded-full bg-surface px-1.5 py-1">
                <Pressable
                  onPress={() =>
                    item.quantity > 1 ? changeQuantity(id, -1) : removeProduct(id)
                  }
                  hitSlop={6}
                  className="h-7 w-7 items-center justify-center rounded-full bg-card active:opacity-70"
                >
                  <Ionicons
                    name={item.quantity > 1 ? 'remove' : 'trash-outline'}
                    size={15}
                    color={item.quantity > 1 ? colors.inkColor : '#DC2626'}
                  />
                </Pressable>
                <Text className="min-w-[18px] text-center text-[14px] font-extrabold text-ink">
                  {item.quantity}
                </Text>
                <Pressable
                  onPress={() => changeQuantity(id, 1)}
                  hitSlop={6}
                  className="h-7 w-7 items-center justify-center rounded-full bg-primary active:opacity-70"
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      <View
        className={`mb-1 overflow-hidden rounded-2xl border ${
          errors.items ? 'border-red-500' : 'border-border'
        }`}
      >
        <View className="border-b border-border">
          <SearchBar
            value={products.search}
            onChangeText={products.setSearch}
            placeholder="Buscar por nombre o código…"
          />
        </View>

        {products.loading ? (
          <ActivityIndicator className="my-6" color={colors.primaryColor} />
        ) : products.items.length === 0 ? (
          <Text className="p-4 text-[13px] text-muted">
            {products.query
              ? 'No hay productos que coincidan con la búsqueda.'
              : 'Aún no tienes productos. Créalos en "Productos".'}
          </Text>
        ) : (
          <View className="px-2.5 py-1">
            {products.items.map((p) => {
              const checked = !!selected[p.id];
              return (
                <Pressable
                  key={p.id}
                  onPress={() => toggleProduct(p)}
                  // Inactivos: se ven pero no se pueden elegir (el backend
                  // tampoco los acepta en una promo).
                  disabled={!p.isActive && !checked}
                  className={`flex-row items-center gap-2.5 py-2 active:opacity-70 ${
                    p.isActive ? '' : 'opacity-50'
                  }`}
                >
                  <ProductThumb uri={p.images?.[0] ?? null} />
                  <View className="flex-1">
                    <Text numberOfLines={1} className="text-[14px] text-ink">
                      {p.name}
                    </Text>
                    <Text className="text-[11px] text-muted">
                      {p.isActive
                        ? formatPrice(finalPrice(p.priceSale, p.discount))
                        : 'Inactivo'}
                    </Text>
                  </View>
                  <Ionicons
                    name={checked ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={checked ? colors.primaryColor : colors.mutedColor}
                  />
                </Pressable>
              );
            })}
          </View>
        )}

        <Paginator
          pagination={products.meta}
          disabled={products.loading}
          onPageChange={(page) => products.fetchPage(page, 'page')}
        />
      </View>
      {!!errors.items && <Text className="mb-2 text-xs text-red-500">{errors.items}</Text>}
      <View className="mb-4" />

      <TextField
        label="Precio de la promoción (COP)"
        icon="cash-outline"
        format="cop"
        value={price}
        onChangeText={bind('price', setPrice)}
        error={errors.price}
        placeholder="20.000"
      />
      {regularPrice > 0 && (
        <Text className="-mt-2 mb-4 text-xs text-muted">
          Sueltos costarían {formatPrice(regularPrice)}
          {savings > 0 ? ` · el cliente ahorra ${savings}%` : ''}
        </Text>
      )}

      <Text className="mb-2 text-sm font-bold text-ink">Vigencia</Text>
      <FilterChips options={durationOptions} value={duration} onChange={setDuration} />
      <Text className="mb-4 mt-2 text-xs text-muted">
        {duration === 'keep'
          ? 'La promoción sigue con su fecha de vencimiento actual.'
          : `Se muestra desde hoy hasta el ${shortDate(
              new Date(today + Number(duration) * 86_400_000).toISOString(),
            )}.`}
      </Text>

      <View className="mb-6">
        <Checkbox
          checked={isActive}
          onChange={setIsActive}
          label="Promoción activa (visible para los clientes)"
        />
      </View>

      {uploadFraction != null && (
        <UploadProgressBar fraction={uploadFraction} label="Subiendo imagen…" />
      )}

      <PhotoActionsSheet
        visible={imageMenu}
        label="Imagen de la promoción"
        onView={imageUri ? () => setPreview(imageUri) : undefined}
        onPickLibrary={() => pickPhoto('library', onPicked)}
        onPickCamera={() => pickPhoto('camera', onPicked)}
        onClose={() => setImageMenu(false)}
      />

      <PhotoEditor
        visible={!!picked}
        uri={picked?.uri ?? null}
        width={picked?.width ?? 0}
        height={picked?.height ?? 0}
        aspect={BANNER_ASPECT}
        // El backend la deja en 1280×720.
        maxOutput={1280}
        onCancel={() => setPicked(null)}
        onDone={(uri) => {
          setPicked(null);
          setPendingImage(uri);
          clearError('image');
        }}
      />

      <PhotoPreviewModal uri={preview} onClose={() => setPreview(null)} />
    </FormModal>
  );
}

/** Miniatura del producto (cacheada en disco por expo-image). */
function ProductThumb({ uri }: { uri: string | null }) {
  return (
    <Image
      source={uri ? { uri } : DEFAULT_PRODUCT_IMAGE}
      style={{ width: THUMB, height: THUMB, borderRadius: 10 }}
      contentFit="cover"
      cachePolicy="memory-disk"
      recyclingKey={uri ?? 'default'}
    />
  );
}

/** "28 oct" en la zona del teléfono. */
function shortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  } catch {
    return iso;
  }
}
