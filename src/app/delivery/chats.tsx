import { ChatThreadsScreen } from '@/components/chat/chat-threads-screen';
import { MenuButton } from '@/components/client/menu-button';

/** Mis chats del REPARTIDOR (la pantalla compartida vive en components/chat). */
export default function DeliveryChatsRoute() {
  return <ChatThreadsScreen menu={<MenuButton parent="/delivery" />} />;
}
