import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { KeyboardAwareScroll } from '@/components/ui/keyboard-aware-scroll';
import { TextField } from '@/components/ui/text-field';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAppTheme } from '@/context/app-theme';
import { useFormErrors } from '@/hooks/use-form-errors';
import { useSession } from '@/hooks/use-session';
import { profileService } from '@/services/profile';
import { profilePathFor } from '@/lib/session';
import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';

/**
 * Pantalla "Cambiar contraseña" COMPARTIDA (cliente y repartidor); cada rol
 * la monta desde su propia ruta y se llega desde Mi perfil. Exige la
 * contraseña actual como prueba (`PATCH /user/me/password`); al guardar
 * vuelve atrás. Cuentas creadas con Google (sin contraseña conocida) usan
 * "¿Olvidaste tu contraseña?" del login.
 */
export function ChangePasswordScreen() {
  const colors = useResolvedAppColors();
  const router = useRouter();
  const { isDark } = useAppTheme();
  const session = useSession();
  const { errors, bind, validate } = useFormErrors();
  // "Cambiar contraseña" es un Tabs.Screen oculto (hermano de "profile"), no
  // una pantalla apilada — cambiar de tab no arma historial real, así que
  // `router.canGoBack()` no es confiable acá; se vuelve SIEMPRE a Mi cuenta.
  const profileHref = profilePathFor(session?.user);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    const ok = validate({
      currentPassword: currentPassword
        ? undefined
        : 'Ingresa tu contraseña actual.',
      newPassword: !newPassword
        ? 'Ingresa la contraseña nueva.'
        : newPassword.length < 8
          ? 'Mínimo 8 caracteres.'
          : undefined,
      confirmPassword: !confirmPassword
        ? 'Confirma la contraseña nueva.'
        : newPassword !== confirmPassword
          ? 'Las contraseñas no coinciden.'
          : undefined,
    });
    if (!ok) return;

    try {
      setSaving(true);
      await profileService.changePassword(currentPassword, newPassword);
      // El interceptor ya mostró el toast de éxito del backend.
      router.replace(profileHref);
    } catch {
      // El interceptor HTTP ya mostró el toast ("La contraseña actual no es correcta").
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View className="flex-row items-center gap-3 bg-surface px-5 pb-2 pt-2">
        <Pressable
          onPress={() => router.replace(profileHref)}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full bg-card active:opacity-70"
        >
          <Ionicons name="arrow-back" size={20} color={colors.inkColor} />
        </Pressable>
        <Text className="flex-1 text-lg font-extrabold text-ink">
          Cambiar contraseña
        </Text>
        <ThemeToggle />
      </View>

      {/* safeBottom=false: mismo caso que profile-screen.tsx — pantalla
          dentro del menú inferior de Tabs, que ya reserva el inset real. */}
      <KeyboardAwareScroll safeBottom={false}>
        <View className="px-5 pb-4">
          <View className="mt-2 rounded-2xl bg-card p-4">
            <TextField
              label="Contraseña actual"
              icon="lock-closed-outline"
              secure
              value={currentPassword}
              onChangeText={bind('currentPassword', setCurrentPassword)}
              error={errors.currentPassword}
              placeholder="Tu contraseña actual"
            />
            <TextField
              label="Contraseña nueva"
              icon="lock-closed-outline"
              secure
              value={newPassword}
              onChangeText={bind('newPassword', setNewPassword)}
              error={errors.newPassword}
              placeholder="Mínimo 8 caracteres"
            />
            <TextField
              label="Confirmar contraseña nueva"
              icon="lock-closed-outline"
              secure
              value={confirmPassword}
              onChangeText={bind('confirmPassword', setConfirmPassword)}
              error={errors.confirmPassword}
              placeholder="Repite la contraseña nueva"
            />
            <Button
              label="Cambiar contraseña"
              onPress={handleSubmit}
              loading={saving}
            />
            <Text className="mt-3 text-center text-[11px] text-muted">
              Si entraste con Google y no tienes contraseña, usa
              {' "¿Olvidaste tu contraseña?" en el login.'}
            </Text>
          </View>
        </View>
      </KeyboardAwareScroll>
    </SafeAreaView>
  );
}
