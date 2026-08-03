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
import { EMAIL_RE } from '@/lib/text-format';
import { getAppColors } from '@/lib/app-colors';
import { authService } from '@/services/auth';

/**
 * Eliminar cuenta SIN necesidad de tener la app instalada (exigido por
 * Google Play, Data safety → "Cuenta y eliminación de datos") — ruta
 * pública, alcanzable sin sesión y por URL directa. Fusionado desde
 * web-mandalo (Astro) a frontend-mandalo (NOTAS §62): misma ruta exacta
 * `/eliminar-cuenta`, mismo backend (`POST /user/request-deletion`).
 */
export default function EliminarCuentaScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    const value = email.trim();
    if (!value) {
      setError('Ingresa tu correo.');
      return;
    }
    if (!EMAIL_RE.test(value)) {
      setError('Ingresa un correo válido.');
      return;
    }
    setError('');
    try {
      setLoading(true);
      await authService.requestDeletion(value);
      setSent(true);
    } catch {
      // El interceptor HTTP ya mostró el error.
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-card">
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View className="flex-row items-center gap-3 bg-card px-5 pb-2 pt-2">
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full bg-surface active:opacity-70"
        >
          <Ionicons name="arrow-back" size={20} color={getAppColors().inkColor} />
        </Pressable>
        <Text className="flex-1 text-lg font-extrabold text-ink">
          Eliminar mi cuenta
        </Text>
        <ThemeToggle />
      </View>

      <KeyboardAwareScroll>
        <View className="px-5 pb-12">
          <View className="w-full max-w-[560px] self-center">
            <Text className="mb-4 mt-2 text-[13px] leading-5 text-muted">
              Puedes eliminar tu cuenta de dos formas. Elige la que te sirva —
              ambas hacen exactamente lo mismo.
            </Text>

            <Text className="mb-1 text-[14px] font-extrabold text-ink">
              1. Desde la app (si tienes acceso)
            </Text>
            <Text className="mb-4 text-[13px] leading-5 text-muted">
              Abre Mándalo → Mi perfil → Cuenta → &quot;Eliminar mi
              cuenta&quot;. Confirmas y listo, es inmediato.
            </Text>

            <Text className="mb-1 text-[14px] font-extrabold text-ink">
              2. Desde aquí (sin necesidad de la app)
            </Text>
            <Text className="mb-4 text-[13px] leading-5 text-muted">
              Escribe el correo con el que te registraste. Te mandamos un
              enlace de confirmación — al abrirlo, tu cuenta se elimina.
            </Text>

            {sent ? (
              <View className="mb-5 flex-row gap-2 rounded-2xl bg-primary-tint p-4">
                <Ionicons name="mail-outline" size={18} color={getAppColors().primaryColor} />
                <Text className="flex-1 text-[13px] leading-5 text-ink">
                  Te enviamos un correo para confirmar la eliminación de tu
                  cuenta.
                </Text>
              </View>
            ) : (
              <>
                <TextField
                  label="Correo de tu cuenta"
                  icon="mail-outline"
                  format="email"
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    if (error) setError('');
                  }}
                  error={error}
                  placeholder="tu@correo.com"
                />
                <Button
                  label="Enviar enlace de confirmación"
                  onPress={handleSubmit}
                  loading={loading}
                />
              </>
            )}

            <Text className="mt-6 text-[13px] leading-5 text-muted">
              ¿Qué se elimina exactamente? Tu nombre, correo, teléfono,
              dirección, foto de perfil y, si eres repartidor, los documentos
              de identificación y del vehículo (cédula, licencia, SOAT,
              tecnomecánica) — todo se borra de inmediato y no se puede
              deshacer.
            </Text>
            <Text className="mt-3 text-[13px] leading-5 text-muted">
              Si tienes pedidos en tu historial, el registro de esos pedidos
              (montos, fechas, estados) se conserva de forma anónima, sin
              ningún dato que te identifique — es información compartida con
              el negocio y/o el repartidor de ese pedido, y Mándalo debe
              conservarla por contabilidad. Si nunca hiciste ni recibiste un
              pedido, tu cuenta se borra por completo, sin dejar rastro.
            </Text>
            <Text className="mt-3 text-[13px] leading-5 text-muted">
              Más detalle en la{' '}
              <Text
                className="font-bold text-primary"
                suppressHighlighting
                onPress={() => router.push('/politicas-de-privacidad')}
              >
                Política de privacidad
              </Text>
              .
            </Text>
          </View>
        </View>
      </KeyboardAwareScroll>
    </SafeAreaView>
  );
}
