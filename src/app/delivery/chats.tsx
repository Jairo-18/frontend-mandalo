import { ChatThreadsScreen } from '@/components/chat/chat-threads-screen';
import { InactiveAccountNotice } from '@/components/delivery/inactive-account-notice';
import { useSession } from '@/hooks/use-session';

/** Mis chats del REPARTIDOR (la pantalla compartida vive en components/chat). */
export default function DeliveryChatsRoute() {
  const session = useSession();
  // Cuenta en revisión: sin pedidos asignados no puede haber conversaciones.
  if (session?.user.isActive === false) {
    return <InactiveAccountNotice title="Mis chats" />;
  }
  return <ChatThreadsScreen />;
}
