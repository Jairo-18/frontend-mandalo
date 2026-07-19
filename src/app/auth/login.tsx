import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { AuthHeader } from '@/components/auth/auth-header';
import { GoogleButton } from '@/components/auth/google-button';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DeveloperCredit } from '@/components/ui/developer-credit';
import { KeyboardAwareScroll } from '@/components/ui/keyboard-aware-scroll';
import { TextField } from '@/components/ui/text-field';
import {
  clearCredentials,
  loadCredentials,
  saveCredentials,
} from '@/lib/credentials';
import { signInWithGoogle } from '@/lib/google-auth';
import { HttpError } from '@/lib/http';
import { getSession, homePathFor, setSession } from '@/lib/session';
import { EMAIL_RE } from '@/lib/text-format';
import { authService } from '@/services/auth';

/** ¿El sign-in falló porque el correo no está verificado? (code del backend). */
function isEmailNotVerified(e: unknown): boolean {
  return (
    e instanceof HttpError &&
    e.status === 401 &&
    typeof e.body === 'object' &&
    e.body !== null &&
    (e.body as { code?: string }).code === 'EMAIL_NOT_VERIFIED'
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  // El sign-in rechazó por correo sin verificar: se ofrece reenviarlo.
  const [showResend, setShowResend] = useState(false);
  const [resending, setResending] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );

  // Prellena con las credenciales recordadas al abrir.
  useEffect(() => {
    loadCredentials().then((c) => {
      if (c) {
        setEmail(c.email);
        setPassword(c.password);
        setRemember(true);
      }
    });
  }, []);

  const clearError = (field: 'email' | 'password') =>
    setErrors((p) => (p[field] ? { ...p, [field]: undefined } : p));

  async function handleLogin() {
    const e: { email?: string; password?: string } = {};
    if (!email.trim()) e.email = 'Ingresa tu correo.';
    else if (!EMAIL_RE.test(email.trim())) e.email = 'Ingresa un correo válido.';
    if (!password) e.password = 'Ingresa tu contraseña.';
    setErrors(e);
    if (e.email || e.password) return;

    try {
      setLoading(true);
      const res = await authService.signIn(email.trim(), password);
      const { tokens, user, accessSessionId } = res.data;
      await setSession({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        accessSessionId,
        user,
      });

      if (remember) {
        await saveCredentials({ email: email.trim(), password });
      } else {
        await clearCredentials();
      }

      router.replace(homePathFor(user));
    } catch (e) {
      // El interceptor HTTP ya mostró el toast con el mensaje del backend.
      if (isEmailNotVerified(e)) setShowResend(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleResendVerification() {
    if (resending) return;
    try {
      setResending(true);
      await authService.resendVerification(email.trim());
      setShowResend(false);
    } catch {
      // El interceptor HTTP ya mostró el error.
    } finally {
      setResending(false);
    }
  }

  async function handleGoogle() {
    try {
      setGoogleLoading(true);
      const result = await signInWithGoogle();
      if (result.ok) {
        // Cuenta nueva: primero completa el registro (elegir rol + datos).
        router.replace(
          result.isNewUser
            ? '/auth/complete-registration'
            : homePathFor(getSession()?.user),
        );
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      <KeyboardAwareScroll>
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
            format="email"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              clearError('email');
            }}
            error={errors.email}
            placeholder="tu@correo.com"
          />

          <TextField
            label="Contraseña"
            icon="lock-closed-outline"
            secure
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              clearError('password');
            }}
            error={errors.password}
            placeholder="••••••••"
            returnKeyType="go"
            onSubmitEditing={handleLogin}
          />

          <View className="mb-5 flex-row items-center justify-between">
            <Checkbox
              checked={remember}
              onChange={setRemember}
              label="Recordar mis datos"
            />
            <Pressable onPress={() => router.push('/auth/forgot-password')}>
              <Text className="text-[13px] font-bold text-primary">
                ¿Olvidaste tu contraseña?
              </Text>
            </Pressable>
          </View>

          {/* Aparece cuando el sign-in rechaza por correo sin verificar. */}
          {showResend && (
            <Pressable
              onPress={handleResendVerification}
              disabled={resending}
              className="mb-4 flex-row items-center gap-2.5 rounded-2xl bg-primary-tint px-4 py-3 active:opacity-70"
            >
              <Ionicons
                name={resending ? 'hourglass-outline' : 'mail-unread-outline'}
                size={18}
                color="#FF5A3C"
              />
              <Text className="flex-1 text-[13px] font-bold text-primary">
                {resending
                  ? 'Reenviando correo…'
                  : 'Reenviar correo de verificación'}
              </Text>
            </Pressable>
          )}

          <Button
            label="Iniciar sesión"
            onPress={handleLogin}
            loading={loading}
          />

          {/* El sign-in de Google es nativo — en la versión web no existe. */}
          {Platform.OS !== 'web' && (
            <>
              <View className="my-[18px] flex-row items-center gap-3">
                <View className="h-px flex-1 bg-gray-200" />
                <Text className="text-[13px] text-muted">o</Text>
                <View className="h-px flex-1 bg-gray-200" />
              </View>

              <GoogleButton onPress={handleGoogle} loading={googleLoading} />
            </>
          )}

          <View className="mt-[14px]">
            <Button
              label="Registrarse"
              variant="outline"
              onPress={() => router.push('/auth/register')}
            />
          </View>

          <View className="mt-6">
            <DeveloperCredit />
          </View>
        </View>
      </KeyboardAwareScroll>
    </View>
  );
}
