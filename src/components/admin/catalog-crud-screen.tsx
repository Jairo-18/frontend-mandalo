import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CatalogFormModal } from '@/components/admin/catalog-form-modal';
import { Fab } from '@/components/ui/fab';
import { ListEmpty } from '@/components/ui/list-empty';
import { Paginator } from '@/components/ui/paginator';
import { SearchBar } from '@/components/ui/search-bar';
import { YesNoDialog } from '@/components/ui/yes-no-dialog';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { CatalogCrudService, CatalogItem } from '@/services/admin-catalogs';

type Props = {
  /** Servicio del catálogo que lista/edita esta pantalla. */
  service: CatalogCrudService;
  /** Nombre en singular para los textos ("categoría", "etiqueta"). */
  entityName: string;
  /** Nombre en plural para el contador ("categorías", "etiquetas"). */
  entityNamePlural: string;
  /** Icono de respaldo cuando el item no tiene icono propio. */
  fallbackIcon: keyof typeof Ionicons.glyphMap;
};

/**
 * CRUD de catálogos simples (code/name/icon) para el panel admin. Se
 * reutiliza para Categorías y Etiquetas.
 */
export function CatalogCrudScreen({
  service,
  entityName,
  entityNamePlural,
  fallbackIcon,
}: Props) {
  const insets = useSafeAreaInsets();

  const list = usePaginatedList<CatalogItem>(
    useCallback(
      (params) => service.paginated(params),
      [service],
    ),
  );

  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [toDelete, setToDelete] = useState<CatalogItem | null>(null);

  function openCreate() {
    setEditing(null);
    setFormVisible(true);
  }

  function openEdit(item: CatalogItem) {
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
      await service.remove(toDelete.id);
      list.reload();
    } catch {
      // El interceptor HTTP ya mostró el error.
    } finally {
      setToDelete(null);
    }
  }

  function renderItem({ item }: { item: CatalogItem }) {
    const iconName =
      item.icon && item.icon in Ionicons.glyphMap
        ? (item.icon as keyof typeof Ionicons.glyphMap)
        : fallbackIcon;

    return (
      <View className="mb-3 flex-row items-center gap-3 rounded-2xl bg-white p-4">
        <View className="h-11 w-11 items-center justify-center rounded-full bg-primary-tint">
          <Ionicons name={iconName} size={20} color="#FF5A3C" />
        </View>

        <View className="flex-1">
          <Text numberOfLines={1} className="text-[15px] font-bold text-dark">
            {item.name}
          </Text>
          <Text numberOfLines={1} className="text-xs text-muted">
            {item.code}
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
          placeholder={`Buscar ${entityNamePlural}…`}
        />
        {!list.loading && list.meta && (
          <Text className="mt-2 text-xs font-medium text-muted">
            {list.meta.total}{' '}
            {list.meta.total === 1 ? entityName : entityNamePlural}
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
              icon={fallbackIcon}
              message={
                list.query
                  ? `No hay ${entityNamePlural} que coincidan con la búsqueda.`
                  : `Aún no hay ${entityNamePlural} creadas.`
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

      <CatalogFormModal
        visible={formVisible}
        service={service}
        entityName={entityName}
        editing={editing}
        onClose={() => setFormVisible(false)}
        onSaved={handleSaved}
      />

      <YesNoDialog
        visible={!!toDelete}
        destructive
        title={`¿Eliminar ${entityName}?`}
        message={`Se eliminará "${toDelete?.name}". Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </View>
  );
}
