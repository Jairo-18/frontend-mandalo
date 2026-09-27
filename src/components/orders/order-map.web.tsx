import { OrderMapFallback } from '@/components/orders/order-map-fallback';
import { Order } from '@/services/orders';

type Props = {
  order: Order;
  /** delivery = el repartidor (ve su punto azul); client = ve la moto en vivo. */
  perspective: 'client' | 'delivery';
};

/**
 * Versión WEB del mapa del pedido (`react-native-maps` es módulo nativo y no
 * existe en el navegador — Metro elige este archivo automáticamente al
 * compilar para web). La tarjeta de enlaces vive en `order-map-fallback.tsx`,
 * compartida con el caso de Android sin Google Mobile Services (Huawei).
 *
 * `perspective` no aplica: sin MapView no hay punto azul del repartidor.
 */
export function OrderMap({ order }: Props) {
  return <OrderMapFallback order={order} reason="web" />;
}
