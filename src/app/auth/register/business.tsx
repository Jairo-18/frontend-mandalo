import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { AuthHeader } from '@/components/auth/auth-header';
import { DeveloperCredit } from '@/components/ui/developer-credit';
import { FormSection } from '@/components/ui/form-section';
import { Button } from '@/components/ui/button';
import { KeyboardAwareScroll } from '@/components/ui/keyboard-aware-scroll';
import { TextField } from '@/components/ui/text-field';
import { useAppTheme } from '@/context/app-theme';
import { useFormErrors } from '@/hooks/use-form-errors';
import { EMAIL_RE, normalizePhone, PHONE_PREFIX } from '@/lib/text-format';
import { authService } from '@/services/auth';

/**
 * "¿Tienes un negocio?" del registro: antes abría el correo del dispositivo
 * con un `mailto:` (el usuario terminaba de escribir el mensaje afuera de la
 * app). Ahora es un formulario propio que manda los datos directo al equipo
 * de Mándalo por correo — los negocios siguen sin auto-registrarse, esto solo
 * reemplaza el paso de "escribirnos".
 */
export default function BusinessLeadScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const { errors, clearError, bind, validate } = useFormErrors();

  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState(PHONE_PREFIX);
  const [contactEmail, setContactEmail] = useState('');
  const [identificationNumber, setIdentificationNumber] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [municipalityAddress, setMunicipalityAddress] = useState('');

  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  function validateForm() {
    return validate({
      businessName: businessName.trim()
        ? undefined
        : 'Ingresa el nombre del negocio.',
      ownerName: ownerName.trim()
        ? undefined
        : 'Ingresa tu nombre completo.',
      phone:
        normalizePhone(phone).replace('+', '').length >= 10
          ? undefined
          : 'Ingresa un número de celular válido.',
      contactEmail:
        !contactEmail.trim() || EMAIL_RE.test(contactEmail.trim())
          ? undefined
          : 'Ingresa un correo válido.',
      businessType: businessType.trim()
        ? undefined
        : 'Ingresa el tipo de negocio.',
      municipalityAddress: municipalityAddress.trim()
        ? undefined
        : 'Ingresa el municipio y la dirección.',
    });
  }

  async function handleSubmit() {
    if (!validateForm()) return;
    try {
      setLoading(true);
      await authService.businessLead({
        businessName: businessName.trim(),
        ownerName: ownerName.trim(),
        phone: normalizePhone(phone),
        contactEmail: contactEmail.trim() || undefined,
        identificationNumber: identificationNumber.trim() || undefined,
        businessType: businessType.trim(),
        municipalityAddress: municipalityAddress.trim(),
      });
      setSent(true);
    } catch {
      // El interceptor HTTP ya mostró el toast con el mensaje del backend.
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-card">
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <KeyboardAwareScroll>
        <AuthHeader
          compact
          subtitle="Registro de negocio"
          onBack={() =>
            router.canGoBack() ? router.back() : router.replace('/auth/register')
          }
        />

        <View className="-mt-7 flex-1 rounded-t-[28px] bg-card px-6 pb-10 pt-7">
          {sent ? (
            <View className="py-6">
              <View className="mb-6 items-center">
                <Text className="mb-2 text-center text-[22px] font-extrabold text-ink">
                  ¡Listo!
                </Text>
                <Text className="text-center text-sm leading-5 text-muted">
                  Recibimos los datos de tu negocio. El equipo de Mandalo te
                  va a contactar pronto para crear tu cuenta.
                </Text>
              </View>
              <Button
                label="Volver a iniciar sesión"
                onPress={() => router.replace('/auth/login')}
              />
            </View>
          ) : (
            <>
              <Text className="mb-1 text-center text-[22px] font-extrabold text-ink">
                Cuéntanos de tu negocio
              </Text>
              <Text className="mb-6 text-center text-sm text-muted">
                Los negocios no se auto-registran: llena estos datos y
                nuestro equipo te contacta para crear tu cuenta.
              </Text>

              <FormSection label="El negocio" />
              <TextField
                label="Nombre del negocio"
                icon="storefront-outline"
                format="text"
                value={businessName}
                onChangeText={bind('businessName', setBusinessName)}
                error={errors.businessName}
                placeholder="Donde el Mono"
              />
              <TextField
                label="Tipo de negocio"
                icon="pricetag-outline"
                format="text"
                value={businessType}
                onChangeText={bind('businessType', setBusinessType)}
                error={errors.businessType}
                placeholder="Restaurante, tienda, ferretería…"
              />
              <TextField
                label="Municipio y dirección"
                icon="location-outline"
                format="text"
                multiline
                value={municipalityAddress}
                onChangeText={bind(
                  'municipalityAddress',
                  setMunicipalityAddress,
                )}
                error={errors.municipalityAddress}
                placeholder="Villagarzón, Putumayo — Cll 10 Cr 3-14"
              />

              <FormSection label="Datos de contacto" />
              <TextField
                label="Tu nombre completo"
                icon="person-outline"
                format="name"
                value={ownerName}
                onChangeText={bind('ownerName', setOwnerName)}
                error={errors.ownerName}
                placeholder="Juan Pérez"
              />
              <TextField
                label="Celular"
                icon="call-outline"
                format="phone"
                value={phone}
                onChangeText={bind('phone', setPhone)}
                error={errors.phone}
                placeholder="3001234567"
                keyboardType="phone-pad"
              />
              <TextField
                label="Correo (opcional)"
                icon="mail-outline"
                format="email"
                noAutofill
                value={contactEmail}
                onChangeText={bind('contactEmail', setContactEmail)}
                error={errors.contactEmail}
                placeholder="tu@correo.com"
              />
              <TextField
                label="NIT o cédula (opcional)"
                icon="finger-print-outline"
                format="identification"
                value={identificationNumber}
                onChangeText={setIdentificationNumber}
                placeholder="1090123456"
              />

              <View className="mt-2">
                <Button
                  label="Enviar"
                  onPress={handleSubmit}
                  loading={loading}
                />
              </View>
            </>
          )}

          <View className="mt-6">
            <DeveloperCredit />
          </View>
        </View>
      </KeyboardAwareScroll>
    </View>
  );
}
