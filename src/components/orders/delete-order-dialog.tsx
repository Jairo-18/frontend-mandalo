import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { DialogOverlay } from '@/components/ui/dialog-overlay';
import { stateMeta } from '@/lib/order-status';
import { formatPrice } from '@/lib/price';
import { Order } from '@/services/orders';

type Props = {
  /** Pedido a eliminar; null oculta el diálogo. */
  order: Order | null;
  /** Si devuelve promesa, muestra spinner y bloquea hasta que termine. */
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

/**
 * Confirmación para ELIMINAR un pedido (solo admin/superadmin, para limpiar
 * pedidos de prueba). Avisa que es definitivo y que cambia la contabilidad, y
 * exige marcar "Entiendo" antes de habilitar el botón. Usa `DialogOverlay`
 * porque se abre dentro del `OrderDetailModal`. El caller le pone
 * `key={order?.id}` para que "Entiendo" arranque desmarcado en cada pedido.
 */
export function DeleteOrderDialog({ order, onConfirm, onCancel }: Props) {
  const [understood, setUnderstood] = useState(false);
  const [working, setWorking] = useState(false);

  const delivered = order?.stateType?.code === 'ENTR';

  async function confirm() {
    if (!understood || working) return;
    try {
      setWorking(true);
      await onConfirm();
    } catch {
      // El interceptor HTTP ya mostró el error.
    } finally {
      setWorking(false);
    }
  }

  return (
    <DialogOverlay visible={order != null} onBackdropPress={working ? undefined : onCancel}>
      <View className="rounded-3xl border border-border bg-card p-6">
        <View className="mb-4 h-14 w-14 items-center justify-center self-center rounded-full bg-red-50">
          <Ionicons name="trash-outline" size={26} color="#DC2626" />
        </View>

        <Text className="text-center text-lg font-extrabold text-ink">
          ¿Eliminar el pedido #{order?.id}?
        </Text>
        {!!order && (
          <Text className="mt-1 text-center text-[13px] text-muted">
            {stateMeta(order.stateType?.code ?? '').label} · {formatPrice(order.total)}
          </Text>
        )}

        <View className="mt-4 gap-2 rounded-2xl bg-red-50 p-3.5">
          <WarningLine text="No se puede deshacer: el pedido, sus artículos y su chat se borran para siempre." />
          <WarningLine
            text={
              delivered
                ? 'Afecta la contabilidad: deja de sumar en las ventas, la comisión y lo que el negocio debe entregar, y en las ganancias del repartidor.'
                : 'Afecta la contabilidad y las estadísticas: el pedido desaparece de todos los reportes.'
            }
          />
          <WarningLine text="Úsalo solo para pedidos de prueba o creados por error." />
        </View>

        <Pressable
          onPress={() => setUnderstood((v) => !v)}
          disabled={working}
          className="mt-4 flex-row items-center gap-2.5 active:opacity-70"
        >
          <Ionicons
            name={understood ? 'checkbox' : 'square-outline'}
            size={22}
            color={understood ? '#DC2626' : '#9CA3AF'}
          />
          <Text className="flex-1 text-[13px] font-semibold text-ink">
            Entiendo que esta acción es definitiva.
          </Text>
        </Pressable>

        <View className="mt-6 flex-row gap-3">
          <Pressable
            onPress={onCancel}
            disabled={working}
            className={`h-[48px] flex-1 items-center justify-center rounded-2xl border border-border active:opacity-70 ${
              working ? 'opacity-50' : ''
            }`}
          >
            <Text className="text-[15px] font-bold text-ink">Volver</Text>
          </Pressable>
          <Pressable
            onPress={confirm}
            disabled={working || !understood}
            className={`h-[48px] flex-1 items-center justify-center rounded-2xl bg-red-600 active:opacity-80 ${
              !understood ? 'opacity-50' : ''
            }`}
          >
            {working ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-[15px] font-bold text-white">Eliminar</Text>
            )}
          </Pressable>
        </View>
      </View>
    </DialogOverlay>
  );
}

function WarningLine({ text }: { text: string }) {
  return (
    <View className="flex-row gap-2">
      <Ionicons name="alert-circle" size={16} color="#DC2626" style={{ marginTop: 1 }} />
      <Text className="flex-1 text-[12px] leading-4 text-red-700">{text}</Text>
    </View>
  );
}
