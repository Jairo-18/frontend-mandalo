import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { AuthHeader } from '@/components/auth/auth-header';
import { TermsCheckbox } from '@/components/auth/terms-checkbox';
import { Button } from '@/components/ui/button';
import { KeyboardAwareScroll } from '@/components/ui/keyboard-aware-scroll';
import { signOutEverywhere } from '@/lib/sign-out';
import { getSession, homePathFor, setSession } from '@/lib/session';
import { authService } from '@/services/auth';

/**
 * Gate BLOQUEANTE de Términos y Tratamiento de Datos: sale tras iniciar sesión
 * cuando la cuenta aún no aceptó (p. ej. cuentas que creó el admin, ver §41).
 * Sin aceptar no se entra a la app — la única salida alterna es cerrar sesión.
 * Si el usuario es dueño de un negocio, el backend marca también la aceptación
 * del negocio (los dos aceptan a la vez).
 */
export default function AcceptTermsScreen() {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [leaving, setLeaving] = useState(false);

  async function handleAccept() {
    if (!accepted) {
      setError('Debes aceptar para continuar.');
      return;
    }
    try {
      setSaving(true);
      await authService.acceptTerms();
      // Refleja la aceptación en la sesión persistida para no volver al gate.
      const session = getSession();
      if (session) {
        await setSession({
          ...session,
          user: {
            ...session.user,
            termsAcceptedAt: new Date().toISOString(),
          },
        });
      }
      router.replace(homePathFor(session?.user));
    } catch {
      // El interceptor HTTP ya mostró el error.
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    setLeaving(true);
    // Navega al login por dentro, con el overlay "Cerrando sesión…".
    await signOutEverywhere();
    setLeaving(false);
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      <KeyboardAwareScroll>
        <AuthHeader compact subtitle="Términos y condiciones" />

        <View className="-mt-7 flex-1 rounded-t-[28px] bg-white px-6 pb-10 pt-7">
          <View className="mb-4 h-14 w-14 items-center justify-center self-center rounded-full bg-primary-tint">
            <Ionicons name="shield-checkmark-outline" size={28} color="#FF5A3C" />
          </View>
          <Text className="text-center text-[22px] font-extrabold text-dark">
            Un último paso
          </Text>
          <Text className="mb-6 mt-1.5 text-center text-sm leading-5 text-muted">
            Para usar Mándalo necesitamos que leas y aceptes nuestros Términos y
            Condiciones y la Política de Tratamiento de Datos.
          </Text>

          <TermsCheckbox
            checked={accepted}
            onChange={(v) => {
              setAccepted(v);
              setError('');
            }}
            error={error}
          />

          <Button
            label="Aceptar y continuar"
            onPress={handleAccept}
            loading={saving}
          />

          <Pressable
            onPress={handleLogout}
            disabled={leaving}
            className="mt-4 flex-row items-center justify-center gap-2 py-2 active:opacity-70"
          >
            {leaving ? (
              <ActivityIndicator size="small" color="#7A7A8A" />
            ) : (
              <Ionicons name="log-out-outline" size={16} color="#7A7A8A" />
            )}
            <Text className="text-[13px] font-bold text-muted">
              Cerrar sesión
            </Text>
          </Pressable>
        </View>
      </KeyboardAwareScroll>
    </View>
  );
}
