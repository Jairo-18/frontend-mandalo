import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OrderDetailView } from '@/components/orders/order-detail-view';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { YesNoDialog } from '@/components/ui/yes-no-dialog';
import { useAppTheme } from '@/context/app-theme';
import { useOrderEvents } from '@/lib/orders-socket';
import { Order, ordersService } from '@/services/orders';
import { getAppColors } from '@/lib/app-colors';
import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';

/** Detalle de un pedido del cliente. Puede cancelarlo mientras está pendiente. */
export default function ClientOrderDetailScreen() {
  const colors = useResolvedAppColors();
  const router = useRouter();
  const { isDark } = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderId = Number(id);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  // Esta pantalla recarga por 3 vías (foco, socket, deslizar) — evita que se
  // pisen entre sí disparando peticiones en paralelo.
  const busyRef = useRef(false);

  const load = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      if (busyRef.current) return;
      busyRef.current = true;
      if (mode === 'refresh') setRefreshing(true);
      try {
        const res = await ordersService.get(orderId);
        setOrder(res.data);
      } catch {
        // El interceptor HTTP ya mostró el error.
      } finally {
        setLoading(false);
        setRefreshing(false);
        busyRef.current = false;
      }
    },
    [orderId],
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Actualización en vivo: si llega un evento de ESTE pedido, recarga.
  useOrderEvents(
    useCallback(
      (payload) => {
        if (payload.id === orderId) load('refresh');
      },
      [orderId, load],
    ),
  );

  async function cancel() {
    await ordersService.changeState(orderId, 'CANC', {
      cancellationReason: 'Cancelado por el cliente',
    });
    setConfirmCancel(false);
    load('refresh');
  }

  const canCancel = order?.stateType?.code === 'PEND';

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View className="flex-row items-center gap-3 bg-surface px-5 pb-2 pt-2">
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/orders'))}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full bg-card active:opacity-70"
        >
          <Ionicons name="arrow-back" size={20} color={colors.inkColor} />
        </Pressable>
        <Text className="flex-1 text-lg font-extrabold text-ink">
          Pedido #{orderId}
        </Text>
        <ThemeToggle />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primaryColor} />
        </View>
      ) : !order ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="receipt-outline" size={48} color={colors.mutedColor} />
          <Text className="mt-3 text-center text-sm text-muted">
            No pudimos cargar este pedido.
          </Text>
        </View>
      ) : (
        <>
          <ScrollView
            style={{ flex: 1 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => load('refresh')}
                tintColor={colors.primaryColor}
              />
            }
          >
            <OrderDetailView
              order={order}
              perspective="client"
              onPaymentProofChanged={() => load('refresh')}
              onOrderChanged={() => load('refresh')}
            />
          </ScrollView>

          {canCancel && (
            <View className="border-t border-border bg-card px-5 pb-6 pt-3">
              <Pressable
                onPress={() => setConfirmCancel(true)}
                className="h-[52px] items-center justify-center rounded-2xl border border-red-200 active:opacity-70"
              >
                <Text className="text-[15px] font-bold text-red-600">
                  Cancelar pedido
                </Text>
              </Pressable>
            </View>
          )}
        </>
      )}

      <YesNoDialog
        visible={confirmCancel}
        destructive
        icon="close-circle-outline"
        title="¿Cancelar pedido?"
        message="El negocio dejará de prepararlo. Esta acción no se puede deshacer."
        confirmLabel="Sí, cancelar"
        cancelLabel="No"
        onConfirm={cancel}
        onCancel={() => setConfirmCancel(false)}
      />
    </SafeAreaView>
  );
}
