import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
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
import { Select } from '@/components/ui/select';
import { TextField } from '@/components/ui/text-field';
import { useAppData } from '@/context/app-data';
import { Municipality } from '@/services/catalog';
import { authService, RegisterPayload } from '@/services/auth';

export default function RegisterForm() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role: string }>();
  const isDelivery = role === 'delivery';

  const { departments, identificationTypes, getMunicipalities } = useAppData();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [address, setAddress] = useState('');
  const [departmentId, setDepartmentId] = useState<number>();
  const [municipalityId, setMunicipalityId] = useState<number>();
  const [identificationNumber, setIdentificationNumber] = useState('');
  const [identificationTypeId, setIdentificationTypeId] = useState<number>();

  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [loadingMuns, setLoadingMuns] = useState(false);
  const [loading, setLoading] = useState(false);

  const departmentOptions = useMemo(
    () => departments.map((d) => ({ label: d.name, value: d.id })),
    [departments],
  );
  const municipalityOptions = useMemo(
    () => municipalities.map((m) => ({ label: m.name, value: m.id })),
    [municipalities],
  );
  const identificationTypeOptions = useMemo(
    () => identificationTypes.map((t) => ({ label: t.name, value: t.id })),
    [identificationTypes],
  );

  async function onSelectDepartment(id: number) {
    setDepartmentId(id);
    setMunicipalityId(undefined);
    setMunicipalities([]);
    setLoadingMuns(true);
    try {
      setMunicipalities(await getMunicipalities(id));
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los municipios.');
    } finally {
      setLoadingMuns(false);
    }
  }

  async function handleRegister() {
    if (
      !fullName.trim() ||
      !username.trim() ||
      !phone.trim() ||
      !email.trim() ||
      !password ||
      !address.trim() ||
      !departmentId ||
      !municipalityId
    ) {
      Alert.alert('Faltan datos', 'Completa todos los campos.');
      return;
    }
    if (isDelivery && (!identificationNumber.trim() || !identificationTypeId)) {
      Alert.alert(
        'Faltan datos',
        'El repartidor debe indicar tipo y número de identificación.',
      );
      return;
    }
    if (password.length < 8) {
      Alert.alert('Contraseña', 'Debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Contraseña', 'Las contraseñas no coinciden.');
      return;
    }

    const payload: RegisterPayload = {
      fullName: fullName.trim(),
      username: username.trim(),
      phone: phone.trim(),
      email: email.trim(),
      password,
      address: address.trim(),
      departmentId,
      municipalityId,
      ...(isDelivery && {
        identificationNumber: identificationNumber.trim(),
        identificationTypeId,
      }),
    };

    try {
      setLoading(true);
      if (isDelivery) {
        await authService.registerDelivery(payload);
      } else {
        await authService.registerClient(payload);
      }
      Alert.alert('¡Cuenta creada!', 'Ya puedes iniciar sesión.', [
        { text: 'OK', onPress: () => router.replace('/auth/login') },
      ]);
    } catch (e) {
      Alert.alert(
        'No se pudo registrar',
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
              value={fullName}
              onChangeText={setFullName}
              placeholder="Juan Pérez"
              autoCapitalize="words"
            />
            <TextField
              label="Nombre de usuario"
              icon="at-outline"
              value={username}
              onChangeText={setUsername}
              placeholder="juanp"
            />
            <TextField
              label="Teléfono"
              icon="call-outline"
              value={phone}
              onChangeText={setPhone}
              placeholder="3001234567"
              keyboardType="phone-pad"
            />
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

            <Select
              label="Departamento"
              icon="map-outline"
              placeholder="Selecciona tu departamento"
              options={departmentOptions}
              value={departmentId}
              onSelect={onSelectDepartment}
            />
            <Select
              label="Municipio"
              icon="location-outline"
              placeholder={
                departmentId
                  ? 'Selecciona tu municipio'
                  : 'Elige un departamento primero'
              }
              options={municipalityOptions}
              value={municipalityId}
              onSelect={setMunicipalityId}
              disabled={!departmentId || loadingMuns}
              loading={loadingMuns}
            />

            <TextField
              label="Dirección"
              icon="home-outline"
              value={address}
              onChangeText={setAddress}
              placeholder="Calle 1 # 2-3"
            />

            {isDelivery && (
              <>
                <Select
                  label="Tipo de identificación"
                  icon="card-outline"
                  placeholder="Selecciona el tipo"
                  options={identificationTypeOptions}
                  value={identificationTypeId}
                  onSelect={setIdentificationTypeId}
                />
                <TextField
                  label="Número de identificación"
                  icon="finger-print-outline"
                  value={identificationNumber}
                  onChangeText={setIdentificationNumber}
                  placeholder="1090123456"
                  keyboardType="number-pad"
                />
              </>
            )}

            <TextField
              label="Contraseña"
              icon="lock-closed-outline"
              secure
              value={password}
              onChangeText={setPassword}
              placeholder="Mínimo 8 caracteres"
            />
            <TextField
              label="Confirmar contraseña"
              icon="lock-closed-outline"
              secure
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Repite tu contraseña"
            />

            <View className="mt-2">
              <Button
                label="Crear cuenta"
                onPress={handleRegister}
                loading={loading}
              />
            </View>

            <View className="mt-5 flex-row justify-center">
              <Text className="text-sm text-muted">¿Ya tienes cuenta? </Text>
              <Pressable onPress={() => router.replace('/auth/login')}>
                <Text className="text-sm font-bold text-primary">
                  Inicia sesión
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
