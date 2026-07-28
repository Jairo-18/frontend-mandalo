import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/avatar';
import { DeveloperCredit } from '@/components/ui/developer-credit';
import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';
import { useSession } from '@/hooks/use-session';
import { useUnreadChats } from '@/hooks/use-unread-chats';
import { signOutEverywhere } from '@/lib/sign-out';
import { DEFAULT_USER_AVATAR } from '@/lib/default-images';

type ClientRoute = '/home' | '/orders' | '/chats' | '/addresses' | '/profile';

type Item = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: ClientRoute;
};

/** Secciones del panel del cliente. */
const ITEMS: Item[] = [
  { label: 'Inicio', icon: 'home-outline', href: '/home' },
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
  const colors = useResolvedAppColors();

  // Reactivo: al guardar el perfil o vincular Google la sesión cambia y el
  // sidebar refresca nombre/foto al instante (useSyncExternalStore — leer
  // getSession() suelto en el render deja JSX viejo con React Compiler).
  const user = useSession()?.user;
  // Modo invitado (sin sesión): navega el home, pero las secciones con cuenta
  // (pedidos, chats, direcciones, perfil) lo invitan a iniciar sesión (§44).
  const isGuest = !user;

  // Mensajes de chat sin leer (burbuja del item "Mis chats", en vivo).
  const unreadChats = useUnreadChats();

  function openLogin() {
    navigation.closeDrawer();
    router.push('/auth/login');
  }

  function go(href: ClientRoute) {
    // Invitado tocando una sección con cuenta → a iniciar sesión.
    if (isGuest && href !== '/home') {
      openLogin();
      return;
    }
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
    <View className="flex-1 bg-card">
      {/* Cabecera de marca */}
      <View
        className="bg-dark px-5 pb-5"
        style={{ paddingTop: insets.top + 20 }}
      >
        <Text className="text-2xl font-extrabold text-primary">Mándalo</Text>
        <Text className="mt-0.5 text-[11px] font-bold uppercase tracking-widest text-white/60">
          LO PIDES, LO MANDAMOS.
        </Text>

        {/* Tarjeta del usuario: logueado abre Mi perfil; invitado, el login. */}
        <Pressable
          onPress={() => (isGuest ? openLogin() : go('/profile'))}
          className="mt-4 flex-row items-center gap-3 active:opacity-70"
        >
          <Avatar
            uri={user?.avatarUrl}
            fallbackSource={DEFAULT_USER_AVATAR}
            label={user?.fullName}
            icon={isGuest ? 'person' : undefined}
            tone="solid"
          />
          <View className="flex-1">
            <Text numberOfLines={1} className="text-sm font-bold text-white">
              {isGuest ? 'Invitado' : (user?.fullName ?? 'Mi cuenta')}
            </Text>
            <Text numberOfLines={1} className="text-xs text-white/60">
              {isGuest ? 'Inicia sesión o regístrate' : 'Editar mi perfil'}
            </Text>
          </View>
          <Ionicons
            name={isGuest ? 'log-in-outline' : 'create-outline'}
            size={18}
            color="#FFFFFF"
          />
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
                color={active ? colors.primaryColor : colors.mutedColor}
              />
              <Text
                className={`text-[15px] ${
                  active ? 'font-extrabold text-primary' : 'font-medium text-ink'
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

      {/* Invitado: iniciar sesión · Logueado: cerrar sesión */}
      <View
        className="border-t border-border px-3 pt-3"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        {isGuest ? (
          <Pressable
            onPress={openLogin}
            className="flex-row items-center gap-3 rounded-xl px-3.5 py-3 active:opacity-70"
          >
            <Ionicons name="log-in-outline" size={21} color={colors.primaryColor} />
            <Text className="text-[15px] font-bold text-primary">
              Iniciar sesión / Registrarse
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={handleLogout}
            disabled={signingOut}
            className="flex-row items-center gap-3 rounded-xl px-3.5 py-3 active:opacity-70"
          >
            {signingOut ? (
              <ActivityIndicator size="small" color={colors.primaryColor} />
            ) : (
              <Ionicons name="log-out-outline" size={21} color={colors.primaryColor} />
            )}
            <Text className="text-[15px] font-bold text-primary">
              Cerrar sesión
            </Text>
          </Pressable>
        )}
        <DeveloperCredit />
      </View>
    </View>
  );
}
