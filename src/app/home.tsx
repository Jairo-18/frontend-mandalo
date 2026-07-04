import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { clearSession, loadSession } from '@/lib/session';
import { authService } from '@/services/auth';

export default function HomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    try {
      setLoading(true);
      const s = await loadSession();
      if (s?.accessSessionId) {
        // El interceptor muestra el mensaje del backend ("Sesión cerrada exitosamente").
        await authService.signOut({
          userId: s.user.id,
          accessToken: s.accessToken,
          accessSessionId: s.accessSessionId,
        });
      }
    } catch {
      // El interceptor ya mostró el error; igual limpiamos la sesión local.
    } finally {
      await clearSession();
      setLoading(false);
      router.replace('/auth/login');
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="flex-1 items-center justify-center px-8">
        <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-primary-tint">
          <Ionicons name="home" size={40} color="#FF5A3C" />
        </View>
        <Text className="text-2xl font-extrabold text-dark">
          Estás en el home 🎉
        </Text>
        <Text className="mt-2 text-center text-sm text-muted">
          Aquí irá el contenido principal de Mándalo.
        </Text>

        <View className="mt-10 w-full">
          <Button
            label="Cerrar sesión"
            variant="outline"
            onPress={handleLogout}
            loading={loading}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
