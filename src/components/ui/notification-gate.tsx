import { Ionicons } from '@expo/vector-icons';
import { usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';
import { useSession } from '@/hooks/use-session';
import {
  NotifyStatus,
  refreshNotifyStatus,
  requestNotifyPermission,
  useNotifyStatus,
} from '@/lib/push';
import { signOutEverywhere } from '@/lib/sign-out';

/**
 * Pantalla que exige permitir las notificaciones (y que suenen) al tener
 * sesión en el teléfono. Montada en el layout raíz, encima de todo.
 *
 * - **Negocio y repartidor**: bloqueante. Sin avisos no se enteran de los
 *   pedidos; no hay "Ahora no", solo permitir (o cerrar sesión cuando ya hay
 *   que ir a Ajustes).
 * - **Cliente y admin**: se muestra en cada arranque, pero tras pasar por el
 *   diálogo del sistema pueden seguir con "Ahora no". Apple (guía 4.5.4) no
 *   deja exigir notificaciones para usar la app, y su revisor entra como
 *   cliente.
 *
 * En el estado `ask` NUNCA hay salida antes del diálogo del sistema (Apple
 * 5.1.1(iv): un aviso previo a un permiso no puede evitar el diálogo nativo).
 *
 * Al volver de Ajustes (AppState `active`) se vuelve a leer el permiso: si lo
 * activó, la pantalla desaparece sola.
 */

const BLOCKING_ROLES = new Set(['NEGO', 'DELI']);

const COPY: Record<
  Exclude<NotifyStatus, 'checking' | 'ok'>,
  { title: string; message: string; action: string }
> = {
  ask: {
    title: 'Activa las notificaciones',
    message:
      'Mandalo te avisa con sonido cuando entra un pedido, cuando cambia de estado y cuando te escriben por el chat. A continuación tu teléfono te va a pedir el permiso: tócale "Permitir".',
    action: 'Continuar',
  },
  settings: {
    title: 'Las notificaciones están apagadas',
    message:
      Platform.OS === 'ios'
        ? 'Sin ellas no te vas a enterar de los pedidos ni de los mensajes. Toca "Abrir ajustes", entra a Notificaciones y activa "Permitir notificaciones" y "Sonidos".'
        : 'Sin ellas no te vas a enterar de los pedidos ni de los mensajes. Toca "Abrir ajustes" y activa las notificaciones de Mandalo.',
    action: 'Abrir ajustes',
  },
  muted: {
    title: 'Las notificaciones no tienen sonido',
    message:
      Platform.OS === 'ios'
        ? 'Los avisos de Mandalo llegan en silencio. Toca "Abrir ajustes", entra a Notificaciones y activa "Sonidos".'
        : 'Los avisos de "Pedidos y mensajes" están en silencio. Toca "Abrir ajustes" y activa el sonido (y "Mostrar en pantalla" si aparece).',
    action: 'Abrir ajustes',
  },
};

export function NotificationGate() {
  const session = useSession();
  const role = session?.user.role?.code ?? '';
  const loggedIn = !!session;
  const status = useNotifyStatus();
  const pathname = usePathname();
  const colors = useResolvedAppColors();
  const insets = useSafeAreaInsets();
  const [working, setWorking] = useState(false);
  const [leaving, setLeaving] = useState(false);
  // "Ahora no" vale solo para esta corrida de la app: vuelve a salir al abrirla.
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!loggedIn) return;
    void refreshNotifyStatus();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshNotifyStatus();
    });
    return () => sub.remove();
  }, [loggedIn]);

  const blocking = BLOCKING_ROLES.has(role);
  if (
    !loggedIn ||
    status === 'checking' ||
    status === 'ok' ||
    // Login, registro y aceptar términos van primero.
    pathname.startsWith('/auth') ||
    (dismissed && !blocking)
  ) {
    return null;
  }

  const copy = COPY[status];
  const canSkip = !blocking && status !== 'ask';
  const canLogout = blocking && status !== 'ask';

  async function handleAction() {
    setWorking(true);
    try {
      await requestNotifyPermission();
    } finally {
      setWorking(false);
    }
  }

  async function handleLogout() {
    setLeaving(true);
    await signOutEverywhere();
    setLeaving(false);
  }

  return (
    <View
      className="absolute inset-0 bg-surface"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom, zIndex: 1000, elevation: 1000 }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
      >
        <View className="mb-4 h-16 w-16 items-center justify-center self-center rounded-full bg-primary-tint">
          <Ionicons
            name={status === 'muted' ? 'volume-mute-outline' : 'notifications-outline'}
            size={34}
            color={colors.primaryColor}
          />
        </View>
        <Text className="text-center text-[22px] font-extrabold text-ink">
          {copy.title}
        </Text>
        <Text className="mb-6 mt-2 text-center text-sm leading-5 text-muted">
          {copy.message}
        </Text>
        {blocking && (
          <Text className="mb-6 text-center text-[13px] font-bold text-ink">
            {role === 'NEGO'
              ? 'Para recibir pedidos en tu negocio es obligatorio.'
              : 'Para recibir pedidos como repartidor es obligatorio.'}
          </Text>
        )}

        <Button label={copy.action} onPress={handleAction} loading={working} />

        {canSkip && (
          <Pressable
            onPress={() => setDismissed(true)}
            className="mt-4 items-center py-2 active:opacity-70"
          >
            <Text className="text-[13px] font-bold text-muted">Ahora no</Text>
          </Pressable>
        )}

        {canLogout && (
          <Pressable
            onPress={handleLogout}
            disabled={leaving}
            className="mt-4 flex-row items-center justify-center gap-2 py-2 active:opacity-70"
          >
            {leaving ? (
              <ActivityIndicator size="small" color={colors.mutedColor} />
            ) : (
              <Ionicons name="log-out-outline" size={16} color={colors.mutedColor} />
            )}
            <Text className="text-[13px] font-bold text-muted">Cerrar sesión</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}
