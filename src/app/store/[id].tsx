import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProductCard } from '@/components/client/product-card';
import { Avatar } from '@/components/ui/avatar';
import { FilterChips } from '@/components/ui/filter-chips';
import { ListEmpty } from '@/components/ui/list-empty';
import { SearchBar } from '@/components/ui/search-bar';
import { YesNoDialog } from '@/components/ui/yes-no-dialog';
import { useCart } from '@/context/cart';
import { formatPrice } from '@/lib/price';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import {
  businessDisplayName,
  ExploreBusiness,
  ExploreFilterItem,
  ExploreProduct,
  exploreService,
} from '@/services/explore';

/**
 * Pantalla de un negocio (vista del cliente): cabecera con logo, etiquetas
 * y datos de contacto + sus productos activos con búsqueda y filtro por
 * categoría (solo las categorías que ese negocio usa). Scroll infinito.
 */
export default function StoreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const storeId = Number(id);

  const cart = useCart();
  const [business, setBusiness] = useState<ExploreBusiness | null>(null);
  const [categories, setCategories] = useState<ExploreFilterItem[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [categoryValue, setCategoryValue] = useState('all');
  // Producto pendiente de agregar cuando el carrito es de OTRO negocio.
  const [switchTo, setSwitchTo] = useState<ExploreProduct | null>(null);

  const categoryTypeId =
    categoryValue === 'all' ? undefined : Number(categoryValue);

  const list = usePaginatedList<ExploreProduct>(
    useCallback(
      (params) =>
        exploreService.products(storeId, { ...params, categoryTypeId }),
      [storeId, categoryTypeId],
    ),
  );

  useEffect(() => {
    let alive = true;
    exploreService
      .business(storeId)
      .then((res) => {
        if (!alive) return;
        setBusiness(res.data.organizational);
        setCategories(res.data.categories);
      })
      .catch(() => {
        // El interceptor HTTP ya mostró el error (p. ej. negocio inactivo).
      })
      .finally(() => {
        if (alive) setLoadingDetail(false);
      });
    return () => {
      alive = false;
    };
  }, [storeId]);

  if (loadingDetail) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#FF5A3C" />
      </SafeAreaView>
    );
  }

  if (!business) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar style="dark" />
        <View className="px-5 pt-2">
          <BackButton onPress={() => router.back()} />
        </View>
        <ListEmpty
          icon="storefront-outline"
          message="No pudimos cargar este negocio. Intenta de nuevo más tarde."
        />
      </SafeAreaView>
    );
  }

  const location = [business.address, business.municipality?.name]
    .filter(Boolean)
    .join(' · ');

  const cartBiz = { id: storeId, name: businessDisplayName(business) };

  /** Suma 1 al carrito; si hay otro negocio en curso, pide confirmar. */
  function handleAdd(product: ExploreProduct) {
    if (cart.count > 0 && cart.businessId !== storeId) {
      setSwitchTo(product);
      return;
    }
    cart.add(product, cartBiz);
  }

  function confirmSwitch() {
    if (!switchTo) return;
    cart.clear();
    cart.add(switchTo, cartBiz);
    setSwitchTo(null);
  }

  // La barra flotante solo aplica al carrito de ESTE negocio.
  const showCartBar = cart.count > 0 && cart.businessId === storeId;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      {/* Cabecera: volver + negocio */}
      <View className="flex-row items-center gap-3 px-5 pb-3 pt-2">
        <BackButton onPress={() => router.back()} />
        <Avatar
          uri={business.logoUrl}
          icon="storefront-outline"
          size={48}
          shape="rounded"
        />
        <View className="flex-1">
          <Text numberOfLines={1} className="text-lg font-extrabold text-dark">
            {businessDisplayName(business)}
          </Text>
          {business.tags.length > 0 && (
            <Text numberOfLines={1} className="text-[11px] font-semibold text-primary">
              {business.tags.map((tag) => tag.name).join(' · ')}
            </Text>
          )}
        </View>
      </View>

      {/* Datos de contacto */}
      {(!!location || !!business.phone || !!business.description) && (
        <View className="mx-5 mb-3 rounded-2xl bg-surface p-3.5">
          {!!business.description && (
            <Text numberOfLines={2} className="mb-1.5 text-xs text-dark">
              {business.description}
            </Text>
          )}
          {!!location && (
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="location-outline" size={13} color="#7A7A8A" />
              <Text numberOfLines={1} className="flex-1 text-xs text-muted">
                {location}
              </Text>
            </View>
          )}
          {!!business.phone && (
            <View className="mt-1 flex-row items-center gap-1.5">
              <Ionicons name="call-outline" size={13} color="#7A7A8A" />
              <Text className="text-xs text-muted">{business.phone}</Text>
            </View>
          )}
        </View>
      )}

      {/* Búsqueda + categorías del negocio */}
      <View className="px-5 pb-2">
        <View className="rounded-xl border border-gray-200">
          <SearchBar
            value={list.search}
            onChangeText={list.setSearch}
            placeholder="Buscar productos…"
          />
        </View>
      </View>
      {categories.length > 0 && (
        <View className="px-5 pb-2">
          <FilterChips
            options={[
              { value: 'all', label: 'Todas' },
              ...categories.map((category) => ({
                value: String(category.id),
                label: category.name,
              })),
            ]}
            value={categoryValue}
            onChange={setCategoryValue}
          />
        </View>
      )}

      {/* Productos (scroll infinito) */}
      <View className="flex-1 bg-surface">
        {list.loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#FF5A3C" />
          </View>
        ) : (
          <FlatList
            data={list.items}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <ProductCard
                product={item}
                quantity={cart.quantityOf(item.id)}
                onAdd={() => handleAdd(item)}
                onDecrement={() => cart.decrement(item.id)}
              />
            )}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 14,
              paddingBottom: showCartBar ? 96 : 24,
            }}
            refreshing={list.refreshing}
            onRefresh={() => list.fetchPage(1, 'refresh')}
            onEndReached={list.loadMore}
            onEndReachedThreshold={0.4}
            ListFooterComponent={
              list.loadingMore ? (
                <ActivityIndicator
                  size="small"
                  color="#FF5A3C"
                  style={{ paddingVertical: 12 }}
                />
              ) : null
            }
            ListEmptyComponent={
              <ListEmpty
                icon="cube-outline"
                message={
                  list.query || categoryTypeId
                    ? 'No hay productos que coincidan con la búsqueda.'
                    : 'Este negocio aún no tiene productos disponibles.'
                }
              />
            }
          />
        )}
      </View>

      {/* Barra flotante del carrito → checkout. Es absolute (escapa del
          padding del SafeAreaView), así que el inset inferior va a mano para
          no quedar debajo de la barra de navegación del sistema. */}
      {showCartBar && (
        <View
          className="absolute inset-x-0 bottom-0 border-t border-gray-100 bg-white px-5 pt-3"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          <Pressable
            onPress={() => router.push('/checkout')}
            className="h-[54px] flex-row items-center justify-between rounded-2xl bg-primary px-5 active:opacity-80"
          >
            <View className="h-7 min-w-[28px] items-center justify-center rounded-full bg-white/25 px-2">
              <Text className="text-sm font-extrabold text-white">
                {cart.count}
              </Text>
            </View>
            <Text className="text-base font-extrabold text-white">
              Ver carrito
            </Text>
            <Text className="text-base font-extrabold text-white">
              {formatPrice(cart.subtotal)}
            </Text>
          </Pressable>
        </View>
      )}

      <YesNoDialog
        visible={!!switchTo}
        icon="cart-outline"
        title="¿Vaciar el carrito?"
        message={`Tu carrito tiene productos de ${cart.businessName}. Para pedir de este negocio se vaciará.`}
        confirmLabel="Vaciar y agregar"
        onConfirm={confirmSwitch}
        onCancel={() => setSwitchTo(null)}
      />
    </SafeAreaView>
  );
}

function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      className="h-10 w-10 items-center justify-center rounded-full bg-surface active:opacity-70"
    >
      <Ionicons name="arrow-back" size={20} color="#1E1E2D" />
    </Pressable>
  );
}
