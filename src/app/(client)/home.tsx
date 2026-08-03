import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { AddressSheet } from '@/components/client/address-sheet';
import { BusinessGridCard } from '@/components/client/business-grid-card';
import { CategoryCards } from '@/components/client/category-cards';
import { FilterSheet } from '@/components/client/filter-sheet';
import { HomeHeroCard } from '@/components/client/home-hero-card';
import { ProductGridCard } from '@/components/client/product-grid-card';
import { TagCards } from '@/components/client/tag-cards';
import { ListEmpty } from '@/components/ui/list-empty';
import { SearchBar } from '@/components/ui/search-bar';
import { SectionTitle } from '@/components/ui/section-title';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useCart } from '@/context/cart';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { useExploreFilters, useUserAddresses } from '@/hooks/use-user-data';
import { useSession } from '@/hooks/use-session';
import { gridItemStyle } from '@/lib/grid-style';
import { formatPrice } from '@/lib/price';
import { getAppColors } from '@/lib/app-colors';
import {
  ExploreBusiness,
  ExploreProduct,
  exploreService,
} from '@/services/explore';

/**
 * Home del cliente (rol USER). Todo scrollea junto:
 * - Buscador global de productos.
 * - Sección "Negocios": chips de etiquetas (Restaurante, Ferretería…) —
 *   "Todos" abre el feed de NEGOCIOS (tarjetas, sin filtrar); elegir UNA
 *   etiqueta puntual filtra el feed de PRODUCTOS por esa etiqueta.
 * - Sección "Categorías": cards cuadradas en slider (Aseo, Comida, Licores…)
 *   — elegir una filtra el feed de PRODUCTOS por esa categoría.
 * - Categoría y etiqueta se COMBINAN entre sí (ej. "Pizza" + "Restaurante"):
 *   ambas son filtros del mismo feed de productos, no son excluyentes. El
 *   buscador de texto sí es excluyente de las dos (limpia categoría/etiqueta
 *   y viceversa) para no mezclar 3 filtros a la vez. "Todos los negocios" es
 *   aparte: un modo de solo NAVEGAR negocios, limpia lo demás.
 */
