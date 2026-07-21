import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MenuButton } from '@/components/client/menu-button';
import { DeliveryOrders } from '@/components/delivery/delivery-orders';
import { Button } from '@/components/ui/button';
import { PanelHeader } from '@/components/ui/panel-header';
import { useSession } from '@/hooks/use-session';
import { deviceStoreGet, deviceStoreSet } from '@/lib/device-store';
import { setSession } from '@/lib/session';
import { signOutEverywhere } from '@/lib/sign-out';
import { toast } from '@/lib/toast';
import { authService } from '@/services/auth';

// La revisión la hace un admin a mano — no tiene sentido dejar consultar cada
// pocos segundos (y evita pegarle al throttle de refresh-token del backend).
const STATUS_CHECK_COOLDOWN_MS = 60 * 60 * 1000; // 1 hora

/** Minutos/horas legibles para el countdown del botón "Consultar estado". */
function formatCooldown(ms: number): string {
  const totalMinutes = Math.max(1, Math.ceil(ms / 60000));
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes ? `${hours} h ${minutes} min` : `${hours} h`;
}

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
  // Epoch ms desde el que se puede volver a consultar (null = sin cooldown activo).
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // Reactiva: setSession (al consultar estado) re-renderiza solo, sin trucos
  // (regla React Compiler: no leer getSession() suelto en el render).
  const session = useSession();
  const user = session?.user;

  const pending = user?.isActive === false;
  const cooldownKey = user?.id ? `mandalo_deli_status_check_at_${user.id}` : null;

  // Al entrar a la pantalla, recupera el último "Consultar estado" (persiste
  // entre reaperturas de la app, por eso va en el device-store y no en estado).
  useEffect(() => {
    if (!pending || !cooldownKey) return;
    deviceStoreGet(cooldownKey).then((stored) => {
      const lastCheckedAt = stored ? Number(stored) : 0;
      const until = lastCheckedAt + STATUS_CHECK_COOLDOWN_MS;
      if (until > Date.now()) setCooldownUntil(until);
    });
  }, [pending, cooldownKey]);

  // Cuenta regresiva del botón: se refresca cada minuto mientras hay cooldown.
  useEffect(() => {
    if (!cooldownUntil) return;
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, [cooldownUntil]);

  const remainingMs = cooldownUntil ? cooldownUntil - now : 0;
  const inCooldown = remainingMs > 0;

  /** Consulta si el admin ya activó la cuenta (refresca la sesión). */
  async function checkStatus() {
    if (!session || inCooldown) return;
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
        if (cooldownKey) {
          const checkedAt = Date.now();
          await deviceStoreSet(cooldownKey, String(checkedAt));
          setCooldownUntil(checkedAt + STATUS_CHECK_COOLDOWN_MS);
          setNow(checkedAt);
        }
      }
    } catch {
      toast.error('No se pudo consultar el estado. Intenta de nuevo.');
    } finally {
      setChecking(false);
    }
  }

  async function handleLogout() {
    setSigningOut(true);
    // Navega al login por dentro, con el overlay "Cerrando sesión…".
    await signOutEverywhere();
    setSigningOut(false);
  }

  // Cuenta activa: panel de pedidos (disponibles + mis entregas).
  if (!pending) {
    return (
      <SafeAreaView className="flex-1 bg-dark" edges={['top']}>
        <StatusBar style="light" />
        <View className="flex-1 bg-surface">
          <PanelHeader
            title="Repartir"
            subtitle="Panel del domiciliario"
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
        subtitle="Panel del domiciliario"
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
            label={
              inCooldown
                ? `Disponible en ${formatCooldown(remainingMs)}`
                : 'Consultar estado'
            }
            onPress={checkStatus}
            loading={checking}
            disabled={inCooldown}
          />
        </View>
        <Text className="mt-2 text-center text-xs leading-4 text-muted">
          La revisión la hace un administrador y puede tardar. También se
          consulta sola cada vez que cierras y vuelves a abrir la app.
        </Text>

        <View className="mt-3 w-full">
          <Button
            label="Reenviar documentos"
            variant="outline"
            onPress={() => router.push('/delivery/resend-documents')}
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
