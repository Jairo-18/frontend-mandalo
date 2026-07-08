import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { AuthHeader } from '@/components/auth/auth-header';
import { DeliveryVerification } from '@/components/auth/delivery-verification';
import { GoogleButton } from '@/components/auth/google-button';
import { Button } from '@/components/ui/button';
import { KeyboardAwareScroll } from '@/components/ui/keyboard-aware-scroll';
import { Select } from '@/components/ui/select';
import { TextField } from '@/components/ui/text-field';
import { useAppData } from '@/context/app-data';
import { useFormErrors } from '@/hooks/use-form-errors';
import { useMunicipalities } from '@/hooks/use-municipalities';
import { signInWithGoogle } from '@/lib/google-auth';
import { DeviceCoords, getDeviceLocation } from '@/lib/location';
import { getSession, homePathFor } from '@/lib/session';
import { EMAIL_RE } from '@/lib/text-format';
import { authService, RegisterPayload } from '@/services/auth';

// La app por ahora solo opera en Putumayo (Villagarzón por defecto), así que
// el registro llega con esa región preseleccionada. Se identifica por código
// DANE (los ids son SERIAL y podrían cambiar entre bases).
const DEFAULT_DEPARTMENT_DANE = '86'; // Putumayo
const DEFAULT_MUNICIPALITY_DANE = '86885'; // Villagarzón

