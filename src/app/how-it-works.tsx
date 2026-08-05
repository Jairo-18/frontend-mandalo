import { HowItWorksScreen } from '@/components/help/how-it-works-screen';
import { useSession } from '@/hooks/use-session';

/**
 * "¿Cómo funciona Mandalo?" — se llega desde Mi perfil (cliente/repartidor)
 * o el sidebar (negocio). Muestra los pasos del rol de quien está logueado.
 */
export default function HowItWorksRoute() {
  const role = useSession()?.user.role?.code;
  return <HowItWorksScreen role={role === 'NEGO' ? 'business' : role === 'DELI' ? 'delivery' : 'client'} />;
}
