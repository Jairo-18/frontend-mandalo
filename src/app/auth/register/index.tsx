import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Linking, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthHeader } from '@/components/auth/auth-header';
import { DeveloperCredit } from '@/components/ui/developer-credit';
import { toast } from '@/lib/toast';

const BUSINESS_CONTACT_EMAIL = 'mandaloputumayo@gmail.com';

/**
 * Los negocios no se auto-registran: abre el correo del dispositivo con un
 * mensaje pre-armado hacia el equipo de Mándalo, con los datos mínimos que
 * necesitan para dar de alta la cuenta (el usuario completa los espacios).
 */
async function contactAboutBusiness() {
  const subject = 'Solicitud de registro de negocio en Mándalo';
  const body = [
    'Hola equipo de Mándalo,',
    '',
    'Quiero registrar mi negocio en la app. Estos son mis datos:',
    '',
    'Nombre del negocio: ',
    'Nombre del titular / representante: ',
    'Número de identificación (NIT o cédula): ',
    'Teléfono de contacto: ',
    'Correo de contacto: ',
    'Tipo de negocio (comida rápida, tienda, etc.): ',
    'Municipio y dirección: ',
    '',
    'Quedo atento(a). Gracias.',
  ].join('\n');

  const url = `mailto:${BUSINESS_CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  try {
    await Linking.openURL(url);
  } catch {
    toast.error(
      `No se pudo abrir tu app de correo. Escríbenos a ${BUSINESS_CONTACT_EMAIL}`,
    );
  }
}

type RoleCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
  onPress: () => void;
};

function RoleCard({ icon, title, desc, onPress }: RoleCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-4 flex-row items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm active:border-primary active:bg-primary-tint"
    >
      <View className="h-14 w-14 items-center justify-center rounded-2xl bg-primary-tint">
        <Ionicons name={icon} size={28} color="#FF5A3C" />
      </View>
      <View className="flex-1">
        <Text className="text-[17px] font-extrabold text-dark">{title}</Text>
        <Text className="mt-0.5 text-[13px] leading-4 text-muted">{desc}</Text>
      </View>
      <View className="h-8 w-8 items-center justify-center rounded-full bg-surface">
        <Ionicons name="chevron-forward" size={17} color="#FF5A3C" />
      </View>
    </Pressable>
  );
}

export default function RegisterChooser() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      <AuthHeader compact subtitle="Únete a Mándalo" />

      <View
        className="-mt-7 flex-1 rounded-t-[28px] bg-white px-6 pt-8"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <Text className="text-center text-[26px] font-extrabold text-dark">
          ¿Cómo quieres registrarte?
        </Text>
        <Text className="mb-8 mt-1.5 text-center text-sm text-muted">
          Elige el tipo de cuenta
        </Text>

        <RoleCard
          icon="person-outline"
          title="Cliente"
          desc="Pide lo mejor de tu región"
          onPress={() =>
            router.push({
              pathname: '/auth/register/[role]',
              params: { role: 'client' },
            })
          }
        />
        <RoleCard
          icon="bicycle-outline"
          title="Domiciliario"
          desc="Entrega pedidos y genera ingresos"
          onPress={() =>
            router.push({
              pathname: '/auth/register/[role]',
              params: { role: 'delivery' },
            })
          }
        />

        {/* Los negocios no se auto-registran: los da de alta el equipo.
            Mismo lenguaje visual que RoleCard (icono en caja + chevron) para
            que las 3 tarjetas se vean consistentes en esta pantalla. */}
        <Pressable
          onPress={contactAboutBusiness}
          className="mt-1 flex-row items-center gap-3 rounded-2xl bg-surface p-4 active:opacity-70"
        >
          <View className="h-11 w-11 items-center justify-center rounded-xl bg-white">
            <Ionicons name="storefront-outline" size={20} color="#FF5A3C" />
          </View>
          <Text className="flex-1 text-xs leading-4 text-muted">
            ¿Tienes un negocio? El equipo de Mándalo crea tu cuenta — toca
            para escribirnos y contarnos de tu negocio.
          </Text>
          <Ionicons name="chevron-forward" size={18} color="#7A7A8A" />
        </Pressable>

        <Pressable
          className="mt-4 self-center"
          onPress={() => router.replace('/auth/login')}
        >
          <Text className="text-sm font-bold text-primary">
            Volver a iniciar sesión
          </Text>
        </Pressable>

        <View className="mt-auto pt-4">
          <DeveloperCredit />
        </View>
      </View>
    </View>
  );
}
