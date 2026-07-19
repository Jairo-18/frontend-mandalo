import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ReactNode, useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/avatar';
import { ListEmpty } from '@/components/ui/list-empty';
import { PanelHeader } from '@/components/ui/panel-header';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { useSession } from '@/hooks/use-session';
import { formatTime } from '@/lib/order-eta';
import { useChatMessages } from '@/lib/orders-socket';
import { ChatThreadItem, chatService } from '@/services/chat';

type Props = {
  /** Hamburguesa del drawer del rol (cliente o repartidor). */
  menu: ReactNode;
};

/** Hora si el mensaje es de hoy; "12 jul" si es de otro día. */
function threadTime(iso: string): string {
  const date = new Date(iso);
  const today = new Date().toDateString() === date.toDateString();
  return today
    ? formatTime(date)
    : date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

/**
 * "Mis chats": los hilos de pedidos del usuario (cliente o repartidor) con
 * la contraparte, el último mensaje y los no leídos. Compartida por los
 * paneles de USER y DELI (cambia solo la hamburguesa y la contraparte).
 */
export function ChatThreadsScreen({ menu }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const roleCode = useSession()?.user.role?.code;

  const list = usePaginatedList<ChatThreadItem>(
    useCallback((params) => chatService.threads(params), []),
  );

  // Un mensaje nuevo en cualquier hilo refresca la lista (previews/badges).
  const { reload } = list;
  useChatMessages(useCallback(() => reload(), [reload]));

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-dark">
      <StatusBar style="light" />
      <View className="flex-1 bg-surface">
        <PanelHeader title="Mis chats" menu={menu} />

        {list.loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#FF5A3C" />
          </View>
        ) : (
          <FlatList
            data={list.items}
            keyExtractor={(item) => String(item.invoiceId)}
            contentContainerStyle={{
              padding: 16,
              paddingBottom: insets.bottom + 24,
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
            renderItem={({ item }) => {
              const counterpart =
                roleCode === 'DELI' ? item.client : item.delivery;
              return (
                <Pressable
                  onPress={() => router.push(`/chat/${item.invoiceId}`)}
                  className="mb-3 flex-row items-center gap-3 rounded-2xl bg-white p-3.5 active:opacity-80"
                >
                  <Avatar
                    uri={counterpart?.avatarUrl}
                    icon={
                      roleCode === 'DELI' ? 'person-outline' : 'bicycle-outline'
                    }
                    size={48}
                  />
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text
                        numberOfLines={1}
                        className="shrink text-[15px] font-bold text-dark"
                      >
                        {counterpart?.fullName ??
                          (roleCode === 'DELI' ? 'Cliente' : 'Repartidor')}
                      </Text>
                      {!item.active && (
                        <View className="rounded-full bg-surface px-2 py-0.5">
                          <Text className="text-[10px] font-bold text-muted">
                            Finalizado
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-[11px] font-semibold text-primary">
                      Pedido #{item.invoiceId}
                    </Text>
                    <Text
                      numberOfLines={1}
                      className={`mt-0.5 text-xs ${
                        item.unreadCount > 0
                          ? 'font-bold text-dark'
                          : 'text-muted'
                      }`}
                    >
                      {item.lastMessage?.body ?? 'Sin mensajes aún'}
                    </Text>
                  </View>

                  <View className="items-end gap-1.5">
                    {!!item.lastMessage && (
                      <Text className="text-[10px] text-muted">
                        {threadTime(item.lastMessage.at)}
                      </Text>
                    )}
                    {item.unreadCount > 0 ? (
                      <View className="h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5">
                        <Text className="text-[11px] font-extrabold text-white">
                          {item.unreadCount > 99 ? '99+' : item.unreadCount}
                        </Text>
                      </View>
                    ) : (
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color="#C9C9D4"
                      />
                    )}
                  </View>
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <ListEmpty
                icon="chatbubbles-outline"
                message={
                  roleCode === 'DELI'
                    ? 'Aún no tienes chats. Cuando tomes un pedido podrás hablar con el cliente.'
                    : 'Aún no tienes chats. Cuando un repartidor tome tu pedido podrás hablar con él.'
                }
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
