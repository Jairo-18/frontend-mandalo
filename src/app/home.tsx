import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddressSheet } from '@/components/client/address-sheet';
import { BusinessCard } from '@/components/client/business-card';
import { CategoryCards } from '@/components/client/category-cards';
import { ProductCard } from '@/components/client/product-card';
import { TagCards } from '@/components/client/tag-cards';
import { ListEmpty } from '@/components/ui/list-empty';
import { SearchBar } from '@/components/ui/search-bar';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { useExploreFilters, useUserAddresses } from '@/hooks/use-user-data';
import { getSession } from '@/lib/session';
import { signOutEverywhere } from '@/lib/sign-out';
import {
  ExploreBusiness,
  ExploreProduct,
  exploreService,
} from '@/services/explore';

/**
 * Home del cliente (rol USER). Todo scrollea junto:
 * - Buscador global de productos.
 * - Sección "Negocios": chips de etiquetas (Restaurante, Ferretería…) —
 *   elegir una (o "Todos") muestra el feed de NEGOCIOS.
 * - Sección "Categorías": cards cuadradas en slider (Aseo, Comida, Licores…)
 *   — elegir una filtra el feed global de PRODUCTOS.
 * - Feed: por defecto todos los productos (con el negocio que los vende);
 *   con texto/categoría, los resultados; con tag/"Todos", los negocios.
 * Las selecciones se excluyen entre sí (elegir tag limpia búsqueda/categoría
 * y viceversa) para que el feed nunca sea ambiguo.
 */
