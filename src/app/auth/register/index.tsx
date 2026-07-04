import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthHeader } from '@/components/auth/auth-header';

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
      className="mb-4 flex-row items-center gap-4 rounded-2xl border border-gray-200 p-4 active:opacity-80"
    >
      <View className="h-14 w-14 items-center justify-center rounded-full bg-primary-tint">
        <Ionicons name={icon} size={28} color="#FF5A3C" />
      </View>
      <View className="flex-1">
        <Text className="text-base font-bold text-dark">{title}</Text>
        <Text className="text-sm text-muted">{desc}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
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
          title="Usuario"
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
          title="Repartidor"
          desc="Entrega pedidos y genera ingresos"
          onPress={() =>
            router.push({
              pathname: '/auth/register/[role]',
              params: { role: 'delivery' },
            })
          }
        />

        <Pressable
          className="mt-4 self-center"
          onPress={() => router.replace('/auth/login')}
        >
          <Text className="text-sm font-bold text-primary">
            Volver a iniciar sesión
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
