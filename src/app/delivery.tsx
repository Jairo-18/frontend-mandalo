import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { getSession, setSession } from '@/lib/session';
import { signOutEverywhere } from '@/lib/sign-out';
import { toast } from '@/lib/toast';
import { authService } from '@/services/auth';

/**
 * Vista del repartidor (rol DELI). Mientras un admin no active la cuenta
 * (`isActive`) muestra "Cuenta en proceso de habilitación" con la nota del
 * admin si la hay; al activarla, el panel de pedidos cercanos (pendiente,
 * llega con el módulo de pedidos).
 */
export default function DeliveryScreen() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [checking, setChecking] = useState(false);
  // La sesión en memoria cambia al refrescar; esto fuerza el re-render.
  const [, forceRender] = useState(0);

  const session = getSession();
  const user = session?.user;

  // Guard: solo cuentas con rol DELI.
  const role = user?.role?.code;
  if (role !== 'DELI') {
    if (role === 'ADMIN') return <Redirect href="/admin/users" />;
    if (role === 'NEGO') return <Redirect href="/business/products" />;
    return <Redirect href="/home" />;
  }

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
      forceRender((n) => n + 1);
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

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="flex-1 items-center justify-center px-8">
        {pending ? (
          <>
            <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-primary-tint">
              <Ionicons name="hourglass-outline" size={40} color="#FF5A3C" />
            </View>
            <Text className="text-center text-2xl font-extrabold text-dark">
              Cuenta en proceso de habilitación
            </Text>
            <Text className="mt-3 text-center text-sm leading-5 text-muted">
              Un administrador está verificando tus datos y las fotos de tu
              documento. Cuando tu cuenta esté activa podrás empezar a
              trabajar con Mándalo.
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
          </>
        ) : (
          <>
            <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-primary-tint">
              <Ionicons name="bicycle" size={40} color="#FF5A3C" />
            </View>
            <Text className="text-center text-2xl font-extrabold text-dark">
              ¡Tu cuenta está activa!
            </Text>
            <Text className="mt-3 text-center text-sm leading-5 text-muted">
              Muy pronto vas a ver aquí los pedidos de los negocios cercanos
              para empezar a repartir.
            </Text>
          </>
        )}

        <View className="mt-3 w-full">
          <Button
            label="Cerrar sesión"
            variant="outline"
            onPress={handleLogout}
            loading={signingOut}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
