import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { etaText, orderEta } from '@/lib/order-eta';
import { Order } from '@/services/orders';

type Props = {
  order: Order;
  perspective: 'client' | 'business' | 'delivery';
  /** true = fila discreta para tarjetas; false = banner del detalle. */
  compact?: boolean;
};

/**
 * Estimado vigente del pedido ("listo aprox. a las…", "llega aprox. a las…")
 * según el rol que mira. Refresca los minutos cada 30 s mientras está
 * montado. No pinta nada si el estado no tiene estimado (PEND, ENTR, CANC).
 */
export function OrderEta({ order, perspective, compact = false }: Props) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const eta = orderEta(order, now);
  if (!eta) return null;

  const icon = eta.kind === 'arrival' ? 'bicycle-outline' : 'time-outline';
  const text = etaText(eta, perspective);

  if (compact) {
    return (
      <View className="mt-2 flex-row items-center gap-1.5 rounded-xl bg-primary-tint px-3 py-2">
        <Ionicons name={icon} size={14} color="#FF5A3C" />
        <Text className="flex-1 text-xs font-semibold text-primary">{text}</Text>
      </View>
    );
  }

  return (
    <View className="mt-3 flex-row items-center gap-2.5 rounded-2xl bg-primary-tint p-3.5">
      <Ionicons name={icon} size={20} color="#FF5A3C" />
      <Text className="flex-1 text-[13px] font-bold text-primary">{text}</Text>
    </View>
  );
}
