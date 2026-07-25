import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { AuthHeader } from '@/components/auth/auth-header';
import { TermsCheckbox } from '@/components/auth/terms-checkbox';
import { Button } from '@/components/ui/button';
import { KeyboardAwareScroll } from '@/components/ui/keyboard-aware-scroll';
import { TextField } from '@/components/ui/text-field';
import { useAppTheme } from '@/context/app-theme';
import { useFormErrors } from '@/hooks/use-form-errors';
import { DeviceCoords, getDeviceLocation } from '@/lib/location';
import { setSession } from '@/lib/session';
import { EMAIL_RE, normalizePhone, PHONE_PREFIX } from '@/lib/text-format';
import { authService } from '@/services/auth';

/**
 * Registro RÁPIDO del invitado (§44): tras armar el carrito, crea la cuenta de
 * cliente SIN verificación de correo (auto-login) para pedir de una. Pide lo
 * mínimo — datos de la cuenta + ubicación de entrega + términos — y al terminar
 * vuelve al checkout con la sesión lista (el carrito sigue en memoria).
 */
export default function QuickRegisterScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const { errors, clearError, bind, validate } = useFormErrors();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState(PHONE_PREFIX);
  // Dirección de entrega: se llena con el GPS (texto + coords) para que el
  // domicilio se calcule por distancia real, igual que el registro normal.
  const [address, setAddress] = useState('');
  const [details, setDetails] = useState('');
  const [coords, setCoords] = useState<DeviceCoords>();
  const [locating, setLocating] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleUseLocation() {
    setLocating(true);
    try {
      const result = await getDeviceLocation();
      if (result) {
        setCoords(result.coords);
        setAddress(
          result.address ??
            `Ubicación GPS (${result.coords.latitude.toFixed(5)}, ${result.coords.longitude.toFixed(5)})`,
        );
        clearError('location');
      }
    } finally {
      setLocating(false);
    }
  }

  function validateForm() {
    return validate({
      fullName: fullName.trim() ? undefined : 'Ingresa tu nombre completo.',
      username: username.trim() ? undefined : 'Ingresa un nombre de usuario.',
      email: !email.trim()
        ? 'Ingresa tu correo.'
        : !EMAIL_RE.test(email.trim())
          ? 'Ingresa un correo válido.'
          : undefined,
      password: !password
        ? 'Ingresa una contraseña.'
        : password.length < 8
          ? 'Mínimo 8 caracteres.'
          : undefined,
      phone:
        normalizePhone(phone).replace('+', '').length >= 10
          ? undefined
          : 'Ingresa un número de celular válido.',
      location: coords
        ? undefined
        : 'Marca tu ubicación con "Usar mi ubicación actual".',
      details: details.trim()
        ? undefined
        : 'Ingresa la dirección específica (barrio, casa, referencias).',
      acceptedTerms: accepted
        ? undefined
        : 'Debes aceptar los Términos y la Política de Tratamiento de Datos.',
    });
  }

  async function handleSubmit() {
    if (!validateForm()) return;
    try {
      setSaving(true);
      const res = await authService.registerQuick({
        fullName: fullName.trim(),
        username: username.trim(),
        email: email.trim(),
        password,
        phone: normalizePhone(phone),
        address: address.trim(),
        details: details.trim(),
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        acceptedTerms: accepted,
      });
      const { tokens, user, accessSessionId } = res.data;
      await setSession({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        accessSessionId,
        user,
      });
      // De vuelta al checkout con sesión + dirección; el carrito sigue vivo.
      router.replace('/checkout');
    } catch {
      // El interceptor HTTP ya mostró el error (correo/usuario en uso, etc.).
    } finally {
      setSaving(false);
    }
  }

  return (
    <View className="flex-1 bg-card">
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <KeyboardAwareScroll>
        <AuthHeader
          compact
          subtitle="Crea tu cuenta para pedir"
          onBack={() =>
            router.canGoBack() ? router.back() : router.replace('/home')
          }
        />

        <View className="-mt-7 flex-1 rounded-t-[28px] bg-card px-6 pb-10 pt-7">
          <Text className="mb-1 text-center text-[22px] font-extrabold text-ink">
            Últimos datos
          </Text>
          <Text className="mb-6 text-center text-sm leading-5 text-muted">
            Es rápido y podrás confirmar tu pedido enseguida.
          </Text>

          <TextField
            label="Nombre completo"
            icon="person-outline"
            format="name"
            value={fullName}
            onChangeText={bind('fullName', setFullName)}
            error={errors.fullName}
            placeholder="Juan Pérez"
          />
          <TextField
            label="Nombre de usuario"
            icon="at-outline"
            format="username"
            value={username}
            onChangeText={bind('username', setUsername)}
            error={errors.username}
            placeholder="juanp"
          />
          <TextField
            label="Correo electrónico"
            icon="mail-outline"
            format="email"
            noAutofill
            value={email}
            onChangeText={bind('email', setEmail)}
            error={errors.email}
            placeholder="tu@correo.com"
          />
          <TextField
            label="Contraseña"
            icon="lock-closed-outline"
            secure
            value={password}
            onChangeText={bind('password', setPassword)}
            error={errors.password}
            placeholder="Mínimo 8 caracteres"
          />
          <TextField
            label="Celular"
            icon="call-outline"
            format="phone"
            value={phone}
            onChangeText={bind('phone', setPhone)}
            error={errors.phone}
            placeholder="+57 - 300 123 456 7"
          />

          {/* Dirección de entrega: solo lectura, se llena con el GPS. */}
          <TextField
            label="Dirección (se llena con tu ubicación)"
            icon="home-outline"
            format="text"
            value={address}
            error={errors.location}
            placeholder="Toca «Usar mi ubicación actual»"
            editable={false}
          />
          <Pressable
            onPress={handleUseLocation}
            disabled={locating}
            className="-mt-2 mb-4 flex-row items-center gap-1.5 self-start"
          >
            {locating ? (
              <ActivityIndicator size="small" color="#FF5A3C" />
            ) : (
              <Ionicons
                name={coords ? 'checkmark-circle' : 'locate-outline'}
                size={16}
                color="#FF5A3C"
              />
            )}
            <Text className="text-[13px] font-bold text-primary">
              {locating
                ? 'Obteniendo ubicación…'
                : coords
                  ? 'Ubicación lista — tócala para actualizar'
                  : 'Usar mi ubicación actual'}
            </Text>
          </Pressable>

          <TextField
            label="Dirección específica (barrio, casa, referencias)"
            icon="navigate-outline"
            format="text"
            value={details}
            onChangeText={bind('details', setDetails)}
            error={errors.details}
            placeholder="Torre 2 apto 301, portón café"
          />

          <TermsCheckbox
            checked={accepted}
            onChange={(v) => {
              setAccepted(v);
              clearError('acceptedTerms');
            }}
            error={errors.acceptedTerms}
          />

          <Button
            label="Crear cuenta y continuar"
            onPress={handleSubmit}
            loading={saving}
          />
        </View>
      </KeyboardAwareScroll>
    </View>
  );
}
