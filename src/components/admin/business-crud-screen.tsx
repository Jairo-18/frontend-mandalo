import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BusinessFormModal } from '@/components/admin/business-form-modal';
import { BusinessProductsModal } from '@/components/admin/business-products-modal';
import { BusinessPromotionsModal } from '@/components/admin/business-promotions-modal';
import { ReviewsSheet } from '@/components/reviews/reviews-list';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Fab } from '@/components/ui/fab';
import { FilterChips, FilterChipOption } from '@/components/ui/filter-chips';
import { ListEmpty } from '@/components/ui/list-empty';
import { Paginator } from '@/components/ui/paginator';
import { SearchBar } from '@/components/ui/search-bar';
import { Select } from '@/components/ui/select';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { YesNoDialog } from '@/components/ui/yes-no-dialog';
import { useAppData } from '@/context/app-data';
import { useAppTheme } from '@/context/app-theme';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { getAppColors } from '@/lib/app-colors';
import { DEFAULT_BUSINESS_LOGO } from '@/lib/default-images';
import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';
import { reviewsService } from '@/services/reviews';

import {
  AdminBusiness,
  adminBusinessesService,
  BusinessSearchField,
} from '@/services/admin-businesses';

/** Campos por los que puede buscar el admin. */
const SEARCH_FIELDS: FilterChipOption<BusinessSearchField>[] = [
  { value: 'search', label: 'Todos' },
  { value: 'businessName', label: 'Nombre del negocio' },
  { value: 'legalPersonName', label: 'Representante legal' },
  { value: 'identificationNumber', label: 'NIT / identificación' },
  { value: 'legalName', label: 'Razón social' },
];

/** Texto del buscador según el campo elegido. */
const SEARCH_PLACEHOLDER: Record<BusinessSearchField, string> = {
  search: 'Buscar por negocio, representante o NIT…',
  businessName: 'Nombre comercial o razón social…',
  legalPersonName: 'Nombre del representante legal…',
  identificationNumber: 'NIT del negocio o cédula del representante…',
  legalName: 'Razón social…',
};

/** Valor del select de tipo que significa "sin filtro". */
const ALL_TYPES = 0;

/**
 * CRUD de negocios para el panel admin: listado paginado con búsqueda por
 * campo (razón social / NIT), filtro por tipo de identificación, crear/editar
 * en modal y eliminar con confirmación.
 */
