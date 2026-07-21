import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/avatar';
import { ListEmpty } from '@/components/ui/list-empty';
import { useSession } from '@/hooks/use-session';
import { refreshUnreadChats } from '@/hooks/use-unread-chats';
import { formatTime } from '@/lib/order-eta';
import { ChatSocketEvent, useChatMessages } from '@/lib/orders-socket';
import {
  ChatMessage,
  ChatParticipant,
  ChatThread,
  chatService,
} from '@/services/chat';

/** Respuestas rápidas por rol (un motociclista no quiere teclear). */
const DELIVERY_REPLIES = [
  '🏠 Estoy afuera',
  '🛵 Voy en camino',
  '¿Me regalas una referencia de la casa?',
];
const CLIENT_REPLIES = [
  'Ya salgo 🙌',
  'Timbra por favor 🔔',
  '¿Cuánto te falta?',
];

/**
 * Chat del pedido (cliente ↔ repartidor asignado). Lista invertida de
 * burbujas con avatar/nombre/hora; en vivo por el socket `/orders`; envío
 * optimista. Se abre desde el detalle del pedido, "Mis chats" o el push.
 */
export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { invoiceId: raw } = useLocalSearchParams<{ invoiceId: string }>();
  const invoiceId = Number(raw);

  const session = useSession();
  const myId = session?.user.id;
  const roleCode = session?.user.role?.code;

  const [thread, setThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const pageRef = useRef(1);

  // Carga inicial: cabecera + primera página, y marca leídos.
  useEffect(() => {
    let alive = true;
    chatService
      .thread(invoiceId)
      .then((res) => {
        if (!alive) return;
        setThread(res.data);
        setMessages(res.data.messages.data);
        setHasMore(res.data.messages.pagination.hasNextPage);
        pageRef.current = 1;
        void chatService.markRead(invoiceId).then(refreshUnreadChats);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [invoiceId]);

  // Mensajes en vivo (el propio también llega: confirma el optimista).
  useChatMessages(
    useCallback(
      (event: ChatSocketEvent) => {
        if (event.invoiceId !== invoiceId) return;
        const incoming = { ...event.message, readAt: null } as ChatMessage;
        setMessages((prev) =>
          prev.some((m) => m.id === incoming.id) ? prev : [incoming, ...prev],
        );
        if (incoming.senderUserId !== myId) {
          // Leído al instante (el chat está abierto) — y el badge global baja.
          void chatService.markRead(invoiceId).then(refreshUnreadChats);
        }
      },
      [invoiceId, myId],
    ),
  );

  const iAmClient = !!myId && myId === thread?.client?.id;
  const counterpart: ChatParticipant | null =
    (iAmClient ? thread?.delivery : thread?.client) ?? null;
  const canWrite =
    !!thread?.active &&
    !!myId &&
    (myId === thread.client?.id || myId === thread.delivery?.id);

  async function send(body: string) {
    const clean = body.trim();
    if (!clean || sending || !canWrite) return;
    setSending(true);
    setText('');

    // Optimista: burbuja inmediata con id temporal (negativo).
    const temp: ChatMessage = {
      id: -Date.now(),
      senderUserId: myId!,
      body: clean,
      createdAt: new Date().toISOString(),
      readAt: null,
    };
    setMessages((prev) => [temp, ...prev]);

    try {
      const res = await chatService.send(invoiceId, clean);
      setMessages((prev) => {
        const cleaned = prev.filter((m) => m.id !== temp.id);
        return cleaned.some((m) => m.id === res.data.id)
          ? cleaned
          : [res.data, ...cleaned];
      });
    } catch {
      // El interceptor ya toasteó; se retira la burbuja fallida.
      setMessages((prev) => prev.filter((m) => m.id !== temp.id));
      setText(clean);
    } finally {
      setSending(false);
    }
  }

  async function loadOlder() {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const next = pageRef.current + 1;
      const res = await chatService.thread(invoiceId, next);
      pageRef.current = next;
      setMessages((prev) => {
        const known = new Set(prev.map((m) => m.id));
        return [
          ...prev,
          ...res.data.messages.data.filter((m) => !known.has(m.id)),
        ];
      });
      setHasMore(res.data.messages.pagination.hasNextPage);
    } catch {
      // Sin red: se reintenta al volver a llegar al tope.
    } finally {
      setLoadingMore(false);
    }
  }

  const quickReplies = roleCode === 'DELI' ? DELIVERY_REPLIES : CLIENT_REPLIES;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-dark">
      <StatusBar style="light" />
      <View className="flex-1 bg-surface">
        {/* Cabecera de marca: contraparte + pedido */}
        <View className="flex-row items-center gap-3 rounded-b-[28px] bg-dark px-4 pb-4 pt-2">
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            className="h-10 w-10 items-center justify-center rounded-full bg-white/10 active:opacity-70"
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </Pressable>
          <Avatar
            uri={counterpart?.avatarUrl}
            icon={iAmClient ? 'bicycle-outline' : 'person-outline'}
            size={40}
          />
          <View className="flex-1">
            <Text
              numberOfLines={1}
              className="text-base font-extrabold text-white"
            >
              {counterpart?.fullName ?? (iAmClient ? 'Domiciliario' : 'Cliente')}
            </Text>
            <Text className="text-[11px] font-bold uppercase tracking-widest text-white/60">
              Pedido #{invoiceId}
            </Text>
          </View>
        </View>

        {/* El de keyboard-controller sí funciona con el edge-to-edge de
            Android (el de RN dejaba el composer tapado por el teclado). */}
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#FF5A3C" />
            </View>
          ) : !thread ? (
            <ListEmpty
              icon="chatbubbles-outline"
              message="No pudimos cargar este chat. Intenta de nuevo."
            />
          ) : (
            <FlatList
              // Sin mensajes NO se invierte: el ListEmptyComponent saldría
              // volteado (la inversión es un scaleY de toda la lista).
              inverted={messages.length > 0}
              data={messages}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <Bubble
                  message={item}
                  mine={item.senderUserId === myId}
                  counterpart={counterpart}
                />
              )}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingVertical: 12,
              }}
              onEndReached={loadOlder}
              onEndReachedThreshold={0.3}
              keyboardShouldPersistTaps="handled"
              // En lista invertida el footer se ve ARRIBA (inicio del chat).
              ListFooterComponent={
                <View className="pb-2">
                  {loadingMore && (
                    <ActivityIndicator
                      size="small"
                      color="#FF5A3C"
                      style={{ paddingVertical: 10 }}
                    />
                  )}
                  {iAmClient && (
                    <View className="mb-3 flex-row items-start gap-2 rounded-2xl bg-primary-tint px-3.5 py-3">
                      <Ionicons
                        name="lock-closed-outline"
                        size={15}
                        color="#FF5A3C"
                      />
                      <Text className="flex-1 text-xs text-dark">
                        Nunca compartas tu{' '}
                        <Text className="font-bold">código de entrega</Text> por
                        chat: díctalo solo en la puerta al recibir tu pedido.
                      </Text>
                    </View>
                  )}
                </View>
              }
              ListEmptyComponent={
                <ListEmpty
                  icon="chatbubbles-outline"
                  message={
                    canWrite
                      ? 'Aún no hay mensajes. ¡Saluda!'
                      : 'Este chat no tiene mensajes.'
                  }
                />
              }
            />
          )}

          {/* Zona de escritura (o aviso de chat cerrado) */}
          {thread &&
            (canWrite ? (
              <View
                className="border-t border-gray-100 bg-white px-3 pt-2"
                style={{ paddingBottom: insets.bottom + 8 }}
              >
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
                >
                  {quickReplies.map((reply) => (
                    <Pressable
                      key={reply}
                      onPress={() => send(reply)}
                      disabled={sending}
                      className="rounded-full border border-primary/40 bg-primary-tint px-3.5 py-1.5 active:opacity-70"
                    >
                      <Text className="text-[13px] font-semibold text-primary">
                        {reply}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <View className="flex-row items-end gap-2">
                  <View className="max-h-28 flex-1 rounded-3xl bg-surface px-4 py-2.5">
                    <TextInput
                      value={text}
                      onChangeText={setText}
                      placeholder="Escribe un mensaje…"
                      placeholderTextColor="#7A7A8A"
                      multiline
                      maxLength={500}
                      className="text-[15px] text-dark"
                      style={{ paddingTop: 0, paddingBottom: 0 }}
                    />
                  </View>
                  <Pressable
                    onPress={() => send(text)}
                    disabled={sending || !text.trim()}
                    className={`h-11 w-11 items-center justify-center rounded-full ${
                      text.trim() ? 'bg-primary' : 'bg-gray-300'
                    } active:opacity-80`}
                  >
                    {sending ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Ionicons name="send" size={18} color="#FFFFFF" />
                    )}
                  </Pressable>
                </View>
              </View>
            ) : (
              <View
                className="items-center border-t border-gray-100 bg-white px-5 pt-3"
                style={{ paddingBottom: insets.bottom + 12 }}
              >
                <Text className="text-center text-xs text-muted">
                  {thread.delivery
                    ? 'El chat de este pedido está cerrado (pedido finalizado).'
                    : 'El chat se habilita cuando un domiciliario tome el pedido.'}
                </Text>
              </View>
            ))}
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

/** Burbuja de mensaje: entrantes con avatar + nombre; propias en primario. */
function Bubble({
  message,
  mine,
  counterpart,
}: {
  message: ChatMessage;
  mine: boolean;
  counterpart: ChatParticipant | null;
}) {
  const pending = message.id < 0;
  const time = formatTime(new Date(message.createdAt));

  if (mine) {
    return (
      <View className="mb-2.5 max-w-[80%] self-end">
        <View className="rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5">
          <Text className="text-[15px] leading-5 text-white">
            {message.body}
          </Text>
        </View>
        <Text className="mt-1 self-end text-[10px] text-muted">
          {pending ? 'Enviando…' : time}
        </Text>
      </View>
    );
  }

  return (
    <View className="mb-2.5 max-w-[85%] flex-row items-end gap-2 self-start">
      <Avatar uri={counterpart?.avatarUrl} icon="person-outline" size={28} />
      <View className="shrink">
        {!!counterpart?.fullName && (
          <Text className="mb-0.5 ml-1 text-[11px] font-semibold text-muted">
            {counterpart.fullName}
          </Text>
        )}
        <View className="rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5">
          <Text className="text-[15px] leading-5 text-dark">
            {message.body}
          </Text>
        </View>
        <Text className="ml-1 mt-1 text-[10px] text-muted">{time}</Text>
      </View>
    </View>
  );
}
