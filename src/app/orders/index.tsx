import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OrderCard } from '@/components/orders/order-card';
import { ListEmpty } from '@/components/ui/list-empty';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { useOrderEvents } from '@/lib/orders-socket';
import { businessDisplayName } from '@/services/explore';
import { Order, ordersService } from '@/services/orders';

/** "Mis pedidos" del cliente: historial con scroll infinito y pull-to-refresh. */
export default function ClientOrdersScreen() {
  const router = useRouter();

  const list = usePaginatedList<Order>(
    useCallback((params) => ordersService.paginated(params), []),
  );

  // Al volver a la pantalla (p. ej. tras crear/cancelar) recarga la 1ª página.
  useFocusEffect(
    useCallback(() => {
      list.fetchPage(1, 'refresh');
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  // En vivo: cambios de estado de mis pedidos refrescan la lista.
  useOrderEvents(
    useCallback(() => list.fetchPage(1, 'refresh'), [list.fetchPage]),
  );

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <StatusBar style="dark" />

      <View className="flex-row items-center gap-3 bg-surface px-5 pb-2 pt-2">
        <Pressable
          onPress={() => router.replace('/home')}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full bg-white active:opacity-70"
        >
          <Ionicons name="arrow-back" size={20} color="#1E1E2D" />
        </Pressable>
        <Text className="text-lg font-extrabold text-dark">Mis pedidos</Text>
      </View>

      <FlatList
        data={list.items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            title={
              item.organizational
                ? businessDisplayName(item.organizational)
                : `Pedido #${item.id}`
            }
            onPress={() =>
              router.push({ pathname: '/orders/[id]', params: { id: String(item.id) } })
            }
          />
        )}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        refreshing={list.refreshing}
        onRefresh={() => list.fetchPage(1, 'refresh')}
        onEndReached={list.loadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          list.loadingMore ? (
            <ActivityIndicator size="small" color="#FF5A3C" style={{ paddingVertical: 12 }} />
          ) : null
        }
        ListEmptyComponent={
          list.loading ? (
            <ActivityIndicator size="large" color="#FF5A3C" style={{ paddingTop: 48 }} />
          ) : (
            <ListEmpty
              icon="receipt-outline"
              message="Aún no has hecho pedidos. ¡Explora los negocios y pide algo rico!"
            />
          )
        }
      />
    </SafeAreaView>
  );
}
