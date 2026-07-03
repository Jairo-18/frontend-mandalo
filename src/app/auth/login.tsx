import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { AuthHeader } from '@/components/auth/auth-header';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { authService } from '@/services/auth';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert('Faltan datos', 'Ingresa tu correo y contraseña.');
      return;
    }
    try {
      setLoading(true);
      await authService.signIn(email.trim(), password);
      // TODO: guardar tokens (persistencia de sesión)
      router.replace('/home');
    } catch (e) {
      Alert.alert(
        'No se pudo iniciar sesión',
        e instanceof Error ? e.message : 'Intenta de nuevo.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AuthHeader />

          <View className="-mt-7 flex-1 rounded-t-[28px] bg-white px-6 pb-10 pt-7">
            <Text className="text-center text-[26px] font-extrabold text-dark">
              ¡Bienvenido!
            </Text>
            <Text className="mb-6 mt-1.5 text-center text-sm text-muted">
              Inicia sesión para pedir lo mejor de tu región
            </Text>

            <TextField
              label="Correo electrónico"
              icon="mail-outline"
              value={email}
              onChangeText={setEmail}
              placeholder="tu@correo.com"
              keyboardType="email-address"
              autoComplete="email"
              autoCorrect={false}
            />

            <TextField
              label="Contraseña"
              icon="lock-closed-outline"
              secure
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
            />

            <Pressable
              className="mb-5 self-end"
              onPress={() =>
                Alert.alert('Recuperar contraseña', 'Función próximamente.')
              }
            >
              <Text className="text-[13px] font-bold text-primary">
                ¿Olvidaste tu contraseña?
              </Text>
            </Pressable>

            <Button
              label="Iniciar Sesión"
              onPress={handleLogin}
              loading={loading}
            />

            <View className="my-[18px] flex-row items-center gap-3">
              <View className="h-px flex-1 bg-gray-200" />
              <Text className="text-[13px] text-muted">o</Text>
              <View className="h-px flex-1 bg-gray-200" />
            </View>

            <Button
              label="Registrarse"
              variant="outline"
              onPress={() => router.push('/auth/register')}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