export function BusinessCrudScreen() {
  const colors = useResolvedAppColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isDark } = useAppTheme();
  const { identificationTypes } = useAppData();

  const [searchField, setSearchField] = useState<BusinessSearchField>('search');
  // El campo se lee por ref: cambiar de chip con el buscador VACÍO no debe
  // volver a pedir la lista (el resultado es el mismo); con texto sí recarga.
  const searchFieldRef = useRef<BusinessSearchField>('search');
  const [identificationTypeId, setIdentificationTypeId] = useState(ALL_TYPES);

  const list = usePaginatedList<AdminBusiness>(
    useCallback(
      (params) =>
        adminBusinessesService.paginated({
          ...params,
          searchField: searchFieldRef.current,
          ...(identificationTypeId !== ALL_TYPES && { identificationTypeId }),
        }),
      [identificationTypeId],
    ),
  );

  function changeSearchField(field: BusinessSearchField) {
    setSearchField(field);
    searchFieldRef.current = field;
    if (list.query.trim()) list.fetchPage(1, 'initial');
  }

  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<AdminBusiness | null>(null);
  const [toDelete, setToDelete] = useState<AdminBusiness | null>(null);

  const identificationTypeOptions = useMemo(
    () => [
      { label: 'Todos los tipos', value: ALL_TYPES },
      ...identificationTypes.map((t) => ({ label: t.name, value: t.id })),
    ],
    [identificationTypes],
  );

  // Productos / reseñas de un negocio (revisar, editar, moderar).
  const [productsOf, setProductsOf] = useState<{ id: number; name: string } | null>(null);
  const [reviewsOf, setReviewsOf] = useState<{ id: number; name: string } | null>(null);
  const [promotionsOf, setPromotionsOf] = useState<{ id: number; name: string } | null>(null);
  // Solo si se borró alguna reseña hay que refrescar el conteo de la tarjeta:
  // cerrar la hoja sin cambios no debe volver a pedir la lista.
  const [reviewsChanged, setReviewsChanged] = useState(false);

  function openCreate() {
    setEditing(null);
    setFormVisible(true);
  }

  function openEdit(item: AdminBusiness) {
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
      await adminBusinessesService.remove(toDelete.id);
      list.reload();
    } catch {
      // El interceptor HTTP ya mostró el error.
    } finally {
      setToDelete(null);
    }
  }

  function renderItem({ item }: { item: AdminBusiness }) {
    const displayName = item.tradeName || item.legalName;
    const location = [item.municipality?.name, item.department?.name]
      .filter(Boolean)
      .join(', ');

    return (
      <View className="mb-3 rounded-2xl bg-card p-4">
        <View className="flex-row items-center gap-3">
          <Avatar
            uri={item.logoUrl}
            fallbackSource={DEFAULT_BUSINESS_LOGO}
            label={displayName}
          />

          <View className="flex-1">
            <Text numberOfLines={1} className="text-[15px] font-bold text-ink">
              {displayName}
            </Text>
            {item.tradeName && (
              <Text numberOfLines={1} className="text-xs text-muted">
                {item.legalName}
              </Text>
            )}
            {(item.identificationNumber || item.phone || location) && (
              <Text numberOfLines={1} className="text-xs text-muted">
                {[
                  item.identificationNumber &&
                    `${item.identificationType?.code ?? 'NIT'} ${item.identificationNumber}`,
                  item.phone,
                  location,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            )}
            {item.legalPerson && (
              <Text numberOfLines={1} className="text-xs text-muted">
                Dueño: {item.legalPerson.fullName}
              </Text>
            )}
          </View>

          {/* Facturación: cuánto vendió y cuánto le debe a la plataforma. */}
          <Pressable
            onPress={() =>
              router.navigate({
                pathname: '/admin/billing',
                params: { orgId: String(item.id), name: displayName },
              })
            }
            hitSlop={8}
            className="h-9 w-9 items-center justify-center rounded-full bg-primary-tint active:opacity-70"
          >
            <Ionicons name="cash-outline" size={17} color={colors.primaryColor} />
          </Pressable>
          <Pressable
            onPress={() => openEdit(item)}
            hitSlop={8}
            className="h-9 w-9 items-center justify-center rounded-full bg-surface active:opacity-70"
          >
            <Ionicons name="pencil-outline" size={17} color={colors.inkColor} />
          </Pressable>
          <Pressable
            onPress={() => setToDelete(item)}
            hitSlop={8}
            className="h-9 w-9 items-center justify-center rounded-full bg-red-50 active:opacity-70"
          >
            <Ionicons name="trash-outline" size={17} color="#DC2626" />
          </Pressable>
        </View>

        <View className="mt-3 flex-row flex-wrap gap-1.5">
          <Badge
            label={item.isActive ? 'Activo' : 'Inactivo'}
            tone={item.isActive ? 'green' : 'gray'}
          />
          {item.tags.map((tag) => (
            <Badge key={tag.id} label={tag.name} tone="primary" />
          ))}
        </View>

        {/* Revisar el catálogo y moderar las reseñas del negocio. */}
        <View className="mt-3 flex-row gap-2">
          <Pressable
            onPress={() => setProductsOf({ id: item.id, name: displayName })}
            className="h-9 flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-surface active:opacity-70"
          >
            <Ionicons name="cube-outline" size={15} color={colors.inkColor} />
            <Text className="text-[13px] font-bold text-ink">Productos</Text>
          </Pressable>
          <Pressable
            onPress={() => setReviewsOf({ id: item.id, name: displayName })}
            className="h-9 flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-surface active:opacity-70"
          >
            <Ionicons name="star-outline" size={15} color={colors.inkColor} />
            <Text className="text-[13px] font-bold text-ink">
              Reseñas{item.ratingCount ? ` (${item.ratingCount})` : ''}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setPromotionsOf({ id: item.id, name: displayName })}
            className="h-9 flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-surface active:opacity-70"
          >
            <Ionicons name="megaphone-outline" size={15} color={colors.inkColor} />
            <Text className="text-[13px] font-bold text-ink">Publicidad</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Búsqueda por campo + filtro por tipo + contador */}
      <View className="px-4 pb-1 pt-3">
        <View className="flex-row items-center gap-2.5">
          <View className="flex-1">
            <SearchBar
              value={list.search}
              onChangeText={list.setSearch}
              placeholder={SEARCH_PLACEHOLDER[searchField]}
            />
          </View>
          <ThemeToggle />
        </View>

        <View className="mt-2">
          <FilterChips
            options={SEARCH_FIELDS}
            value={searchField}
            onChange={changeSearchField}
          />
        </View>

        <View className="mt-2 -mb-3">
          <Select
            label="Tipo de identificación"
            icon="card-outline"
            options={identificationTypeOptions}
            value={identificationTypeId}
            onSelect={setIdentificationTypeId}
          />
        </View>

        {!list.loading && list.meta && (
          <Text className="mt-1.5 text-xs font-medium text-muted">
            {list.meta.total} {list.meta.total === 1 ? 'negocio' : 'negocios'}
          </Text>
        )}
      </View>

      {list.loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primaryColor} />
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
              icon="storefront-outline"
              message={
                list.query || identificationTypeId !== ALL_TYPES
                  ? 'No hay negocios que coincidan con los filtros.'
                  : 'Aún no hay negocios registrados.'
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

      <BusinessProductsModal business={productsOf} onClose={() => setProductsOf(null)} />

      <BusinessPromotionsModal
        key={promotionsOf?.id ?? 'none'}
        business={promotionsOf}
        onClose={() => setPromotionsOf(null)}
      />

      <ReviewsSheet
        visible={!!reviewsOf}
        title={`Reseñas de ${reviewsOf?.name ?? ''}`}
        fetchPage={(page) =>
          reviewsOf ? reviewsService.forBusiness(reviewsOf.id, page) : Promise.reject(new Error('sin negocio'))
        }
        onDelete={async (review) => {
          await reviewsService.remove(review.id);
          setReviewsChanged(true);
        }}
        onClose={() => {
          setReviewsOf(null);
          if (reviewsChanged) {
            setReviewsChanged(false);
            list.fetchPage(list.meta?.page ?? 1, 'refresh');
          }
        }}
      />

      <BusinessFormModal
        visible={formVisible}
        editing={editing}
        onClose={() => setFormVisible(false)}
        onSaved={handleSaved}
      />

      <YesNoDialog
        visible={!!toDelete}
        destructive
        title="¿Eliminar negocio?"
        message={`Se eliminará "${
          toDelete ? toDelete.tradeName || toDelete.legalName : ''
        }" junto con sus productos. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </View>
  );
}
