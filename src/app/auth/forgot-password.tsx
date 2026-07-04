import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AuthHeader } from '@/components/auth/auth-header';
import { Button } from '@/components/ui/button';
import { KeyboardAwareScroll } from '@/components/ui/keyboard-aware-scroll';
import { TextField } from '@/components/ui/text-field';
import { EMAIL_RE } from '@/lib/text-format';

import { authService } from '@/services/auth';

type Errors = Record<string, string | undefined>;

/**
 * Recuperar contraseña en dos pasos (misma pantalla):
 * 1. El usuario ingresa su correo → el backend envía un código de 6 dígitos.
 * 2. Digita el código + la contraseña nueva → el backend la cambia → login.
 * Los mensajes de éxito/error los pone el backend (toast del interceptor).
 */
export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'reset'>('email');

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  const clearError = (field: string) =>
    setErrors((p) => (p[field] ? { ...p, [field]: undefined } : p));

  const bind = (field: string, setter: (v: string) => void) => (v: string) => {
    setter(v);
    clearError(field);
  };

  async function handleSendCode() {
    const e: Errors = {};
    if (!email.trim()) e.email = 'Ingresa tu correo.';
    else if (!EMAIL_RE.test(email.trim())) e.email = 'Ingresa un correo válido.';
    setErrors(e);
    if (Object.values(e).some(Boolean)) return;

    try {
      setLoading(true);
      await authService.forgotPassword(email.trim());
      setStep('reset');
    } catch {
      // El interceptor HTTP ya mostró el toast con el mensaje del backend.
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    try {
      setResending(true);
      await authService.forgotPassword(email.trim());
    } catch {
      // El interceptor HTTP ya mostró el toast.
    } finally {
      setResending(false);
    }
  }

  async function handleReset() {
    const e: Errors = {};
    if (code.length !== 6) e.code = 'Ingresa el código de 6 dígitos.';
    if (!password) e.password = 'Ingresa una contraseña.';
    else if (password.length < 8) e.password = 'Mínimo 8 caracteres.';
    if (!confirm) e.confirm = 'Confirma tu contraseña.';
    else if (password !== confirm) e.confirm = 'Las contraseñas no coinciden.';
    setErrors(e);
    if (Object.values(e).some(Boolean)) return;

    try {
      setLoading(true);
      await authService.resetPassword(email.trim(), code, password);
      router.replace('/auth/login');
    } catch {
      // El interceptor HTTP ya mostró el toast con el mensaje del backend.
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      <KeyboardAwareScroll>
        <AuthHeader />

        <View className="-mt-7 flex-1 rounded-t-[28px] bg-white px-6 pb-10 pt-7">
          <Text className="text-center text-[22px] font-extrabold text-dark">
            Recuperar contraseña
          </Text>

          {step === 'email' ? (
            <>
              <Text className="mb-6 mt-1.5 text-center text-sm text-muted">
                Ingresa tu correo y te enviaremos un código para restablecerla
              </Text>

              <TextField
                label="Correo electrónico"
                icon="mail-outline"
                format="email"
                value={email}
                onChangeText={bind('email', setEmail)}
                error={errors.email}
                placeholder="tu@correo.com"
              />

              <Button
                label="Enviar código"
                onPress={handleSendCode}
                loading={loading}
              />
            </>
          ) : (
            <>
              <Text className="mb-6 mt-1.5 text-center text-sm text-muted">
                Enviamos un código de 6 dígitos a{' '}
                <Text className="font-bold text-dark">{email}</Text>. Vence en
                15 minutos.
              </Text>

              <TextField
                label="Código"
                icon="key-outline"
                format="digits"
                value={code}
                onChangeText={bind('code', setCode)}
                error={errors.code}
                placeholder="123456"
                maxLength={6}
              />
              <TextField
                label="Nueva contraseña"
                icon="lock-closed-outline"
                secure
                value={password}
                onChangeText={bind('password', setPassword)}
                error={errors.password}
                placeholder="Mínimo 8 caracteres"
              />
              <TextField
                label="Confirmar contraseña"
                icon="lock-closed-outline"
                secure
                value={confirm}
                onChangeText={bind('confirm', setConfirm)}
                error={errors.confirm}
                placeholder="Repite tu contraseña"
              />

              <Button
                label="Cambiar contraseña"
                onPress={handleReset}
                loading={loading}
              />

              <View className="mt-4 flex-row justify-center">
                <Text className="text-sm text-muted">¿No te llegó? </Text>
                <Pressable onPress={handleResend} disabled={resending}>
                  <Text
                    className={`text-sm font-bold text-primary ${
                      resending ? 'opacity-50' : ''
                    }`}
                  >
                    Reenviar código
                  </Text>
                </Pressable>
              </View>
            </>
          )}

          <View className="mt-5 flex-row justify-center">
            <Pressable onPress={() => router.replace('/auth/login')}>
              <Text className="text-sm font-bold text-primary">
                Volver a iniciar sesión
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAwareScroll>
    </View>
  );
}