export default function HomeScreen() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  // Caché compartida (lib/user-data): nada de refetch en cada montada.
  const { defaultAddress, loading: loadingAddress } = useUserAddresses();
  const { tags, categories } = useExploreFilters();
  const [sheetVisible, setSheetVisible] = useState(false);

  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [allBusinesses, setAllBusinesses] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );

  const user = getSession()?.user;

  const businessList = usePaginatedList<ExploreBusiness>(
    useCallback(
      (params) =>
        exploreService.businesses({
          page: params.page,
          perPage: params.perPage,
          tagIds: selectedTagIds,
        }),
      [selectedTagIds],
    ),
  );

  const productList = usePaginatedList<ExploreProduct>(
    useCallback(
      (params) =>
        exploreService.allProducts({
          ...params,
          categoryTypeId: selectedCategoryId ?? undefined,
        }),
      [selectedCategoryId],
    ),
  );

  /** Feed de negocios: hay un tag elegido o el chip "Todos" activo. */
  const businessMode = allBusinesses || selectedTagIds.length > 0;
  const searching =
    productList.search.trim().length > 0 || selectedCategoryId != null;

  function handleSearchChange(text: string) {
    productList.setSearch(text);
    if (text.trim()) {
      setSelectedTagIds([]);
      setAllBusinesses(false);
    }
  }

  function toggleTag(id: number) {
    setAllBusinesses(false);
    setSelectedCategoryId(null);
    productList.setSearch('');
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  function toggleAllBusinesses() {
    setAllBusinesses((prev) => !prev);
    setSelectedTagIds([]);
    setSelectedCategoryId(null);
    productList.setSearch('');
  }

  function selectCategory(id: number | null) {
    setSelectedCategoryId(id);
    if (id != null) {
      setSelectedTagIds([]);
      setAllBusinesses(false);
    }
  }

  async function handleLogout() {
    setSigningOut(true);
    await signOutEverywhere();
    setSigningOut(false);
    router.replace('/auth/login');
  }

  function openStore(organizationalId: number) {
    router.push({
      pathname: '/store/[id]',
      params: { id: String(organizationalId) },
    });
  }

  const feedTitle = businessMode
    ? allBusinesses
      ? 'Todos los negocios'
      : 'Negocios'
    : searching
      ? 'Resultados'
      : 'Todos los productos';

  /** Cabecera scrolleable del feed (saludo, búsqueda y las 2 secciones). */
  const listHeader = (
    <View>
      <View className="px-5 pb-3 pt-4">
        <Text className="text-xl font-extrabold text-dark">
          ¡Hola{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}!
        </Text>
        <Text className="mb-3 text-xs text-muted">
          ¿Qué necesitas hoy? LO PIDES, LO LLEVAMOS.
        </Text>
        <View className="rounded-xl border border-gray-200">
          <SearchBar
            value={productList.search}
            onChangeText={handleSearchChange}
            placeholder="Busca productos, ej: hamburguesa…"
          />
        </View>
      </View>

      {tags.length > 0 && (
        <View className="pb-3">
          <Text className="mb-2 px-5 text-base font-extrabold text-dark">
            Negocios
          </Text>
          <TagCards
            tags={tags}
            selectedIds={selectedTagIds}
            allSelected={allBusinesses}
            onToggle={toggleTag}
            onToggleAll={toggleAllBusinesses}
          />
        </View>
      )}

      {categories.length > 0 && (
        <View className="pb-3">
          <Text className="mb-2 px-5 text-base font-extrabold text-dark">
            Categorías
          </Text>
          <CategoryCards
            categories={categories}
            selectedId={selectedCategoryId}
            onSelect={selectCategory}
          />
        </View>
      )}

      <Text className="mb-2 mt-1 px-5 text-base font-extrabold text-dark">
        {feedTitle}
      </Text>
    </View>
  );

  const listFooter = (
    <ActivityIndicator
      size="small"
      color="#FF5A3C"
      style={{ paddingVertical: 12 }}
    />
  );

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <StatusBar style="dark" />

      {/* Navbar fija: selector de dirección + cerrar sesión */}
      <View className="flex-row items-center gap-3 bg-surface px-5 pb-1 pt-2">
        <Pressable
          onPress={() => setSheetVisible(true)}
          className="flex-1 flex-row items-center gap-2 rounded-full bg-white px-3.5 py-2.5 active:opacity-70"
        >
          <Ionicons name="location" size={18} color="#FF5A3C" />
          <View className="flex-1">
            <Text className="text-[10px] font-bold uppercase tracking-wide text-muted">
              Enviar a
            </Text>
            {loadingAddress ? (
              <ActivityIndicator
                size="small"
                color="#FF5A3C"
                style={{ alignSelf: 'flex-start' }}
              />
            ) : (
              <Text numberOfLines={1} className="text-[13px] font-bold text-dark">
                {defaultAddress
                  ? `${defaultAddress.label} — ${defaultAddress.address}`
                  : 'Elegir dirección'}
              </Text>
            )}
          </View>
          <Ionicons name="chevron-down" size={16} color="#7A7A8A" />
        </Pressable>

        <Pressable
          onPress={() => router.push('/orders')}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full bg-white active:opacity-70"
        >
          <Ionicons name="receipt-outline" size={20} color="#FF5A3C" />
        </Pressable>

        <Pressable
          onPress={handleLogout}
          disabled={signingOut}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full bg-white active:opacity-70"
        >
          {signingOut ? (
            <ActivityIndicator size="small" color="#FF5A3C" />
          ) : (
            <Ionicons name="log-out-outline" size={20} color="#FF5A3C" />
          )}
        </Pressable>
      </View>

      {businessMode ? (
        <FlatList
          data={businessList.items}
          keyExtractor={(item) => `b-${item.id}`}
          renderItem={({ item }) => (
            <View className="px-4">
              <BusinessCard business={item} onPress={() => openStore(item.id)} />
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={listHeader}
          refreshing={businessList.refreshing}
          onRefresh={() => businessList.fetchPage(1, 'refresh')}
          onEndReached={businessList.loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={businessList.loadingMore ? listFooter : null}
          ListEmptyComponent={
            businessList.loading ? (
              <ActivityIndicator
                size="large"
                color="#FF5A3C"
                style={{ paddingTop: 48 }}
              />
            ) : (
              <ListEmpty
                icon="storefront-outline"
                message={
                  selectedTagIds.length > 0
                    ? 'No hay negocios con esas etiquetas.'
                    : 'Aún no hay negocios disponibles en tu zona. ¡Vuelve pronto!'
                }
              />
            )
          }
        />
      ) : (
        <FlatList
          data={productList.items}
          keyExtractor={(item) => `p-${item.id}`}
          renderItem={({ item }) => (
            <View className="px-4">
              <ProductCard
                product={item}
                onPress={
                  item.organizational
                    ? () => openStore(item.organizational!.id)
                    : undefined
                }
              />
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={listHeader}
          refreshing={productList.refreshing}
          onRefresh={() => productList.fetchPage(1, 'refresh')}
          onEndReached={productList.loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={productList.loadingMore ? listFooter : null}
          ListEmptyComponent={
            productList.loading ? (
              <ActivityIndicator
                size="large"
                color="#FF5A3C"
                style={{ paddingTop: 48 }}
              />
            ) : (
              <ListEmpty
                icon={searching ? 'search-outline' : 'cube-outline'}
                message={
                  searching
                    ? 'No encontramos productos para tu búsqueda. Prueba con otra palabra o categoría.'
                    : 'Aún no hay productos disponibles en tu zona. ¡Vuelve pronto!'
                }
              />
            )
          }
        />
      )}

      <AddressSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
      />
    </SafeAreaView>
  );
}
