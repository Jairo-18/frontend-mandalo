import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MenuButton } from '@/components/client/menu-button';
import { DeliveryOrders } from '@/components/delivery/delivery-orders';
import { Button } from '@/components/ui/button';
import { PanelHeader } from '@/components/ui/panel-header';
import { useSession } from '@/hooks/use-session';
import { setSession } from '@/lib/session';
import { signOutEverywhere } from '@/lib/sign-out';
import { toast } from '@/lib/toast';
import { authService } from '@/services/auth';

/**
 * Pedidos del repartidor (sección principal del panel DELI; el guard por rol
 * vive en el _layout del drawer). Mientras un admin no active la cuenta
 * (`isActive`) muestra "Cuenta en proceso de habilitación" con la nota del
 * admin si la hay; al activarla, las pestañas Disponibles / Mis entregas.
 */
export default function DeliveryScreen() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [checking, setChecking] = useState(false);

  // Reactiva: setSession (al consultar estado) re-renderiza solo, sin trucos
  // (regla React Compiler: no leer getSession() suelto en el render).
  const session = useSession();
  const user = session?.user;

  const pending = user?.isActive === false;

  /** Consulta si el admin ya activó la cuenta (refresca la sesión). */
  async function checkStatus() {
    if (!session) return;
    setChecking(true);
    try {
      const res = await authService.refreshToken(session.refreshToken);
      await setSession({
        ...res.data.tokens,
        user: res.data.user,
        accessSessionId: session.accessSessionId,
      });
      if (res.data.user.isActive === false) {
        toast.error('Tu cuenta aún está en revisión. Te avisaremos pronto.');
      }
    } catch {
      toast.error('No se pudo consultar el estado. Intenta de nuevo.');
    } finally {
      setChecking(false);
    }
  }

  async function handleLogout() {
    setSigningOut(true);
    await signOutEverywhere();
    setSigningOut(false);
    router.replace('/auth/login');
  }

  // Cuenta activa: panel de pedidos (disponibles + mis entregas).
  if (!pending) {
    return (
      <SafeAreaView className="flex-1 bg-dark" edges={['top']}>
        <StatusBar style="light" />
        <View className="flex-1 bg-surface">
          <PanelHeader
            title="Repartir"
            subtitle="Panel del repartidor"
            menu={<MenuButton parent="/delivery" />}
          />
          <DeliveryOrders />
        </View>
      </SafeAreaView>
    );
  }

  // Cuenta en proceso de habilitación (el drawer sigue disponible: el perfil
  // se puede editar mientras el admin revisa).
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-dark">
      <StatusBar style="light" />
      <View className="flex-1 bg-white">
      <PanelHeader
        title="Repartir"
        subtitle="Panel del repartidor"
        menu={<MenuButton parent="/delivery" />}
      />
      <View className="flex-1 items-center justify-center px-8">
        <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-primary-tint">
          <Ionicons name="hourglass-outline" size={40} color="#FF5A3C" />
        </View>
        <Text className="text-center text-2xl font-extrabold text-dark">
          Cuenta en proceso de habilitación
        </Text>
        <Text className="mt-3 text-center text-sm leading-5 text-muted">
          Un administrador está verificando tus datos y las fotos de tu
          documento. Cuando tu cuenta esté activa podrás empezar a trabajar con
          Mándalo.
        </Text>

        {/* Nota del admin (p. ej. "la foto de la cédula está borrosa") */}
        {!!user?.observations && (
          <View className="mt-5 w-full flex-row gap-2.5 rounded-2xl bg-primary-tint p-4">
            <Ionicons
              name="information-circle-outline"
              size={20}
              color="#FF5A3C"
            />
            <Text className="flex-1 text-[13px] leading-5 text-dark">
              {user.observations}
            </Text>
          </View>
        )}

        <View className="mt-8 w-full">
          <Button
            label="Consultar estado"
            onPress={checkStatus}
            loading={checking}
          />
        </View>

        <View className="mt-3 w-full">
          <Button
            label="Cerrar sesión"
            variant="outline"
            onPress={handleLogout}
            loading={signingOut}
          />
        </View>
      </View>
      </View>
    </SafeAreaView>
  );
}
