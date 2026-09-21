import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';
import {
  getNotifyPermission,
  NotifyPermission,
  requestNotifyPermission,
} from '@/lib/live-notify';

/**
 * Activa los avisos del navegador desde el perfil. Existe porque el permiso
 * SOLO se concede de forma fiable desde un gesto del usuario: pedirlo al
 * arrancar la app lo desperdicia (se puede preguntar una sola vez).
 *
 * Los cuatro estados se muestran distinto a propósito — "denegado" es el que
 * más confunde, porque desde la app ya no hay nada que hacer: el permiso se
 * revierte en la configuración del sitio, no acá.
 */
export function WebNotifyRow() {
  const colors = useResolvedAppColors();
  // Inicializador perezoso: se lee una sola vez y solo cambia cuando el propio
  // usuario concede/niega desde el botón de abajo. `getNotifyPermission()` ya
  // devuelve 'unsupported' si no hay `window`.
  const [permission, setPermission] = useState<NotifyPermission>(
    getNotifyPermission,
  );

  if (permission === 'unsupported') return null;

  if (permission === 'granted') {
    return (
      <View className="flex-row items-center gap-3 rounded-xl bg-surface px-3.5 py-3">
        <Ionicons name="notifications" size={20} color="#22C55E" />
        <Text className="flex-1 text-[14px] font-bold text-ink">
          Avisos del navegador activados
        </Text>
        <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
      </View>
    );
  }

  if (permission === 'denied') {
    return (
      <View className="rounded-xl bg-surface px-3.5 py-3">
        <View className="flex-row items-center gap-3">
          <Ionicons
            name="notifications-off-outline"
            size={20}
            color={colors.mutedColor}
          />
          <Text className="flex-1 text-[14px] font-bold text-ink">
            Avisos del navegador bloqueados
          </Text>
        </View>
        <Text className="mt-1 text-xs text-muted">
          Los bloqueaste para este sitio. Para volver a activarlos, usa el
          candado de la barra de direcciones → Notificaciones.
        </Text>
      </View>
    );
  }

  return (
    <Pressable
      onPress={() => void requestNotifyPermission().then(setPermission)}
      className="flex-row items-center gap-3 rounded-xl bg-surface px-3.5 py-3 active:opacity-70"
    >
      <Ionicons
        name="notifications-outline"
        size={20}
        color={colors.primaryColor}
      />
      <View className="flex-1">
        <Text className="text-[14px] font-bold text-ink">
          Activar avisos del navegador
        </Text>
        <Text className="mt-0.5 text-xs text-muted">
          Te avisamos de pedidos y mensajes con la pestaña en segundo plano.
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.mutedColor} />
    </Pressable>
  );
}
