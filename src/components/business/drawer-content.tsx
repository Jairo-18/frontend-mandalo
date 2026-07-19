import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BusinessFormModal } from '@/components/admin/business-form-modal';
import { Avatar } from '@/components/ui/avatar';
import { DeveloperCredit } from '@/components/ui/developer-credit';
import { usePendingOrdersCount } from '@/hooks/use-pending-orders-count';
import { useSession } from '@/hooks/use-session';
import { signOutEverywhere } from '@/lib/sign-out';
import { AdminBusiness } from '@/services/admin-businesses';
import { businessService } from '@/services/business';

type BusinessRoute =
  | '/business/dashboard'
  | '/business/products'
  | '/business/orders';

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
];

// Lo único que se usa de las props del drawer (evita el choque de tipos entre
// expo-router y @react-navigation/drawer).
type Props = { navigation: { closeDrawer: () => void } };

/**
 * Sidebar del panel del negocio (rol NEGO): cabecera con el logo y el nombre
 * del negocio + el dueño/representante autenticado, navegación por secciones
 * y cierre de sesión abajo. Espejo del sidebar del panel admin.
 */
export function BusinessDrawerContent({ navigation }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [signingOut, setSigningOut] = useState(false);

  // Negocio del usuario autenticado (nombre comercial + logo de la cabecera).
  const [business, setBusiness] = useState<AdminBusiness | null>(null);
  // Edición del propio negocio: se abre desde la tarjeta de la cabecera.
  const [formVisible, setFormVisible] = useState(false);

  // Reactivo: leer getSession() suelto en el render deja JSX viejo con
  // React Compiler (regla de NOTAS §23).
  const user = useSession()?.user;

  // Pedidos PENDIENTES en vivo (socket /orders) para el badge de "Pedidos".
  const pendingCount = usePendingOrdersCount();

  const loadBusiness = useCallback(() => {
    businessService
      .getMine()
      .then((res) => setBusiness(res.data))
      .catch(() => {
        // El interceptor HTTP ya mostró el error (p. ej. cuenta sin negocio).
      });
  }, []);

  useEffect(() => {
    loadBusiness();
  }, [loadBusiness]);

  function handleSaved() {
    setFormVisible(false);
    // Refresca nombre/logo de la cabecera con lo recién guardado.
    loadBusiness();
  }

  const businessName =
    business?.tradeName || business?.legalName || 'Mi negocio';

  function go(href: BusinessRoute) {
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
          Panel del negocio
        </Text>

        {/* Tarjeta del negocio: tocarla abre la edición del propio negocio */}
        <Pressable
          onPress={() => business && setFormVisible(true)}
          disabled={!business}
          className="mt-4 flex-row items-center gap-3 active:opacity-70"
        >
          <Avatar
            uri={business?.logoUrl}
            icon="storefront"
            shape="rounded"
            tone="solid"
          />
          <View className="flex-1">
            <Text numberOfLines={1} className="text-sm font-bold text-white">
              {businessName}
            </Text>
            <Text numberOfLines={1} className="text-xs text-white/60">
              {user?.fullName ?? 'Dueño/representante'}
              {business ? ' · Editar mi negocio' : ''}
            </Text>
          </View>
          {business && (
            <Ionicons name="create-outline" size={18} color="#FFFFFF" />
          )}
        </Pressable>
      </View>

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
                color={active ? '#FF5A3C' : '#7A7A8A'}
              />
              <Text
                className={`flex-1 text-[15px] ${
                  active ? 'font-extrabold text-primary' : 'font-medium text-dark'
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

      <BusinessFormModal
        visible={formVisible}
        editing={business}
        selfBusiness
        onClose={() => setFormVisible(false)}
        onSaved={handleSaved}
      />
    </View>
  );
}
