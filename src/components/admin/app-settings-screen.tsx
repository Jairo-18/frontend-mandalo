import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { FormSection } from '@/components/ui/form-section';
import { TextField } from '@/components/ui/text-field';
import { AppColors, appSettingsService, DEFAULT_APP_COLORS } from '@/services/app-settings';

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

type Field = {
  key: keyof AppColors;
  label: string;
  hint: string;
};

/** Identidad de marca: un solo valor, no cambia con el tema claro/oscuro. */
const FIXED_FIELDS: Field[] = [
  {
    key: 'primaryColor',
    label: 'Color principal',
    hint: 'Botones, links, iconos activos. El acento de marca.',
  },
  {
    key: 'darkColor',
    label: 'Color oscuro (cabeceras)',
    hint: 'Franjas y cabeceras de marca (home, drawers, dashboards).',
  },
];

/** Un par de estos (claro/oscuro) por cada rol de color — ver `buildPairFields`. */
const ROLES: { role: string; label: string; hint: string }[] = [
  { role: 'surface', label: 'Fondo de pantalla', hint: 'Fondo general de las pantallas.' },
  { role: 'card', label: 'Tarjetas e inputs', hint: 'Tarjetas, campos de formulario, hojas.' },
  {
    role: 'textPrimary',
    label: 'Texto principal',
    hint: 'Títulos y texto fuerte.',
  },
  {
    role: 'textSecondary',
    label: 'Texto secundario',
    hint: 'Subtítulos, descripciones, texto de apoyo.',
  },
  { role: 'border', label: 'Bordes y divisores', hint: 'Líneas, separadores, contornos sutiles.' },
];

function buildPairFields(mode: 'Light' | 'Dark'): Field[] {
  return ROLES.map(({ role, label, hint }) => ({
    key: `${role}${mode}Color` as keyof AppColors,
    label,
    hint,
  }));
}

const LIGHT_FIELDS = buildPairFields('Light');
const DARK_FIELDS = buildPairFields('Dark');
const ALL_FIELDS = [...FIXED_FIELDS, ...LIGHT_FIELDS, ...DARK_FIELDS];

/** ¿"#RRGGBB" válido? (mismo formato que valida el backend). */
function isValidHex(value: string): boolean {
  return HEX_RE.test(value);
}

function ColorField({
  field,
  value,
  onChangeText,
}: {
  field: Field;
  value: string;
  onChangeText: (text: string) => void;
}) {
  const valid = isValidHex(value);
  return (
    <View className="mb-3">
      <View className="flex-row items-end gap-3">
        <View className="flex-1">
          <TextField
            label={field.label}
            icon="color-palette-outline"
            value={value}
            onChangeText={onChangeText}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={7}
            error={!valid ? 'Debe ser un color hex, ej: #FF5A3C' : undefined}
          />
        </View>
        <View
          className="mb-4 h-[52px] w-[52px] items-center justify-center rounded-xl border border-border"
          style={{ backgroundColor: valid ? value : '#FFFFFF' }}
        >
          {!valid && <View className="h-6 w-6 rounded-full border border-border" />}
        </View>
      </View>
      <Text className="-mt-2 text-xs text-muted">{field.hint}</Text>
    </View>
  );
}

/**
 * Pantalla "Aplicación" del panel admin (§50/§51): edita los 12 colores base
 * de la marca — 2 fijos (identidad, no cambian con el tema) + 5 pares
 * claro/oscuro (cada uno EXPLÍCITO, nada se deriva solo). Se guardan en
 * `appSettings` (backend) y los usuarios los ven la PRÓXIMA VEZ que abran la
 * app (se cargan una vez al inicio, como departamentos/tipos de
 * identificación — ver `context/app-data.tsx`).
 */
export function AppSettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<AppColors>(DEFAULT_APP_COLORS);
  const [initial, setInitial] = useState<AppColors>(DEFAULT_APP_COLORS);

  useEffect(() => {
    appSettingsService
      .get()
      .then((res) => {
        const loaded: AppColors = {
          primaryColor: res.data.primaryColor,
          darkColor: res.data.darkColor,
          surfaceLightColor: res.data.surfaceLightColor,
          surfaceDarkColor: res.data.surfaceDarkColor,
          cardLightColor: res.data.cardLightColor,
          cardDarkColor: res.data.cardDarkColor,
          textPrimaryLightColor: res.data.textPrimaryLightColor,
          textPrimaryDarkColor: res.data.textPrimaryDarkColor,
          textSecondaryLightColor: res.data.textSecondaryLightColor,
          textSecondaryDarkColor: res.data.textSecondaryDarkColor,
          borderLightColor: res.data.borderLightColor,
          borderDarkColor: res.data.borderDarkColor,
        };
        setValues(loaded);
        setInitial(loaded);
      })
      .catch(() => {
        // El interceptor HTTP ya mostró el error; se queda con los defaults.
      })
      .finally(() => setLoading(false));
  }, []);

  const allValid = ALL_FIELDS.every((f) => isValidHex(values[f.key]));
  const dirty = ALL_FIELDS.some((f) => values[f.key] !== initial[f.key]);

  async function handleSave() {
    if (!allValid) return;
    setSaving(true);
    try {
      await appSettingsService.update(values);
      setInitial(values);
    } catch {
      // El interceptor HTTP ya mostró el error.
    } finally {
      setSaving(false);
    }
  }

  function setField(key: keyof AppColors, text: string) {
    setValues((v) => ({ ...v, [key]: text }));
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color={values.primaryColor} />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerClassName="p-5 pb-10">
      <Text className="mb-4 text-sm leading-5 text-muted">
        Estos son los colores base de toda la app. Los cambios los ven los
        usuarios la próxima vez que abran Mándalo (no hace falta publicar una
        actualización).
      </Text>

      <View className="rounded-2xl bg-card p-4">
        <FormSection label="Marca (fijo, no cambia con el tema)" />
        {FIXED_FIELDS.map((field) => (
          <ColorField
            key={field.key}
            field={field}
            value={values[field.key]}
            onChangeText={(text) => setField(field.key, text)}
          />
        ))}

        <FormSection label="Modo claro" />
        {LIGHT_FIELDS.map((field) => (
          <ColorField
            key={field.key}
            field={field}
            value={values[field.key]}
            onChangeText={(text) => setField(field.key, text)}
          />
        ))}

        <FormSection label="Modo oscuro" />
        {DARK_FIELDS.map((field) => (
          <ColorField
            key={field.key}
            field={field}
            value={values[field.key]}
            onChangeText={(text) => setField(field.key, text)}
          />
        ))}

        <Button
          label="Guardar colores"
          onPress={handleSave}
          loading={saving}
          disabled={!allValid || !dirty}
        />
      </View>
    </ScrollView>
  );
}
