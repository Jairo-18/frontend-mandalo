import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProductFormModal } from '@/components/business/product-form-modal';
import { Avatar } from '@/components/ui/avatar';
import { Fab } from '@/components/ui/fab';
import { ListEmpty } from '@/components/ui/list-empty';
import { Paginator } from '@/components/ui/paginator';
import { SearchBar } from '@/components/ui/search-bar';
import { YesNoDialog } from '@/components/ui/yes-no-dialog';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { BusinessProduct, businessService } from '@/services/business';

/** Precio en pesos colombianos ("$ 25.000"). */
export function formatPrice(value: number): string {
  return `$ ${Math.round(value).toLocaleString('es-CO')}`;
}

/**
 * CRUD de productos del negocio autenticado (el backend limita todo al
 * negocio del JWT): listado con búsqueda por nombre/código, crear/editar en
 * modal con fotos y eliminar con confirmación.
 */
export function ProductCrudScreen() {
  const insets = useSafeAreaInsets();

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

  function renderItem({ item }: { item: BusinessProduct }) {
    const hasDiscount = item.discount > 0;
    const finalPrice = hasDiscount
      ? item.priceSale * (1 - item.discount / 100)
      : item.priceSale;

    return (
      <View className="mb-3 flex-row items-center gap-3 rounded-2xl bg-white p-3.5">
        <Avatar
          uri={item.images?.[0]}
          icon="cube-outline"
          size={56}
          shape="rounded"
        />

        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text
              numberOfLines={1}
              className="flex-shrink text-[15px] font-bold text-dark"
            >
              {item.name}
            </Text>
            {!item.isActive && (
              <View className="rounded-full bg-gray-100 px-2 py-0.5">
                <Text className="text-[10px] font-bold uppercase text-muted">
                  Inactivo
                </Text>
              </View>
            )}
          </View>

          <View className="mt-0.5 flex-row items-center gap-2">
            <Text className="text-sm font-extrabold text-primary">
              {formatPrice(finalPrice)}
            </Text>
            {hasDiscount && (
              <>
                <Text className="text-xs text-muted line-through">
                  {formatPrice(item.priceSale)}
                </Text>
                <View className="rounded-full bg-primary-tint px-1.5 py-0.5">
                  <Text className="text-[10px] font-bold text-primary">
                    -{item.discount}%
                  </Text>
                </View>
              </>
            )}
          </View>

          <Text numberOfLines={1} className="mt-0.5 text-xs text-muted">
            {[item.categoryType?.name, item.code].filter(Boolean).join(' · ') ||
              'Sin categoría'}
          </Text>
        </View>

        <Pressable
          onPress={() => openEdit(item)}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full bg-surface active:opacity-70"
        >
          <Ionicons name="pencil-outline" size={17} color="#1E1E2D" />
        </Pressable>
        <Pressable
          onPress={() => setToDelete(item)}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full bg-red-50 active:opacity-70"
        >
          <Ionicons name="trash-outline" size={17} color="#DC2626" />
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Búsqueda + contador */}
      <View className="px-4 pb-1 pt-3">
        <SearchBar
          value={list.search}
          onChangeText={list.setSearch}
          placeholder="Buscar por nombre o código…"
        />
        {!list.loading && list.meta && (
          <Text className="mt-2 text-xs font-medium text-muted">
            {list.meta.total} {list.meta.total === 1 ? 'producto' : 'productos'}
          </Text>
        )}
      </View>

      {list.loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF5A3C" />
        </View>
      ) : (
        <FlatList
          data={list.items}
          keyExtractor={(item) => String(item.id)}
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
      <View style={{ paddingBottom: insets.bottom }} className="bg-white">
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
