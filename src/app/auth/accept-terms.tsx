import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { AuthShell } from '@/components/auth/auth-shell';
import { TermsCheckbox } from '@/components/auth/terms-checkbox';
import { Button } from '@/components/ui/button';
import { signOutEverywhere } from '@/lib/sign-out';
import { getSession, homePathFor, setSession } from '@/lib/session';
import { authService } from '@/services/auth';
import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';

/**
 * Gate BLOQUEANTE de Términos y Tratamiento de Datos: sale tras iniciar sesión
 * cuando la cuenta aún no aceptó (p. ej. cuentas que creó el admin, ver §41).
 * Sin aceptar no se entra a la app — la única salida alterna es cerrar sesión.
 * Si el usuario es dueño de un negocio, el backend marca también la aceptación
 * del negocio (los dos aceptan a la vez).
 */
export default function AcceptTermsScreen() {
  const colors = useResolvedAppColors();
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
    <AuthShell compact subtitle="Términos y condiciones">
      <View className="mb-4 h-14 w-14 items-center justify-center self-center">
        <Ionicons name="shield-checkmark-outline" size={32} color={colors.primaryColor} />
      </View>
      <Text className="text-center text-[22px] font-extrabold text-ink">
        Un último paso
      </Text>
      <Text className="mb-6 mt-1.5 text-center text-sm leading-5 text-muted">
        Para usar Mandalo necesitamos que leas y aceptes nuestros Términos y
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
          <ActivityIndicator size="small" color={colors.mutedColor} />
        ) : (
          <Ionicons name="log-out-outline" size={16} color={colors.mutedColor} />
        )}
        <Text className="text-[13px] font-bold text-muted">
          Cerrar sesión
        </Text>
      </Pressable>
    </AuthShell>
  );
}
