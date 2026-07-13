import { Order } from '@/services/orders';

export type OrderEtaInfo = {
  /** Qué se estima: cuándo estará listo o cuándo llega. */
  kind: 'ready' | 'arrival';
  /** Hora estimada. */
  at: Date;
  /** Minutos que faltan (0 si ya se cumplió). */
  minutesLeft: number;
  /** Ya pasó la hora estimada. */
  overdue: boolean;
};

/** "3:45 p. m." — hora corta local. */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-CO', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Estimado vigente del pedido según su estado: mientras se acepta/prepara,
 * la hora a la que estará listo (compromiso del negocio al aceptar); en
 * camino, la hora estimada de llegada. `now` viene de afuera para que el
 * componente que lo muestra pueda "tictaquear" y refrescar los minutos.
 */
export function orderEta(order: Order, now: Date = new Date()): OrderEtaInfo | null {
  const code = order.stateType?.code;

  if (
    (code === 'ACEP' || code === 'PREP') &&
    order.acceptedAt &&
    order.prepEstimatedMinutes
  ) {
    const at = addMinutes(new Date(order.acceptedAt), order.prepEstimatedMinutes);
    return withCountdown('ready', at, now);
  }

  if (code === 'RUTA' && order.onRouteAt && order.deliveryEstimatedMinutes) {
    const at = addMinutes(new Date(order.onRouteAt), order.deliveryEstimatedMinutes);
    return withCountdown('arrival', at, now);
  }

  return null;
}

/**
 * Texto del estimado según quién lo mira. El cliente ve la promesa; el
 * negocio ve SU compromiso corriendo; el repartidor ve cuándo estará listo
 * el pedido (para saber cuándo ir por él).
 */
export function etaText(
  eta: OrderEtaInfo,
  perspective: 'client' | 'business' | 'delivery',
): string {
  const time = formatTime(eta.at);

  if (eta.kind === 'arrival') {
    if (eta.overdue) return 'Tu pedido está por llegar.';
    return perspective === 'client'
      ? `Llega aprox. a las ${time} (~${eta.minutesLeft} min)`
      : `Entrega estimada: ${time} (~${eta.minutesLeft} min)`;
  }

  // kind === 'ready' (aceptado / en preparación)
  if (perspective === 'business') {
    return eta.overdue
      ? 'El tiempo prometido se cumplió — el pedido debería estar listo.'
      : `Prometiste tenerlo listo a las ${time} (quedan ${eta.minutesLeft} min)`;
  }
  if (perspective === 'delivery') {
    return eta.overdue
      ? 'Ya debería estar listo — ve por él.'
      : `Estará listo aprox. a las ${time} (~${eta.minutesLeft} min)`;
  }
  return eta.overdue
    ? 'El negocio está terminando tu pedido…'
    : `Listo aprox. a las ${time} (~${eta.minutesLeft} min)`;
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

function withCountdown(
  kind: OrderEtaInfo['kind'],
  at: Date,
  now: Date,
): OrderEtaInfo {
  const minutesLeft = Math.max(0, Math.ceil((at.getTime() - now.getTime()) / 60_000));
  return { kind, at, minutesLeft, overdue: minutesLeft === 0 };
}
