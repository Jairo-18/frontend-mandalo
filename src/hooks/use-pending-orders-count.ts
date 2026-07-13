import { useCallback, useEffect, useState } from 'react';

import { useOrderEvents } from '@/lib/orders-socket';
import { ordersService } from '@/services/orders';

/**
 * Contador de pedidos PENDIENTES del negocio (badge del sidebar NEGO).
 * Carga el total al montar y se refresca con los eventos del socket
 * `/orders` (`invoice:created` cuando entra un pedido, `invoice:updated`
 * cuando cambia de estado — aceptar/cancelar lo baja). Si el socket no
 * conecta, el contador queda con el valor de la carga inicial.
 */
export function usePendingOrdersCount(): number {
  const [count, setCount] = useState(0);

  const refresh = useCallback(() => {
    ordersService
      .pendingCount()
      .then(setCount)
      .catch(() => {
        // Silencioso: sin dato no se muestra badge (pendingCount no toastea).
      });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useOrderEvents(refresh);

  return count;
}
