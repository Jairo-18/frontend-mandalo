import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { UserFormModal } from '@/components/admin/user-form-modal';
import { Avatar } from '@/components/ui/avatar';
import { useSession } from '@/hooks/use-session';
import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';
import { getSession, setSession } from '@/lib/session';
import { DeveloperCredit } from '@/components/ui/developer-credit';
import { AdminUser, adminUsersService } from '@/services/admin-users';
import { DEFAULT_USER_AVATAR } from '@/lib/default-images';
import { useUnreviewedAccidentsCount } from '@/hooks/use-unreviewed-accidents-count';

type AdminRoute =
  | '/admin/dashboard'
  | '/admin/orders'
  | '/admin/businesses'
  | '/admin/users'
  | '/admin/deliveries'
  | '/admin/accidents'
  | '/admin/tags'
  | '/admin/categories'
  | '/admin/bulk-invite'
  | '/admin/app-settings';

type Item = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: AdminRoute;
};

/** Secciones del panel de administración (orden del sidebar). */
const ITEMS: Item[] = [
  { label: 'Inicio', icon: 'home-outline', href: '/admin/dashboard' },
  { label: 'Pedidos', icon: 'receipt-outline', href: '/admin/orders' },
  { label: 'Negocios', icon: 'storefront-outline', href: '/admin/businesses' },
  { label: 'Usuarios', icon: 'people-outline', href: '/admin/users' },
  { label: 'Domiciliarios', icon: 'bicycle-outline', href: '/admin/deliveries' },
  { label: 'Accidentes', icon: 'warning-outline', href: '/admin/accidents' },
  { label: 'Etiquetas', icon: 'pricetags-outline', href: '/admin/tags' },
  { label: 'Categorías', icon: 'grid-outline', href: '/admin/categories' },
  { label: 'Alta masiva', icon: 'people-circle-outline', href: '/admin/bulk-invite' },
  { label: 'Aplicación', icon: 'color-palette-outline', href: '/admin/app-settings' },
];

// Lo único que se usa de las props del drawer (evita el choque de tipos entre
// expo-router y @react-navigation/drawer).
type Props = { navigation: { closeDrawer: () => void } };

/**
 * Sidebar del panel admin: cabecera con la marca y el usuario autenticado
 * (tocarla abre "Editar mi perfil", que también trae "Cerrar sesión"),
 * navegación por secciones y el link a "¿Necesitas ayuda?" abajo.
 */
export function AdminDrawerContent({ navigation }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const colors = useResolvedAppColors();

  // Edición del propio perfil: se abre desde la tarjeta del usuario.
  const [profileVisible, setProfileVisible] = useState(false);
  const [profileUser, setProfileUser] = useState<AdminUser | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  // Nombre/foto de la cabecera se refrescan tras guardar (la sesión es en memoria).
  const [headerName, setHeaderName] = useState<string>();
  const [headerAvatar, setHeaderAvatar] = useState<string | null>();

  // Reactivo: leer getSession() suelto en el render deja JSX viejo con
  // React Compiler (regla de NOTAS §23).
  const user = useSession()?.user;
  const unreviewedAccidents = useUnreviewedAccidentsCount();
  const displayName = headerName ?? user?.fullName ?? 'Administrador';
  const avatarUrl =
    headerAvatar !== undefined ? headerAvatar : (user?.avatarUrl ?? null);

  function go(href: AdminRoute) {
    navigation.closeDrawer();
    if (pathname !== href) router.navigate(href);
  }

  async function openProfile() {
    if (!user?.id || loadingProfile) return;
    setLoadingProfile(true);
    try {
      const res = await adminUsersService.getById(user.id);
      setProfileUser(res.data);
      setProfileVisible(true);
    } catch {
      // El interceptor HTTP ya mostró el error.
    } finally {
      setLoadingProfile(false);
    }
  }

  async function handleProfileSaved() {
    setProfileVisible(false);
    // Refresca nombre y foto de la cabecera y la sesión persistida.
    try {
      const res = await adminUsersService.getById(user!.id);
      setHeaderName(res.data.fullName);
      setHeaderAvatar(res.data.avatarUrl);
      const s = getSession();
      if (s) {
        await setSession({
          ...s,
          user: {
            ...s.user,
            fullName: res.data.fullName,
            avatarUrl: res.data.avatarUrl,
          },
        });
      }
    } catch {
      // No pasa nada: se actualiza en el próximo inicio.
    }
  }

  return (
    <View className="flex-1 bg-card">
      {/* Cabecera de marca */}
      <LinearGradient
        colors={[colors.primaryColor, colors.darkColor]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ paddingTop: insets.top + 20 }}
      >
      <View className="px-5 pb-5">
        {/* Blanco (no text-primary): con el degradado primary→dark de fondo,
            el rojo de marca se perdía justo al inicio del texto, donde el
            fondo también es primary. */}
        <Text className="text-2xl font-extrabold text-white">Mandalo</Text>
        <Text className="mt-0.5 text-[11px] font-bold uppercase tracking-widest text-white/60">
          Panel de administración
        </Text>

        {/* Tarjeta del usuario: tocarla abre la edición del propio perfil */}
        <Pressable
          onPress={openProfile}
          disabled={loadingProfile}
          className="mt-4 flex-row items-center gap-3 active:opacity-70"
        >
          <Avatar
            uri={avatarUrl}
            fallbackSource={DEFAULT_USER_AVATAR}
            label={displayName}
            size={40}
            tone="solid"
          />
          <View className="flex-1">
            <Text numberOfLines={1} className="text-sm font-bold text-white">
              {displayName}
            </Text>
            <Text className="text-xs text-white/60">
              {user?.role?.name ?? 'Administrador'} · Editar mi perfil
            </Text>
          </View>
          {loadingProfile ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="create-outline" size={18} color="#FFFFFF" />
          )}
        </Pressable>
      </View>
      </LinearGradient>

      {/* Navegación */}
      <View className="flex-1 px-3 pt-4">
        {ITEMS.map((item) => {
          const active = pathname === item.href;
          const badge = item.href === '/admin/accidents' ? unreviewedAccidents : 0;
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
                className={`flex-1 text-[15px] ${
                  active ? 'font-extrabold text-primary' : 'font-medium text-ink'
                }`}
              >
                {item.label}
              </Text>
              {badge > 0 && (
                <View className="min-w-[22px] items-center rounded-full bg-primary px-1.5 py-0.5">
                  <Text className="text-[11px] font-extrabold text-white">
                    {badge > 99 ? '99+' : badge}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Ayuda: guía de uso + legales, agrupados en una sola pantalla aparte
          (antes eran 3 botones sueltos acá, muy apretado). "Cerrar sesión" se
          movió a la edición del propio perfil (tarjeta de arriba). */}
      <View
        className="border-t border-border px-3 pt-3"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <Pressable
          onPress={() => {
            navigation.closeDrawer();
            router.push('/help');
          }}
          className="flex-row items-center gap-3 rounded-xl px-3.5 py-3 active:opacity-70"
        >
          <Ionicons name="help-circle-outline" size={21} color={colors.mutedColor} />
          <Text className="flex-1 text-[15px] font-medium text-ink">
            ¿Necesitas ayuda?
          </Text>
        </Pressable>
        <DeveloperCredit />
      </View>

      <UserFormModal
        visible={profileVisible}
        roleCode="USER"
        entityName="perfil"
        editing={profileUser}
        selfProfile
        onClose={() => setProfileVisible(false)}
        onSaved={handleProfileSaved}
      />
    </View>
  );
}
