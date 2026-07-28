import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProductFormModal } from '@/components/business/product-form-modal';
import { Fab } from '@/components/ui/fab';
import { ListEmpty } from '@/components/ui/list-empty';
import { Paginator } from '@/components/ui/paginator';
import { SearchBar } from '@/components/ui/search-bar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { YesNoDialog } from '@/components/ui/yes-no-dialog';
import { useAppTheme } from '@/context/app-theme';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { gridItemStyle } from '@/lib/grid-style';
import { finalPrice, formatPrice } from '@/lib/price';
import { BusinessProduct, businessService } from '@/services/business';
import { getAppColors } from '@/lib/app-colors';
import { DEFAULT_PRODUCT_IMAGE } from '@/lib/default-images';


/**
 * CRUD de productos del negocio autenticado (el backend limita todo al
 * negocio del JWT): listado con búsqueda por nombre/código, crear/editar en
 * modal con fotos y eliminar con confirmación.
 */
export function ProductCrudScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();

  const list = usePaginatedList<BusinessProduct>(
    useCallback((params) => businessService.products.paginated(params), []),
  );

  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<BusinessProduct | null>(null);
  const [toDelete, setToDelete] = useState<BusinessProduct | null>(null);

  function openCreate() {
    setEditing(null);
    setFormVisible(true);
  }

  function openEdit(item: BusinessProduct) {
    setEditing(item);
    setFormVisible(true);
  }

  function handleSaved() {
    setFormVisible(false);
    list.reload();
  }

  async function handleDelete() {
    if (!toDelete) return;
    try {
      await businessService.products.remove(toDelete.id);
      list.reload();
    } catch {
      // El interceptor HTTP ya mostró el error.
    } finally {
      setToDelete(null);
    }
  }

  function renderItem({
    item,
    index,
  }: {
    item: BusinessProduct;
    index: number;
  }) {
    const hasDiscount = item.discount > 0;
    const price = finalPrice(item.priceSale, item.discount);
    const img = item.images?.[0];

    return (
      <View style={gridItemStyle(index, list.items.length)}>
        <Pressable
          onPress={() => openEdit(item)}
          className="mb-3 overflow-hidden rounded-2xl bg-card active:opacity-80"
        >
          <View className="w-full bg-surface" style={{ aspectRatio: 1 }}>
            <Image
              source={img ? { uri: img } : DEFAULT_PRODUCT_IMAGE}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />

            {hasDiscount && (
              <View className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5">
                <Text className="text-[11px] font-extrabold text-white">
                  -{item.discount}%
                </Text>
              </View>
            )}
            {!item.isActive && (
              <View className="absolute right-2 top-2 rounded-full bg-dark px-2 py-0.5">
                <Text className="text-[10px] font-bold uppercase text-white">
                  Inactivo
                </Text>
              </View>
            )}

            {/* Acciones (editar / eliminar) sobre la foto. */}
            <View className="absolute bottom-2 right-2 flex-row gap-1.5">
              <Pressable
                onPress={() => openEdit(item)}
                hitSlop={6}
                className="h-8 w-8 items-center justify-center rounded-full bg-card shadow active:opacity-70"
              >
                <Ionicons name="pencil-outline" size={15} color={getAppColors().inkColor} />
              </Pressable>
              <Pressable
                onPress={() => setToDelete(item)}
                hitSlop={6}
                className="h-8 w-8 items-center justify-center rounded-full bg-card shadow active:opacity-70"
              >
                <Ionicons name="trash-outline" size={15} color="#DC2626" />
              </Pressable>
            </View>
          </View>

          <View className="p-2.5">
            <Text
              numberOfLines={2}
              className="min-h-[36px] text-[13px] font-bold text-ink"
            >
              {item.name}
            </Text>
            <View className="mt-1 flex-row items-center gap-1.5">
              <Text className="text-[15px] font-extrabold text-primary">
                {formatPrice(price)}
              </Text>
              {hasDiscount && (
                <Text className="text-[11px] text-muted line-through">
                  {formatPrice(item.priceSale)}
                </Text>
              )}
            </View>
            <Text numberOfLines={1} className="mt-0.5 text-[11px] text-muted">
              {[item.categoryType?.name, item.code].filter(Boolean).join(' · ') ||
                'Sin categoría'}
            </Text>
          </View>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Búsqueda + contador */}
      <View className="px-4 pb-1 pt-3">
        <View className="flex-row items-center gap-2.5">
          <View className="flex-1">
            <SearchBar
              value={list.search}
              onChangeText={list.setSearch}
              placeholder="Buscar por nombre o código…"
            />
          </View>
          <ThemeToggle />
        </View>
        {!list.loading && list.meta && (
          <Text className="mt-2 text-xs font-medium text-muted">
            {list.meta.total} {list.meta.total === 1 ? 'producto' : 'productos'}
          </Text>
        )}
      </View>

      {list.loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={getAppColors().primaryColor} />
        </View>
      ) : (
        <FlatList
          data={list.items}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 96,
          }}
          refreshing={list.refreshing}
          onRefresh={() => list.fetchPage(list.meta?.page ?? 1, 'refresh')}
          ListEmptyComponent={
            <ListEmpty
              icon="cube-outline"
              message={
                list.query
                  ? 'No hay productos que coincidan con la búsqueda.'
                  : 'Aún no tienes productos. Crea el primero con el botón +.'
              }
            />
          }
        />
      )}

      {/* Paginador */}
      <View style={{ paddingBottom: insets.bottom }} className="bg-card">
        <Paginator
          pagination={list.meta}
          disabled={list.loading || list.refreshing}
          onPageChange={(page) => list.fetchPage(page, 'page')}
          onPerPageChange={list.setPerPage}
        />
      </View>

      <Fab onPress={openCreate} />

      <ProductFormModal
        visible={formVisible}
        editing={editing}
        onClose={() => setFormVisible(false)}
        onSaved={handleSaved}
      />

      <YesNoDialog
        visible={!!toDelete}
        destructive
        title="¿Eliminar producto?"
        message={`Se eliminará "${toDelete?.name}" con sus fotos. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </View>
  );
}
