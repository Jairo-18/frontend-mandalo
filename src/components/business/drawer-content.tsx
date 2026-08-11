import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { Avatar } from '@/components/ui/avatar';
import { DeveloperCredit } from '@/components/ui/developer-credit';
import { useMyBusiness } from '@/hooks/use-my-business';
import { usePendingOrdersCount } from '@/hooks/use-pending-orders-count';
import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';
import { useSession } from '@/hooks/use-session';
import { refreshMyBusiness } from '@/lib/my-business';
import { signOutEverywhere } from '@/lib/sign-out';
import { DEFAULT_BUSINESS_LOGO } from '@/lib/default-images';

type BusinessRoute =
  | '/business/dashboard'
  | '/business/products'
  | '/business/orders'
  | '/business/earnings'
  | '/business/profile';

type Item = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: BusinessRoute;
};

/** Secciones del panel del negocio. */
const ITEMS: Item[] = [
  { label: 'Inicio', icon: 'grid-outline', href: '/business/dashboard' },
  { label: 'Productos', icon: 'cube-outline', href: '/business/products' },
  { label: 'Pedidos', icon: 'receipt-outline', href: '/business/orders' },
  { label: 'Mis pagos', icon: 'cash-outline', href: '/business/earnings' },
  { label: 'Mi negocio', icon: 'storefront-outline', href: '/business/profile' },
];

// Lo único que se usa de las props del drawer (evita el choque de tipos entre
// expo-router y @react-navigation/drawer).
type Props = { navigation: { closeDrawer: () => void } };

/**
 * Sidebar del panel del negocio (rol NEGO): cabecera con el logo y el nombre
 * del negocio + el dueño/representante autenticado (tocarla abre "Mi
 * negocio"), navegación por secciones, cerrar sesión y el link a
 * "¿Necesitas ayuda?" abajo. Espejo del sidebar del panel admin.
 */
export function BusinessDrawerContent({ navigation }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const colors = useResolvedAppColors();
  const [signingOut, setSigningOut] = useState(false);

  // Negocio del usuario autenticado (nombre comercial + logo de la cabecera),
  // desde el store REACTIVO compartido con la pantalla "Mi negocio": al guardar
  // "Editar mi negocio" allí, esta cabecera se refresca sola.
  const business = useMyBusiness();

  // Reactivo: leer getSession() suelto en el render deja JSX viejo con
  // React Compiler (regla de NOTAS §23).
  const user = useSession()?.user;

  // Pedidos PENDIENTES en vivo (socket /orders) para el badge de "Pedidos".
  const pendingCount = usePendingOrdersCount();

  useEffect(() => {
    refreshMyBusiness();
  }, []);

  const businessName =
    business?.tradeName || business?.legalName || 'Mi negocio';

  function go(href: BusinessRoute) {
    navigation.closeDrawer();
    if (pathname !== href) router.navigate(href);
  }

  async function handleLogout() {
    setSigningOut(true);
    await signOutEverywhere();
    setSigningOut(false);
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
          Panel del negocio
        </Text>

        {/* Tarjeta del negocio: tocarla abre la pantalla "Mi negocio" */}
        <Pressable
          onPress={() => go('/business/profile')}
          className="mt-4 flex-row items-center gap-3 active:opacity-70"
        >
          <Avatar
            uri={business?.logoUrl}
            fallbackSource={DEFAULT_BUSINESS_LOGO}
            icon="storefront"
            shape="rounded"
            tone="solid"
          />
          <View className="flex-1">
            <Text numberOfLines={1} className="text-sm font-bold text-white">
              {businessName}
            </Text>
            <Text numberOfLines={1} className="text-xs text-white/60">
              {user?.fullName ?? 'Dueño/representante'} · Mi negocio
            </Text>
          </View>
          <Ionicons name="create-outline" size={18} color="#FFFFFF" />
        </Pressable>
      </View>
      </LinearGradient>

      {/* Navegación */}
      <View className="flex-1 px-3 pt-4">
        {ITEMS.map((item) => {
          const active = pathname === item.href;
          const badge = item.href === '/business/orders' ? pendingCount : 0;
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
      <View className="border-t border-border px-3 pt-3">
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
      </View>

      {/* Ayuda: guía de uso + legales, agrupados en una sola pantalla aparte
          (antes eran 3 botones sueltos acá, muy apretado). */}
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
    </View>
  );
}
