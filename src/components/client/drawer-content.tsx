import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/avatar';
import { DeveloperCredit } from '@/components/ui/developer-credit';
import { useSession } from '@/hooks/use-session';
import { useUnreadChats } from '@/hooks/use-unread-chats';
import { signOutEverywhere } from '@/lib/sign-out';

type ClientRoute = '/home' | '/orders' | '/chats' | '/addresses' | '/profile';

type Item = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: ClientRoute;
};

/** Secciones del panel del cliente. */
const ITEMS: Item[] = [
  { label: 'Explorar', icon: 'home-outline', href: '/home' },
  { label: 'Mis pedidos', icon: 'receipt-outline', href: '/orders' },
  { label: 'Mis chats', icon: 'chatbubbles-outline', href: '/chats' },
  { label: 'Mis direcciones', icon: 'location-outline', href: '/addresses' },
  { label: 'Mi perfil', icon: 'person-outline', href: '/profile' },
];

// Lo único que se usa de las props del drawer (evita el choque de tipos entre
// expo-router y @react-navigation/drawer).
type Props = { navigation: { closeDrawer: () => void } };

/**
 * Sidebar del panel del cliente (rol USER): cabecera con el avatar y el
 * nombre del usuario (tocarla abre Mi perfil), navegación por secciones y
 * cierre de sesión abajo. Espejo de los sidebars de admin y negocio.
 */
export function ClientDrawerContent({ navigation }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [signingOut, setSigningOut] = useState(false);

  // Reactivo: al guardar el perfil o vincular Google la sesión cambia y el
  // sidebar refresca nombre/foto al instante (useSyncExternalStore — leer
  // getSession() suelto en el render deja JSX viejo con React Compiler).
  const user = useSession()?.user;

  // Mensajes de chat sin leer (burbuja del item "Mis chats", en vivo).
  const unreadChats = useUnreadChats();

  function go(href: ClientRoute) {
    navigation.closeDrawer();
    if (pathname !== href) router.navigate(href);
  }

  async function handleLogout() {
    setSigningOut(true);
    // Navega al login por dentro, con el overlay "Cerrando sesión…".
    await signOutEverywhere();
    setSigningOut(false);
  }

  return (
    <View className="flex-1 bg-white">
      {/* Cabecera de marca */}
      <View
        className="bg-dark px-5 pb-5"
        style={{ paddingTop: insets.top + 20 }}
      >
        <Text className="text-2xl font-extrabold text-primary">Mándalo</Text>
        <Text className="mt-0.5 text-[11px] font-bold uppercase tracking-widest text-white/60">
          LO PIDES, LO LLEVAMOS.
        </Text>

        {/* Tarjeta del usuario: tocarla abre Mi perfil */}
        <Pressable
          onPress={() => go('/profile')}
          className="mt-4 flex-row items-center gap-3 active:opacity-70"
        >
          <Avatar uri={user?.avatarUrl} label={user?.fullName} tone="solid" />
          <View className="flex-1">
            <Text numberOfLines={1} className="text-sm font-bold text-white">
              {user?.fullName ?? 'Mi cuenta'}
            </Text>
            <Text numberOfLines={1} className="text-xs text-white/60">
              Editar mi perfil
            </Text>
          </View>
          <Ionicons name="create-outline" size={18} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Navegación */}
      <View className="flex-1 px-3 pt-4">
        {ITEMS.map((item) => {
          const active =
            item.href === '/orders'
              ? pathname.startsWith('/orders')
              : pathname === item.href;
          const badge = item.href === '/chats' ? unreadChats : 0;
          return (
            <Pressable
              key={item.href}
              onPress={() => go(item.href)}
              className={`mb-1 flex-row items-center gap-3 rounded-xl px-3.5 py-3 active:opacity-70 ${
                active ? 'bg-primary-tint' : ''
              }`}
            >
              <Ionicons
                name={item.icon}
                size={21}
                color={active ? '#FF5A3C' : '#7A7A8A'}
              />
              <Text
                className={`text-[15px] ${
                  active ? 'font-extrabold text-primary' : 'font-medium text-dark'
                }`}
              >
                {item.label}
              </Text>
              {badge > 0 && (
                <View className="ml-auto min-w-[22px] items-center rounded-full bg-primary px-1.5 py-0.5">
                  <Text className="text-xs font-extrabold text-white">
                    {badge > 99 ? '99+' : badge}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Cerrar sesión */}
      <View
        className="border-t border-gray-100 px-3 pt-3"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <Pressable
          onPress={handleLogout}
          disabled={signingOut}
          className="flex-row items-center gap-3 rounded-xl px-3.5 py-3 active:opacity-70"
        >
          {signingOut ? (
            <ActivityIndicator size="small" color="#FF5A3C" />
          ) : (
            <Ionicons name="log-out-outline" size={21} color="#FF5A3C" />
          )}
          <Text className="text-[15px] font-bold text-primary">
            Cerrar sesión
          </Text>
        </Pressable>
        <DeveloperCredit />
      </View>
    </View>
  );
}