export default function RegisterForm() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role: string }>();
  const isDelivery = role === 'delivery';

  const { departments, identificationTypes } = useAppData();
  const muni = useMunicipalities();
  const { errors, clearError, bind, validate } = useFormErrors();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [address, setAddress] = useState('');
  const [identificationNumber, setIdentificationNumber] = useState('');
  const [identificationTypeId, setIdentificationTypeId] = useState<number>();

  // Fotos de verificación del repartidor (obligatorias): rostro + documento
  // por ambos lados. Un admin las revisa antes de activar la cuenta.
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [idFrontUri, setIdFrontUri] = useState<string | null>(null);
  const [idBackUri, setIdBackUri] = useState<string | null>(null);

  const [coords, setCoords] = useState<DeviceCoords>();
  const [locating, setLocating] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const departmentOptions = useMemo(
    () => departments.map((d) => ({ label: d.name, value: d.id })),
    [departments],
  );
  const municipalityOptions = useMemo(
    () => muni.municipalities.map((m) => ({ label: m.name, value: m.id })),
    [muni.municipalities],
  );
  const identificationTypeOptions = useMemo(
    () => identificationTypes.map((t) => ({ label: t.name, value: t.id })),
    [identificationTypes],
  );

  // Preselecciona Putumayo / Villagarzón al cargar (solo si el usuario aún no
  // eligió nada; los selects siguen editables).
  useEffect(() => {
    if (muni.departmentId || !departments.length) return;
    const dept = departments.find((d) => d.code === DEFAULT_DEPARTMENT_DANE);
    if (!dept) return;

    muni.preload(dept.id).then((muns) => {
      const mun = muns.find((m) => m.code === DEFAULT_MUNICIPALITY_DANE);
      if (mun) muni.setMunicipalityId(mun.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departments]);

  /**
   * Ubicación del dispositivo: guarda las coordenadas (van al backend) y
   * prellena la dirección con el geocoding inverso (el campo sigue editable).
   */
  async function handleUseLocation() {
    setLocating(true);
    try {
      const result = await getDeviceLocation();
      if (result) {
        setCoords(result.coords);
        if (result.address) {
          setAddress(result.address);
          clearError('address');
        }
      }
    } finally {
      setLocating(false);
    }
  }

  function validateForm() {
    return validate({
      fullName: fullName.trim() ? undefined : 'Ingresa tu nombre completo.',
      username: username.trim() ? undefined : 'Ingresa un nombre de usuario.',
      phone: phone.trim() ? undefined : 'Ingresa tu teléfono.',
      email: !email.trim()
        ? 'Ingresa tu correo.'
        : !EMAIL_RE.test(email.trim())
          ? 'Ingresa un correo válido.'
          : undefined,
      departmentId: muni.departmentId ? undefined : 'Selecciona un departamento.',
      municipalityId: muni.municipalityId ? undefined : 'Selecciona un municipio.',
      address: address.trim() ? undefined : 'Ingresa tu dirección.',
      password: !password
        ? 'Ingresa una contraseña.'
        : password.length < 8
          ? 'Mínimo 8 caracteres.'
          : undefined,
      confirm: !confirm
        ? 'Confirma tu contraseña.'
        : password !== confirm
          ? 'Las contraseñas no coinciden.'
          : undefined,
      ...(isDelivery && {
        identificationTypeId: identificationTypeId
          ? undefined
          : 'Selecciona el tipo.',
        identificationNumber: identificationNumber.trim()
          ? undefined
          : 'Ingresa tu número de identificación.',
        avatar: avatarUri ? undefined : 'Sube una foto de tu rostro.',
        idFront: idFrontUri
          ? undefined
          : 'Sube la foto del frente de tu documento.',
        idBack: idBackUri
          ? undefined
          : 'Sube la foto del respaldo de tu documento.',
      }),
    });
  }

  async function handleRegister() {
    if (!validateForm()) return;

    const payload: RegisterPayload = {
      fullName: fullName.trim(),
      username: username.trim(),
      phone: phone.trim(),
      email: email.trim(),
      password,
      address: address.trim(),
      departmentId: muni.departmentId,
      municipalityId: muni.municipalityId,
      ...(coords ?? {}),
      ...(isDelivery && {
        identificationNumber: identificationNumber.trim(),
        identificationTypeId,
      }),
    };

    try {
      setLoading(true);
      if (isDelivery) {
        await authService.registerDelivery(payload, {
          avatar: avatarUri!,
          idFront: idFrontUri!,
          idBack: idBackUri!,
        });
      } else {
        await authService.registerClient(payload);
      }
      // El interceptor muestra el toast de éxito del backend.
      router.replace('/auth/login');
    } catch {
      // El interceptor HTTP ya mostró el toast con el mensaje del backend.
    } finally {
      setLoading(false);
    }
  }

  /**
   * Registro/inicio con Google: si la cuenta no existe se crea con el rol de
   * esta pantalla; si ya existe, se vincula (googleId) e inicia sesión.
   */
  async function handleGoogle() {
    try {
      setGoogleLoading(true);
      if (await signInWithGoogle(isDelivery ? 'delivery' : 'client')) {
        router.replace(homePathFor(getSession()?.user));
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      <KeyboardAwareScroll>
        <AuthHeader
          compact
          subtitle={isDelivery ? 'Registro de repartidor' : 'Registro de usuario'}
        />

        <View className="-mt-7 flex-1 rounded-t-[28px] bg-white px-6 pb-10 pt-7">
          <Text className="mb-6 text-center text-[22px] font-extrabold text-dark">
            {isDelivery ? 'Crea tu cuenta de repartidor' : 'Crea tu cuenta'}
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
            label="Teléfono"
            icon="call-outline"
            format="digits"
            value={phone}
            onChangeText={bind('phone', setPhone)}
            error={errors.phone}
            placeholder="3001234567"
            keyboardType="phone-pad"
          />
          <TextField
            label="Correo electrónico"
            icon="mail-outline"
            format="email"
            value={email}
            onChangeText={bind('email', setEmail)}
            error={errors.email}
            placeholder="tu@correo.com"
          />

          <Select
            label="Departamento"
            icon="map-outline"
            placeholder="Selecciona tu departamento"
            options={departmentOptions}
            value={muni.departmentId}
            onSelect={(id) => {
              clearError('departmentId');
              muni.onSelectDepartment(id);
            }}
            error={errors.departmentId}
          />
          <Select
            label="Municipio"
            icon="location-outline"
            placeholder={
              muni.departmentId
                ? 'Selecciona tu municipio'
                : 'Elige un departamento primero'
            }
            options={municipalityOptions}
            value={muni.municipalityId}
            onSelect={(id) => {
              muni.setMunicipalityId(id);
              clearError('municipalityId');
            }}
            disabled={!muni.departmentId || muni.loadingMuns}
            loading={muni.loadingMuns}
            error={errors.municipalityId}
          />

          <TextField
            label="Dirección"
            icon="home-outline"
            format="text"
            value={address}
            onChangeText={bind('address', setAddress)}
            error={errors.address}
            placeholder="Calle 1 # 2-3"
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
                  ? 'Ubicación marcada — toca para actualizar'
                  : 'Usar mi ubicación actual'}
            </Text>
          </Pressable>

          {isDelivery && (
            <>
              <Select
                label="Tipo de identificación"
                icon="card-outline"
                placeholder="Selecciona el tipo"
                options={identificationTypeOptions}
                value={identificationTypeId}
                onSelect={(id) => {
                  setIdentificationTypeId(id);
                  clearError('identificationTypeId');
                }}
                error={errors.identificationTypeId}
              />
              <TextField
                label="Número de identificación"
                icon="finger-print-outline"
                format="digits"
                value={identificationNumber}
                onChangeText={bind('identificationNumber', setIdentificationNumber)}
                error={errors.identificationNumber}
                placeholder="1090123456"
              />

              <DeliveryVerification
                avatarUri={avatarUri}
                idFrontUri={idFrontUri}
                idBackUri={idBackUri}
                onAvatar={(uri) => {
                  setAvatarUri(uri);
                  clearError('avatar');
                }}
                onIdFront={(uri) => {
                  setIdFrontUri(uri);
                  clearError('idFront');
                }}
                onIdBack={(uri) => {
                  setIdBackUri(uri);
                  clearError('idBack');
                }}
                errors={errors}
              />
            </>
          )}

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
            label="Confirmar contraseña"
            icon="lock-closed-outline"
            secure
            value={confirm}
            onChangeText={bind('confirm', setConfirm)}
            error={errors.confirm}
            placeholder="Repite tu contraseña"
          />

          <View className="mt-2">
            <Button
              label="Crear cuenta"
              onPress={handleRegister}
              loading={loading}
            />
          </View>

          <View className="my-[18px] flex-row items-center gap-3">
            <View className="h-px flex-1 bg-gray-200" />
            <Text className="text-[13px] text-muted">o</Text>
            <View className="h-px flex-1 bg-gray-200" />
          </View>

          <GoogleButton
            label={
              isDelivery
                ? 'Registrarme con Google'
                : 'Continuar con Google'
            }
            onPress={handleGoogle}
            loading={googleLoading}
          />

          <View className="mt-5 flex-row justify-center">
            <Text className="text-sm text-muted">¿Ya tienes cuenta? </Text>
            <Pressable onPress={() => router.replace('/auth/login')}>
              <Text className="text-sm font-bold text-primary">
                Inicia sesión
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAwareScroll>
    </View>
  );
}
