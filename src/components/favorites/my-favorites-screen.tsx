import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { BusinessGridCard } from '@/components/client/business-grid-card';
import { ProductGridCard } from '@/components/client/product-grid-card';
import { ListEmpty } from '@/components/ui/list-empty';
import { PanelHeader, PanelSafeArea } from '@/components/ui/panel-header';
import { useDeliveryEstimates } from '@/hooks/use-delivery-estimates';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';
import { useSession } from '@/hooks/use-session';
import { useFavorites } from '@/lib/favorites';
import { columnsForWidth, gridItemStyle, gridPerfProps } from '@/lib/grid-style';
import { profilePathFor } from '@/lib/session';
import {
  FavoriteBusinessItem,
  FavoriteProductItem,
  favoritesService,
} from '@/services/favorites';

type Tab = 'business' | 'product';

/**
 * "Mis favoritos" (ruta oculta, se entra desde "Mi cuenta"): una sola
 * pantalla con dos pestañas, Negocios y Productos, con las MISMAS tarjetas
 * del home (el corazón de cada una sirve para quitarlo). Lo desactivado
 * sigue en la lista atenuado como "No disponible" hasta que lo quiten.
 */
export function MyFavoritesScreen() {
  const router = useRouter();
  const colors = useResolvedAppColors();
  const profileHref = profilePathFor(useSession()?.user);
  const numColumns = columnsForWidth(useWindowDimensions().width, 2);
  const favorites = useFavorites();
  const [tab, setTab] = useState<Tab>('business');

  // Las dos listas se piden UNA vez al abrir (la de la pestaña oculta en
  // segundo plano): cambiar de pestaña o volver a la pantalla no recarga.
  const businesses = usePaginatedList<FavoriteBusinessItem>(
    useCallback((params) => favoritesService.businesses(params), []),
  );
  const products = usePaginatedList<FavoriteProductItem>(
    useCallback((params) => favoritesService.products(params), []),
  );

  // Solo se vuelve a pedir cuando se guarda/quita un favorito (aquí o en el
  // home/tienda), en silencio: al entrar ya está todo actualizado.
  const seenChanges = useRef(favorites.changes);
  const refreshBusinesses = businesses.fetchPage;
  const refreshProducts = products.fetchPage;
  useEffect(() => {
    if (favorites.changes.business !== seenChanges.current.business) {
      void refreshBusinesses(1, 'silent');
    }
    if (favorites.changes.product !== seenChanges.current.product) {
      void refreshProducts(1, 'silent');
    }
    seenChanges.current = favorites.changes;
  }, [favorites.changes, refreshBusinesses, refreshProducts]);

  // replace a "Mi cuenta" (no back()): en un Tabs, back() vuelve al home.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        router.replace(profileHref);
        return true;
      });
      return () => sub.remove();
    }, [router, profileHref]),
  );

  // Quitado con el corazón aquí mismo: sale de la lista al instante.
  // (Solo cuando ya se conocen los ids; antes, la lista del backend manda.)
  const businessItems = favorites.loaded
    ? businesses.items.filter((b) => favorites.business.has(b.id))
    : businesses.items;
  const productItems = favorites.loaded
    ? products.items.filter((p) => favorites.product.has(p.id))
    : products.items;

  const estimates = useDeliveryEstimates(
    tab === 'product'
      ? [...new Set(productItems.map((p) => p.organizational?.id).filter((id) => id != null))]
      : [],
  );

  function openStore(organizationalId: number) {
    router.push({ pathname: '/store/[id]', params: { id: String(organizationalId) } });
  }

  const active = tab === 'business' ? businesses : products;
  const footer = active.loadingMore ? (
    <ActivityIndicator className="my-4" color={colors.primaryColor} />
  ) : null;

  return (
    <PanelSafeArea>
      <StatusBar style="light" />
      <View className="flex-1 bg-surface">
        <PanelHeader
          title="Mis favoritos"
          subtitle="Tus negocios y productos guardados"
          menu={
            <Pressable
              onPress={() => router.replace(profileHref)}
              hitSlop={8}
              className="h-9 w-9 items-center justify-center rounded-full bg-white/10 active:opacity-70"
            >
              <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
            </Pressable>
          }
        />

        {/* Pestañas internas */}
        <View className="mx-4 mt-3 flex-row rounded-xl border border-border bg-card p-1">
          {(
            [
              { value: 'business', label: 'Negocios', icon: 'storefront-outline' },
              { value: 'product', label: 'Productos', icon: 'fast-food-outline' },
            ] as const
          ).map((option) => {
            const selected = tab === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => setTab(option.value)}
                className={`h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-lg ${
                  selected ? 'bg-primary' : ''
                } active:opacity-80`}
              >
                <Ionicons
                  name={option.icon}
                  size={16}
                  color={selected ? '#FFFFFF' : colors.mutedColor}
                />
                <Text
                  className={`text-[14px] font-bold ${selected ? 'text-white' : 'text-muted'}`}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {active.loading ? (
          <ActivityIndicator className="mt-10" color={colors.primaryColor} />
        ) : tab === 'business' ? (
          <FlatList
            key={`b-${numColumns}`}
            data={businessItems}
            keyExtractor={(item) => `b-${item.id}`}
            numColumns={numColumns}
            {...gridPerfProps}
            columnWrapperStyle={{ paddingHorizontal: 16, gap: 12 }}
            contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
            refreshing={businesses.refreshing}
            onRefresh={() => businesses.fetchPage(1, 'refresh')}
            onEndReached={businesses.loadMore}
            onEndReachedThreshold={0.4}
            ListFooterComponent={footer}
            renderItem={({ item, index }) => (
              <View style={gridItemStyle(index, businessItems.length, numColumns)}>
                <Unavailable when={!item.available}>
                  <BusinessGridCard
                    business={item}
                    onPress={() => (item.available ? openStore(item.id) : undefined)}
                  />
                </Unavailable>
              </View>
            )}
            ListEmptyComponent={
              <ListEmpty
                icon="heart-outline"
                message="Aún no tienes negocios favoritos. Toca el corazón de un negocio para guardarlo aquí."
              />
            }
          />
        ) : (
          <FlatList
            key={`p-${numColumns}`}
            data={productItems}
            keyExtractor={(item) => `p-${item.id}`}
            numColumns={numColumns}
            {...gridPerfProps}
            columnWrapperStyle={{ paddingHorizontal: 16, gap: 12 }}
            contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
            refreshing={products.refreshing}
            onRefresh={() => products.fetchPage(1, 'refresh')}
            onEndReached={products.loadMore}
            onEndReachedThreshold={0.4}
            ListFooterComponent={footer}
            renderItem={({ item, index }) => (
              <View style={gridItemStyle(index, productItems.length, numColumns)}>
                <Unavailable when={!item.available}>
                  <ProductGridCard
                    product={item}
                    onPress={
                      item.available && item.organizational
                        ? () => openStore(item.organizational!.id)
                        : undefined
                    }
                    estimate={
                      item.organizational ? estimates[item.organizational.id] : undefined
                    }
                  />
                </Unavailable>
              </View>
            )}
            ListEmptyComponent={
              <ListEmpty
                icon="heart-outline"
                message="Aún no tienes productos favoritos. Toca el corazón de un producto para guardarlo aquí."
              />
            }
          />
        )}
      </View>
    </PanelSafeArea>
  );
}

/** Atenúa la tarjeta con la etiqueta "No disponible" (el corazón sigue activo). */
function Unavailable({ when, children }: { when: boolean; children: React.ReactNode }) {
  if (!when) return <>{children}</>;
  return (
    <View>
      <View style={{ opacity: 0.45 }}>{children}</View>
      <View
        pointerEvents="none"
        className="absolute left-2 top-2 rounded-full bg-dark px-2 py-0.5"
      >
        <Text className="text-[10px] font-bold text-white">No disponible</Text>
      </View>
    </View>
  );
}
