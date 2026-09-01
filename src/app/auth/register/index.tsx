import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { AuthShell } from '@/components/auth/auth-shell';
import { SocialContactBar } from '@/components/auth/social-contact-bar';
import { DeveloperCredit } from '@/components/ui/developer-credit';
import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';

type RoleCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
  onPress: () => void;
};

function RoleCard({ icon, title, desc, onPress }: RoleCardProps) {
  const colors = useResolvedAppColors();
  return (
    <Pressable
      onPress={onPress}
      className="mb-4 flex-row items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm active:opacity-70"
    >
      <View className="h-14 w-14 items-center justify-center">
        <Ionicons name={icon} size={32} color={colors.primaryColor} />
      </View>
      <View className="flex-1">
        <Text className="text-[17px] font-extrabold text-ink">{title}</Text>
        <Text className="mt-0.5 text-[13px] leading-4 text-muted">{desc}</Text>
      </View>
      <View className="h-8 w-8 items-center justify-center rounded-full bg-surface">
        <Ionicons name="chevron-forward" size={17} color={colors.primaryColor} />
      </View>
    </Pressable>
  );
}

export default function RegisterChooser() {
  const colors = useResolvedAppColors();
  const router = useRouter();

  return (
    <AuthShell
      compact
      subtitle="Únete a Mandalo"
      onBack={() =>
        router.canGoBack() ? router.back() : router.replace('/auth/login')
      }
    >
      <Text className="text-center text-[26px] font-extrabold text-ink">
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
        onPress={() => router.push('/auth/register/business')}
        className="mt-1 flex-row items-center gap-3 rounded-2xl bg-surface p-4 active:opacity-70"
      >
        <View className="h-11 w-11 items-center justify-center rounded-xl bg-card">
          <Ionicons name="storefront-outline" size={20} color={colors.primaryColor} />
        </View>
        <Text className="flex-1 text-xs leading-4 text-muted">
          ¿Tienes un negocio? El equipo de Mandalo crea tu cuenta — toca
          para contarnos de tu negocio.
        </Text>
        <Ionicons name="chevron-forward" size={18} color={colors.mutedColor} />
      </Pressable>

      <Pressable
        className="mt-4 self-center"
        onPress={() => router.replace('/auth/login')}
      >
        <Text className="text-sm font-bold text-primary">
          Volver a iniciar sesión
        </Text>
      </Pressable>

      <Pressable
        onPress={() => router.push('/how-it-works')}
        className="mt-3 flex-row items-center justify-center gap-1.5 self-center"
      >
        <Ionicons name="help-circle-outline" size={16} color={colors.mutedColor} />
        <Text className="text-[13px] font-bold text-muted">
          ¿Cómo funciona Mandalo?
        </Text>
      </Pressable>

      <SocialContactBar />

      <View className="mt-auto pt-4">
        <DeveloperCredit />
      </View>
    </AuthShell>
  );
}
