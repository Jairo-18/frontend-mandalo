import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { KeyboardAwareScroll } from '@/components/ui/keyboard-aware-scroll';
import { PanelHeader, PanelSafeArea } from '@/components/ui/panel-header';
import { PhotoField } from '@/components/ui/photo-field';
import { TextField } from '@/components/ui/text-field';
import { useFormErrors } from '@/hooks/use-form-errors';
import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';
import { useSession } from '@/hooks/use-session';
import { profilePathFor } from '@/lib/session';
import { toast } from '@/lib/toast';
import { profileService } from '@/services/profile';

/**
 * "Mis datos de pago" del REPARTIDOR (Mi cuenta): a dónde le transfiere el
 * cliente un mandado pagado por Nequi — titular, número, llave y QR (solo
 * Nequi por ahora). Sin número ni llave no puede tomar mandados por Nequi.
 */
export function PaymentInfoScreen() {
  const router = useRouter();
  const colors = useResolvedAppColors();
  const profileHref = profilePathFor(useSession()?.user);
  const { errors, bind, validate, applyServerErrors } = useFormErrors();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [holder, setHolder] = useState('');
  const [number, setNumber] = useState('');
  const [key, setKey] = useState('');
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [pendingQr, setPendingQr] = useState<string | null>(null);
  const [removeQr, setRemoveQr] = useState(false);

  useEffect(() => {
    let alive = true;
    profileService
      .getMe()
      .then((res) => {
        if (!alive) return;
        setHolder(res.data.paymentHolderName ?? '');
        setNumber(res.data.nequiNumber ?? '');
        setKey(res.data.nequiKey ?? '');
        setQrUrl(res.data.nequiQrUrl ?? null);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Atrás (también el de Android) vuelve a "Mi cuenta", no al primer tab.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        router.replace(profileHref);
        return true;
      });
      return () => sub.remove();
    }, [router, profileHref]),
  );

  async function handleSave() {
    const digits = number.replace(/\D/g, '');
    const ok = validate({
      nequiNumber:
        digits && !/^3\d{9}$/.test(digits)
          ? 'Debe ser un celular de 10 dígitos que empiece por 3.'
          : undefined,
      paymentHolderName:
        (digits || key.trim()) && !holder.trim()
          ? 'Escribe a nombre de quién está la cuenta.'
          : undefined,
    });
    if (!ok) return;

    setSaving(true);
    try {
      await profileService.updatePaymentInfo({
        paymentHolderName: holder.trim(),
        nequiNumber: digits,
        nequiKey: key.trim(),
      });
      if (pendingQr) {
        const res = await profileService.uploadNequiQr(pendingQr);
        setQrUrl(res.data.nequiQrUrl);
        setPendingQr(null);
      } else if (removeQr && qrUrl) {
        await profileService.removeNequiQr();
        setQrUrl(null);
      }
      setRemoveQr(false);
      toast.success('Tus datos de pago se guardaron.');
      router.replace(profileHref);
    } catch (e) {
      applyServerErrors(e);
    } finally {
      setSaving(false);
    }
  }

  const backButton = (
    <Pressable
      onPress={() => router.replace(profileHref)}
      hitSlop={8}
      className="h-9 w-9 items-center justify-center rounded-full bg-white/10 active:opacity-70"
    >
      <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
    </Pressable>
  );

  return (
    <PanelSafeArea>
      <StatusBar style="light" />
      <View className="flex-1 bg-surface">
        <PanelHeader title="Mis datos de pago" subtitle="Nequi para tus mandados" menu={backButton} />
        {loading ? (
          <ActivityIndicator size="large" color={colors.primaryColor} style={{ paddingTop: 48 }} />
        ) : (
          <KeyboardAwareScroll safeBottom={false}>
            <View className="px-5 pb-4">
              <View className="mt-5 flex-row gap-2.5 rounded-2xl bg-primary-tint p-3.5">
                <Ionicons name="information-circle-outline" size={18} color={colors.primaryColor} />
                <Text className="flex-1 text-[13px] leading-[18px] text-primary">
                  En los mandados el cliente te paga directo a ti. Si paga por Nequi, verá
                  estos datos cuando tomes su mandado. Sin número o llave no puedes tomar
                  mandados pagados por Nequi.
                </Text>
              </View>

              <View className="mt-4 rounded-2xl border border-border bg-card p-4">
                <TextField
                  label="Titular de la cuenta"
                  icon="person-outline"
                  format="name"
                  value={holder}
                  onChangeText={bind('paymentHolderName', setHolder)}
                  error={errors.paymentHolderName}
                  placeholder="Nombre como aparece en Nequi"
                  maxLength={120}
                />
                <TextField
                  label="Número de Nequi"
                  icon="phone-portrait-outline"
                  format="digits"
                  keyboardType="number-pad"
                  value={number}
                  onChangeText={bind('nequiNumber', setNumber)}
                  error={errors.nequiNumber}
                  placeholder="3001234567"
                  maxLength={10}
                />
                <TextField
                  label="Llave de Nequi (opcional)"
                  icon="key-outline"
                  value={key}
                  onChangeText={bind('nequiKey', setKey)}
                  error={errors.nequiKey}
                  placeholder="@tullave"
                  autoCapitalize="none"
                  maxLength={80}
                />

                <PhotoField
                  label="QR de Nequi (opcional)"
                  shape="rounded"
                  placeholderIcon="qr-code-outline"
                  imageUrl={removeQr ? null : qrUrl}
                  pendingUri={pendingQr}
                  onChange={(uri) => {
                    setPendingQr(uri);
                    setRemoveQr(false);
                  }}
                  onRemove={() => {
                    setPendingQr(null);
                    setRemoveQr(true);
                  }}
                />

                <Button label="Guardar" onPress={handleSave} loading={saving} />
              </View>
            </View>
          </KeyboardAwareScroll>
        )}
      </View>
    </PanelSafeArea>
  );
}
