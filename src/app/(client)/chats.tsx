import { ChatThreadsScreen } from '@/components/chat/chat-threads-screen';
import { MenuButton } from '@/components/client/menu-button';

/** Mis chats del CLIENTE (la pantalla compartida vive en components/chat). */
export default function ClientChatsRoute() {
  return <ChatThreadsScreen menu={<MenuButton />} />;
}