export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cart = useCart();
  // Botón "ver filtros" del buscador: abre la hoja de filtros (select), los
  // sliders "Negocios"/"Categorías" del layout siguen ahí, es otra forma de
  // elegir lo mismo.
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);

  // Caché compartida (lib/user-data): nada de refetch en cada montada.
  const { defaultAddress, loading: loadingAddress } = useUserAddresses();
  const { tags, categories } = useExploreFilters();
  const [sheetVisible, setSheetVisible] = useState(false);

  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [allBusinesses, setAllBusinesses] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );

  // Reactivo: el saludo refresca al guardar el perfil (regla React Compiler).
  const user = useSession()?.user;
  // Invitado: navega el home sin cuenta (§44); las acciones con cuenta
  // (elegir dirección, ver pedidos) lo mandan a iniciar sesión.
  const isGuest = !user;

  // Cercanía: el explorar se limita al radio alrededor de la dirección
  // principal ("enviar a"). Primitivos en las deps (un objeto nuevo por
  // render dispararía refetch infinito); sin coords no se filtra.
  const nearLat = defaultAddress?.latitude ?? null;
  const nearLng = defaultAddress?.longitude ?? null;

  /** Feed de negocios: solo el chip "Todos" lo abre (navegar negocios sin filtrar). */
  const businessMode = allBusinesses;

  const businessList = usePaginatedList<ExploreBusiness>(
    useCallback(
      (params) =>
        exploreService.businesses({
          page: params.page,
          perPage: params.perPage,
          tagIds: [],
          near:
            nearLat != null && nearLng != null
              ? { latitude: nearLat, longitude: nearLng }
              : null,
        }),
      [nearLat, nearLng],
    ),
    // Perezoso: solo se fetchea al abrir "Todos los negocios" — por defecto
    // el home muestra productos.
    { enabled: businessMode },
  );

  const productList = usePaginatedList<ExploreProduct>(
    useCallback(
      (params) =>
        exploreService.allProducts({
          ...params,
          categoryTypeId: selectedCategoryId ?? undefined,
          tagIds: selectedTagIds.length ? selectedTagIds : undefined,
          near:
            nearLat != null && nearLng != null
              ? { latitude: nearLat, longitude: nearLng }
              : null,
        }),
      [selectedCategoryId, selectedTagIds, nearLat, nearLng],
    ),
    // Espera la dirección principal (caché instantánea salvo el primer
    // arranque): evita fetchear sin coords y refetchear al llegar.
    { enabled: !loadingAddress },
  );
  const searching =
    productList.search.trim().length > 0 ||
    selectedCategoryId != null ||
    selectedTagIds.length > 0;

  function handleSearchChange(text: string) {
    productList.setSearch(text);
    if (text.trim()) {
      setSelectedTagIds([]);
      setSelectedCategoryId(null);
      setAllBusinesses(false);
    }
  }

  /** Etiqueta puntual: filtra productos, se combina con la categoría elegida. */
  function toggleTag(id: number) {
    setAllBusinesses(false);
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

  /** Categoría: filtra productos, se combina con las etiquetas elegidas. */
  function selectCategory(id: number | null) {
    setSelectedCategoryId(id);
    setAllBusinesses(false);
    if (id != null) {
      productList.setSearch('');
    }
  }

  function clearFilters() {
    setSelectedTagIds([]);
    setAllBusinesses(false);
    setSelectedCategoryId(null);
  }

  function openStore(organizationalId: number) {
    router.push({
      pathname: '/store/[id]',
      params: { id: String(organizationalId) },
    });
  }

  const feedTitle = businessMode
    ? 'Todos los negocios'
    : searching
      ? 'Resultados'
      : 'Todos los productos';

  const hasFilters = tags.length > 0 || categories.length > 0;
  const hasActiveFilters =
    allBusinesses || selectedTagIds.length > 0 || selectedCategoryId != null;

  /** Cabecera scrolleable del feed (búsqueda, card de marca y las 2 secciones). */
  const listHeader = (
    <View>
      {/* Cierre del bloque oscuro de marca: buscador + botón de filtros */}
      <View className="rounded-b-[28px] bg-dark px-5 pb-6 pt-1">
        <View className="flex-row items-center gap-2">
          <View className="flex-1 rounded-2xl bg-card">
            <SearchBar
              value={productList.search}
              onChangeText={handleSearchChange}
              placeholder="Busca productos, ej: hamburguesa…"
            />
          </View>
          {hasFilters && (
            <Pressable
              onPress={() => setFilterSheetVisible(true)}
              className={`h-[46px] w-[46px] items-center justify-center rounded-2xl active:opacity-80 ${
                hasActiveFilters ? 'bg-white' : 'bg-primary'
              }`}
            >
              <Ionicons
                name="options-outline"
                size={20}
                color={hasActiveFilters ? getAppColors().primaryColor : '#FFFFFF'}
              />
            </Pressable>
          )}
        </View>
      </View>

      <HomeHeroCard name={user?.fullName?.split(' ')[0]} />

      {tags.length > 0 && (
        <View className="pb-3 pt-4">
          <SectionTitle label="Negocios" />
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
          <SectionTitle label="Categorías" />
          <CategoryCards
            categories={categories}
            selectedId={selectedCategoryId}
            onSelect={selectCategory}
          />
        </View>
      )}

      <View className="mt-1">
        <SectionTitle label={feedTitle} />
      </View>
    </View>
  );

  const listFooter = (
    <ActivityIndicator
      size="small"
      color={getAppColors().primaryColor}
      style={{ paddingVertical: 12 }}
    />
  );

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-dark">
      <StatusBar style="light" />

      {/* Navbar fija sobre el bloque oscuro de marca */}
      <View className="flex-row items-center gap-3 bg-dark px-5 pb-3 pt-2">
        <Pressable
          onPress={() =>
            isGuest ? router.push('/auth/login') : setSheetVisible(true)
          }
          className="flex-1 flex-row items-center gap-2 rounded-full bg-card px-3.5 py-2.5 active:opacity-70"
        >
          <Ionicons name="location" size={18} color={getAppColors().primaryColor} />
          <View className="flex-1">
            <Text className="text-[10px] font-bold uppercase tracking-wide text-muted">
              {isGuest ? 'Modo invitado' : 'Enviar a'}
            </Text>
            {loadingAddress ? (
              <ActivityIndicator
                size="small"
                color={getAppColors().primaryColor}
                style={{ alignSelf: 'flex-start' }}
              />
            ) : (
              <Text numberOfLines={1} className="text-[13px] font-bold text-ink">
                {isGuest
                  ? 'Inicia sesión o regístrate'
                  : defaultAddress
                    ? `${defaultAddress.label} — ${defaultAddress.address}`
                    : 'Elegir dirección'}
              </Text>
            )}
          </View>
          <Ionicons
            name={isGuest ? 'log-in-outline' : 'chevron-down'}
            size={16}
            color={getAppColors().mutedColor}
          />
        </Pressable>

        <Pressable
          onPress={() => router.push(isGuest ? '/auth/login' : '/orders')}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full bg-primary active:opacity-80"
        >
          <Ionicons name="receipt-outline" size={20} color="#FFFFFF" />
        </Pressable>

        <ThemeToggle
          className="h-10 w-10 items-center justify-center rounded-full bg-white/15 active:opacity-70"
          iconColor="#FFFFFF"
        />
      </View>

      <View className="flex-1 bg-surface">
      {businessMode ? (
        <FlatList
          data={businessList.items}
          keyExtractor={(item) => `b-${item.id}`}
          numColumns={2}
          columnWrapperStyle={{ paddingHorizontal: 16, gap: 12 }}
          renderItem={({ item, index }) => (
            <View style={gridItemStyle(index, businessList.items.length)}>
              <BusinessGridCard
                business={item}
                onPress={() => openStore(item.id)}
              />
            </View>
          )}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
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
                color={getAppColors().primaryColor}
                style={{ paddingTop: 48 }}
              />
            ) : (
              <ListEmpty
                icon="storefront-outline"
                message="Aún no hay negocios disponibles en tu zona. ¡Vuelve pronto!"
              />
            )
          }
        />
      ) : (
        <FlatList
          data={productList.items}
          keyExtractor={(item) => `p-${item.id}`}
          numColumns={2}
          columnWrapperStyle={{ paddingHorizontal: 16, gap: 12 }}
          renderItem={({ item, index }) => (
            <View style={gridItemStyle(index, productList.items.length)}>
              <ProductGridCard
                product={item}
                onPress={
                  item.organizational
                    ? () => openStore(item.organizational!.id)
                    : undefined
                }
              />
            </View>
          )}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
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
                color={getAppColors().primaryColor}
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

      {/* Botón flotante del carrito: sin entrar a un negocio se ve y lleva al
          checkout. Solo cuando hay algo en el carrito. */}
      {cart.count > 0 && (
        <Pressable
          onPress={() => router.push('/checkout')}
          style={{ bottom: insets.bottom + 20 }}
          className="absolute right-5 h-16 flex-row items-center gap-2.5 rounded-full bg-primary pl-4 pr-5 shadow-lg active:opacity-80"
        >
          <View className="relative">
            <Ionicons name="cart" size={24} color="#FFFFFF" />
            <View className="absolute -right-2 -top-2 h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-primary bg-dark px-1">
              <Text className="text-[10px] font-extrabold text-white">
                {cart.count > 99 ? '99+' : cart.count}
              </Text>
            </View>
          </View>
          <Text className="text-[15px] font-extrabold text-white">
            {formatPrice(cart.subtotal)}
          </Text>
        </Pressable>
      )}
      </View>

      <AddressSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
      />

      <FilterSheet
        visible={filterSheetVisible}
        onClose={() => setFilterSheetVisible(false)}
        tags={tags}
        categories={categories}
        selectedTagIds={selectedTagIds}
        allSelected={allBusinesses}
        selectedCategoryId={selectedCategoryId}
        onToggleTag={toggleTag}
        onToggleAll={toggleAllBusinesses}
        onSelectCategory={selectCategory}
        onClear={clearFilters}
      />
    </SafeAreaView>
  );
}
