import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { openBrowserAsync } from 'expo-web-browser';

import { Button } from '@/components/ui/button';
import { FilterChips } from '@/components/ui/filter-chips';
import { FormSection } from '@/components/ui/form-section';
import { KeyboardAwareScroll } from '@/components/ui/keyboard-aware-scroll';
import { TextField } from '@/components/ui/text-field';
import { apiUrl } from '@/constants/api';
import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';
import { parseEmailsText } from '@/lib/parse-emails';
import { pickTextFile } from '@/lib/pick-text-file';
import { toast } from '@/lib/toast';
import {
  BulkInviteResult,
  BulkInviteRole,
  bulkInviteUsers,
} from '@/services/admin-bulk-invite';

const ROLE_OPTIONS: { value: BulkInviteRole; label: string }[] = [
  { value: 'USER', label: 'Cliente' },
  { value: 'NEGO', label: 'Negocio' },
  { value: 'DELI', label: 'Domiciliario' },
];

/**
 * "Alta masiva" del panel admin (§72): sube un CSV/.txt o escribe correos a
 * mano, elige el rol (una sola tanda = un solo rol) y crea cuentas nuevas con
 * la contraseña fija de ese rol — cada una recibe su propio correo de
 * bienvenida por separado (nunca todas en el mismo correo). Los correos que
 * ya tienen cuenta se omiten sin tocarlos.
 */
export function BulkInviteScreen() {
  const colors = useResolvedAppColors();
  const [role, setRole] = useState<BulkInviteRole>('USER');
  const [manualText, setManualText] = useState('');
  const [fileText, setFileText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<BulkInviteResult | null>(null);

  const { valid, invalid } = useMemo(
    () => parseEmailsText(`${fileText}\n${manualText}`),
    [fileText, manualText],
  );

  async function handlePickFile() {
    setPicking(true);
    try {
      const text = await pickTextFile();
      if (text) {
        setFileText(text);
        setFileName('Archivo cargado');
      }
    } catch {
      toast.error('No se pudo leer el archivo');
    } finally {
      setPicking(false);
    }
  }

  function clearFile() {
    setFileText('');
    setFileName(null);
  }

  /** Abre el correo de bienvenida renderizado con datos de ejemplo (mismo
   * HTML que se manda de verdad) en el navegador — para revisar el diseño
   * antes de mandarlo a nadie. */
  async function handlePreview() {
    const url = apiUrl(`user/bulk-invite/preview?role=${role}`);
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      await openBrowserAsync(url);
    }
  }

  async function handleSend() {
    if (valid.length === 0) {
      toast.error('Agrega al menos un correo válido');
      return;
    }
    setSending(true);
    setResult(null);
    try {
      const res = await bulkInviteUsers(role, valid);
      setResult(res);
      setManualText('');
      clearFile();
    } catch {
      // El interceptor HTTP ya mostró el error.
    } finally {
      setSending(false);
    }
  }

  return (
    <View className="flex-1 bg-surface">
      <KeyboardAwareScroll extraBottom={40}>
        <View className="p-5">
          <Text className="mb-4 text-sm leading-5 text-muted">
            Sube o escribe los correos de las cuentas que quieres crear. Todas
            las de esta tanda nacen con el mismo rol y la misma contraseña fija
            de ese rol; cada una recibe su propio correo de bienvenida.
          </Text>

          <View className="rounded-2xl bg-card p-4">
            <FormSection label="Rol de esta tanda" />
            <View className="mb-3">
              <FilterChips options={ROLE_OPTIONS} value={role} onChange={setRole} />
            </View>
            <Pressable
              onPress={handlePreview}
              className="mb-4 flex-row items-center justify-center gap-2 self-start rounded-full border border-primary px-4 py-2 active:opacity-70"
            >
              <Ionicons name="eye-outline" size={16} color={colors.primaryColor} />
              <Text className="text-xs font-bold text-primary">
                Ver preview del correo
              </Text>
            </Pressable>

            <FormSection label="Subir CSV o .txt" />
            <Text className="-mt-2 mb-3 text-xs text-muted">
              Un correo por línea, o separados por comas.
            </Text>
            {fileName ? (
              <View className="mb-4 flex-row items-center justify-between rounded-xl border border-border bg-surface px-3.5 py-3">
                <View className="flex-row items-center gap-2">
                  <Ionicons
                    name="document-text-outline"
                    size={20}
                    color={colors.primaryColor}
                  />
                  <Text className="text-sm font-semibold text-ink">{fileName}</Text>
                </View>
                <Pressable onPress={clearFile} hitSlop={8}>
                  <Ionicons name="close-circle" size={20} color={colors.mutedColor} />
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={handlePickFile}
                disabled={picking}
                className="mb-4 h-[52px] flex-row items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-surface active:opacity-80"
              >
                <Ionicons name="cloud-upload-outline" size={20} color={colors.mutedColor} />
                <Text className="text-sm font-semibold text-muted">
                  {picking ? 'Abriendo…' : 'Elegir archivo .csv o .txt'}
                </Text>
              </Pressable>
            )}

            <FormSection label="O escribe los correos" />
            <TextField
              label="Correos"
              icon="mail-outline"
              value={manualText}
              onChangeText={setManualText}
              placeholder="correo1@gmail.com, correo2@gmail.com..."
              multiline
              numberOfLines={5}
              autoCapitalize="none"
            />

            <View className="mb-4 flex-row flex-wrap items-center gap-2">
              <Text className="text-xs font-semibold text-ink">
                {valid.length} correo(s) válido(s) detectado(s)
              </Text>
              {invalid.length > 0 ? (
                <Text className="text-xs font-semibold text-red-500">
                  · {invalid.length} inválido(s): {invalid.slice(0, 3).join(', ')}
                  {invalid.length > 3 ? '…' : ''}
                </Text>
              ) : null}
            </View>

            <Button
              label={`Enviar invitaciones (${valid.length})`}
              onPress={handleSend}
              loading={sending}
              disabled={valid.length === 0}
            />
          </View>

          {result ? (
            <View className="mt-4 rounded-2xl bg-card p-4">
              <FormSection label="Resultado" />
              <Text className="mb-1 text-sm text-ink">
                ✅ {result.created.length} cuenta(s) creada(s) y notificada(s) por
                correo
              </Text>
              {result.skippedExisting.length > 0 ? (
                <Text className="mb-1 text-sm text-muted">
                  ⏭️ {result.skippedExisting.length} ya tenían cuenta (omitidos):{' '}
                  {result.skippedExisting.join(', ')}
                </Text>
              ) : null}
              {result.failed.length > 0 ? (
                <Text className="text-sm text-red-500">
                  ⚠️ {result.failed.length} fallaron: {result.failed.join(', ')}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      </KeyboardAwareScroll>
    </View>
  );
}
