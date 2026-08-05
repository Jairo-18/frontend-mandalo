import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAppTheme } from '@/context/app-theme';
import { homePathFor } from '@/lib/session';
import { useSession } from '@/hooks/use-session';
import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';

type Role = 'client' | 'delivery' | 'business';

type Step = { title: string; body: string };

const CONTENT: Record<Role, { headline: string; sub: string; steps: Step[]; note: { label: string; body: string } }> = {
  client: {
    headline: 'Pide fácil, seguimos hasta tu puerta',
    sub: 'Desde que armas tu carrito hasta que recibes el pedido en la mano, todo se ve dentro de la app.',
    steps: [
      { title: 'Regístrate', body: 'Crea tu cuenta con tu correo o entra directo con Google.' },
      { title: 'Marca tu dirección', body: 'Activa el GPS y guarda tu casa como dirección principal — puedes agregar varias.' },
      { title: 'Explora negocios cerca de ti', body: 'El inicio te muestra restaurantes y tiendas de tu zona. Busca o filtra por categoría.' },
      { title: 'Arma tu pedido', body: 'Entra al negocio y agrega los productos que quieras al carrito.' },
      { title: 'Paga como prefieras', body: 'Efectivo, Nequi o transferencia. Si no es efectivo, subes el comprobante.' },
      { title: 'Sigue tu pedido en vivo', body: 'Mira el mapa mientras va en camino y escríbele al repartidor por el chat si necesitas.' },
      { title: 'Recíbelo con tu código', body: 'Cuando el repartidor llegue, dale el código de 4 dígitos que ves en tu pantalla.' },
      { title: 'Revisa tu historial', body: 'En "Mis pedidos" queda guardado todo lo que has pedido.' },
    ],
    note: {
      label: 'Ten a mano',
      body: 'Tu código de entrega es solo tuyo — nunca lo compartas por el chat, solo dáselo al repartidor en tu puerta.',
    },
  },
  delivery: {
    headline: 'Trabaja cuando quieras, gana por entrega',
    sub: 'Tomas los pedidos que te queden cerca y a tu ritmo — nadie te los asigna.',
    steps: [
      { title: 'Regístrate como repartidor', body: 'Sube tu foto, cédula (frente y atrás), licencia, placa y SOAT/tecnomecánica.' },
      { title: 'Espera la verificación', body: 'Un administrador revisa tus documentos, activa tu cuenta y te asigna tu número de ARL. Sin ese número no puedes ver pedidos.' },
      { title: 'Revisa "Disponibles"', body: 'Ahí ves los pedidos listos para recoger cerca de ti.' },
      { title: 'Toma un pedido', body: 'El primero que lo toque se lo queda.' },
      { title: 'Recógelo en el negocio', body: 'Dale tu código de recogida para confirmar que quedó en tus manos.' },
      { title: 'Llévalo a la dirección', body: 'Mientras vas en camino, tu ubicación se comparte en vivo con el cliente.' },
      { title: 'Marca "En sitio" al llegar', body: 'Es obligatorio para poder entregar — arranca un tiempo de espera de 5 minutos.' },
      { title: 'Pide el código de entrega', body: 'El cliente te lo dicta, lo digitas y el pedido queda entregado.' },
      { title: 'Si algo se complica', body: 'Pide 5 minutos más de espera, reporta que no se pudo entregar (con foto), o reporta un accidente si te pasa algo.' },
      { title: 'Revisa tus cobros', body: 'En "Mis cobros" ves cuánto ganaste por quincena, desglosado.' },
    ],
    note: {
      label: 'Seguridad',
      body: 'Si tienes un accidente, repórtalo desde el pedido: sube fotos, cuenta qué pasó y te mostramos tu código de ARL al instante. Los administradores quedan avisados de una vez.',
    },
  },
  business: {
    headline: 'Vende más sin salir de tu local',
    sub: 'Tu catálogo, tus horarios y tus pedidos, todo desde el panel del negocio.',
    steps: [
      { title: 'Recibe tus datos de acceso', body: 'Un administrador crea la cuenta de tu negocio y te comparte el correo y la contraseña.' },
      { title: 'Configura tu negocio', body: 'Sube tu logo, define tu horario y registra a dónde quieres que te transfieran.' },
      { title: 'Sube tu catálogo', body: 'Crea cada producto con foto, precio, descuento (si aplica) y categoría.' },
      { title: 'Recibe pedidos en vivo', body: 'Te llega un aviso apenas un cliente pide. Acéptalo y dile en cuántos minutos estará listo.' },
      { title: 'Verifica el pago si no es en efectivo', body: 'Revisa el comprobante que subió el cliente antes de preparar el pedido.' },
      { title: 'Prepáralo y despáchalo', body: 'Cuando el repartidor llegue, te dicta su código de recogida; lo digitas y sale "en camino".' },
      { title: 'Consulta tus cobros', body: 'En facturación ves cuánto has vendido y lo que le corresponde a Mandalo.' },
    ],
    note: {
      label: 'Importante',
      body: 'La razón social, el NIT, la ubicación y las etiquetas de tu negocio las administra Mandalo — cualquier cambio ahí lo pides al administrador.',
    },
  },
};

/**
 * "¿Cómo funciona Mandalo?" — versión nativa (dentro de la app) de la misma
 * guía que se comparte por fuera como página web. Muestra SOLO los pasos del
 * rol de la sesión (a diferencia de la página externa, que tiene las 3
 * pestañas, acá el usuario ya sabe quién es). Pedido explícito del cliente.
 */
export function HowItWorksScreen({ role }: { role: Role }) {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const session = useSession();
  const colors = useResolvedAppColors();
  const content = CONTENT[role];

  return (
    <SafeAreaView className="flex-1 bg-card">
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View className="flex-row items-center gap-3 bg-card px-5 pb-2 pt-2">
        <Pressable
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace(homePathFor(session?.user))
          }
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full bg-surface active:opacity-70"
        >
          <Ionicons name="arrow-back" size={20} color={colors.inkColor} />
        </Pressable>
        <Text className="flex-1 text-lg font-extrabold text-ink">
          ¿Cómo funciona Mandalo?
        </Text>
        <ThemeToggle />
      </View>

      <ScrollView contentContainerClassName="px-5 pb-12">
        <View className="w-full max-w-[560px] self-center">
          <Text className="mb-1 mt-2 text-[17px] font-extrabold text-ink">
            {content.headline}
          </Text>
          <Text className="mb-5 text-[13px] leading-5 text-muted">{content.sub}</Text>

          <View className="gap-2.5">
            {content.steps.map((step, i) => (
              <View
                key={step.title}
                className="flex-row gap-3 rounded-2xl border border-border bg-surface p-3.5"
              >
                <Text className="w-6 text-[14px] font-extrabold text-primary">
                  {i + 1}
                </Text>
                <View className="flex-1">
                  <Text className="mb-0.5 text-[14px] font-bold text-ink">
                    {step.title}
                  </Text>
                  <Text className="text-[13px] leading-5 text-muted">{step.body}</Text>
                </View>
              </View>
            ))}
          </View>

          <View className="mt-5 rounded-2xl bg-primary-tint p-3.5">
            <Text className="mb-1 text-[11px] font-extrabold uppercase tracking-wide text-primary">
              {content.note.label}
            </Text>
            <Text className="text-[13px] leading-5 text-primary">{content.note.body}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
