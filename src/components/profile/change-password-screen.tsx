import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { KeyboardAwareScroll } from '@/components/ui/keyboard-aware-scroll';
import { TextField } from '@/components/ui/text-field';
import { useFormErrors } from '@/hooks/use-form-errors';
import { profileService } from '@/services/profile';

/**
 * Pantalla "Cambiar contraseña" COMPARTIDA (cliente y repartidor); cada rol
 * la monta desde su propia ruta y se llega desde Mi perfil. Exige la
 * contraseña actual como prueba (`PATCH /user/me/password`); al guardar
 * vuelve atrás. Cuentas creadas con Google (sin contraseña conocida) usan
 * "¿Olvidaste tu contraseña?" del login.
 */
export function ChangePasswordScreen() {
  const router = useRouter();
  const { errors, bind, validate } = useFormErrors();

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
      router.back();
    } catch {
      // El interceptor HTTP ya mostró el toast ("La contraseña actual no es correcta").
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <StatusBar style="dark" />

      <View className="flex-row items-center gap-3 bg-surface px-5 pb-2 pt-2">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full bg-white active:opacity-70"
        >
          <Ionicons name="arrow-back" size={20} color="#1E1E2D" />
        </Pressable>
        <Text className="text-lg font-extrabold text-dark">
          Cambiar contraseña
        </Text>
      </View>

      <KeyboardAwareScroll>
        <View className="px-5 pb-10">
          <View className="mt-2 rounded-2xl bg-white p-4">
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
