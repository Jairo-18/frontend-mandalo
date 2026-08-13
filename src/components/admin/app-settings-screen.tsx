import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { FormSection } from '@/components/ui/form-section';
import { KeyboardAwareScroll } from '@/components/ui/keyboard-aware-scroll';
import { TextField } from '@/components/ui/text-field';
import { useAppData } from '@/context/app-data';
import {
  AppColors,
  appSettingsService,
  PlatformArl,
  PlatformSocial,
} from '@/services/app-settings';

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
 * ARL global de la plataforma (reunión con el cliente 2026-08-04): compañía
 * + número de póliza que cubre a TODOS los repartidores — se le muestra a
 * cualquiera que reporte un accidente. Sección aparte de los colores: tiene
 * su propio fetch/guardado (no viene en `useAppData().appColors`, que solo
 * cachea los 12 campos de color en el splash).
 */
function ArlSection() {
  const [values, setValues] = useState<PlatformArl>({
    arlCompanyName: '',
    arlPolicyNumber: '',
  } as PlatformArl);
  const [initial, setInitial] = useState<PlatformArl | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    appSettingsService
      .get()
      .then((res) => {
        const arl: PlatformArl = {
          arlCompanyName: res.data.arlCompanyName ?? '',
          arlPolicyNumber: res.data.arlPolicyNumber ?? '',
        } as PlatformArl;
        setValues(arl);
        setInitial(arl);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const dirty =
    !!initial &&
    (values.arlCompanyName !== initial.arlCompanyName ||
      values.arlPolicyNumber !== initial.arlPolicyNumber);

  async function handleSave() {
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

  if (loading) return null;

  return (
    <View className="mt-4 rounded-2xl bg-card p-4">
      <FormSection label="ARL de la plataforma" />
      <Text className="-mt-2 mb-3 text-xs text-muted">
        Póliza única que cubre a TODOS los repartidores — se le muestra a
        cualquiera que reporte un accidente.
      </Text>
      <TextField
        label="Compañía"
        icon="shield-checkmark-outline"
        value={values.arlCompanyName ?? ''}
        onChangeText={(text) => setValues((v) => ({ ...v, arlCompanyName: text }))}
      />
      <TextField
        label="Número de póliza"
        icon="document-text-outline"
        value={values.arlPolicyNumber ?? ''}
        onChangeText={(text) => setValues((v) => ({ ...v, arlPolicyNumber: text }))}
      />
      <Button label="Guardar ARL" onPress={handleSave} loading={saving} disabled={!dirty} />
    </View>
  );
}

/**
 * Redes y contacto públicos: YouTube/Facebook/Instagram + teléfono de
 * contacto. Se muestran en login/registro (debajo de "¿Cómo funciona
 * Mandalo?") y en la ayuda de los 4 roles. A diferencia de `ArlSection`, esta
 * SÍ se siembra desde `useAppData().platformSocial` (ya está en el contexto
 * global desde el splash) en vez de pedirlo aparte — mismo ahorro de
 * peticiones que la sección de colores de arriba.
 */
function SocialSection() {
  const { platformSocial } = useAppData();
  const [values, setValues] = useState<PlatformSocial>(platformSocial);
  const [initial, setInitial] = useState<PlatformSocial>(platformSocial);
  const [saving, setSaving] = useState(false);

  const dirty =
    values.youtubeUrl !== initial.youtubeUrl ||
    values.facebookUrl !== initial.facebookUrl ||
    values.instagramUrl !== initial.instagramUrl ||
    values.contactPhone !== initial.contactPhone;

  async function handleSave() {
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

  function setField(key: keyof PlatformSocial, text: string) {
    setValues((v) => ({ ...v, [key]: text }));
  }

  return (
    <View className="mt-4 rounded-2xl bg-card p-4">
      <FormSection label="Redes y contacto" />
      <Text className="-mt-2 mb-3 text-xs text-muted">
        Se muestran debajo de "¿Cómo funciona Mandalo?" en el login/registro y
        en la ayuda de todos los roles. Deja vacío el que no aplique.
      </Text>
      <TextField
        label="YouTube"
        icon="logo-youtube"
        value={values.youtubeUrl ?? ''}
        onChangeText={(text) => setField('youtubeUrl', text)}
        placeholder="https://youtube.com/@mandalo"
        autoCapitalize="none"
        keyboardType="url"
      />
      <TextField
        label="Facebook"
        icon="logo-facebook"
        value={values.facebookUrl ?? ''}
        onChangeText={(text) => setField('facebookUrl', text)}
        placeholder="https://facebook.com/mandalo"
        autoCapitalize="none"
        keyboardType="url"
      />
      <TextField
        label="Instagram"
        icon="logo-instagram"
        value={values.instagramUrl ?? ''}
        onChangeText={(text) => setField('instagramUrl', text)}
        placeholder="https://instagram.com/mandalo"
        autoCapitalize="none"
        keyboardType="url"
      />
      <TextField
        label="Teléfono de contacto (WhatsApp)"
        icon="logo-whatsapp"
        format="phone"
        value={values.contactPhone ?? ''}
        onChangeText={(text) => setField('contactPhone', text)}
        placeholder="+57 - 300 123 456 7"
      />
      <Button
        label="Guardar redes y contacto"
        onPress={handleSave}
        loading={saving}
        disabled={!dirty}
      />
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
 *
 * El formulario se siembra desde `useAppData().appColors` — el arranque de la
 * app YA los cargó (`GET /app-settings`), así que volver a pedirlos acá era
 * la misma petición de nuevo cada vez que el admin abre esta pantalla
 * (auditoría de peticiones).
 */
export function AppSettingsScreen() {
  const { appColors } = useAppData();
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<AppColors>(appColors);
  const [initial, setInitial] = useState<AppColors>(appColors);

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

  return (
    <View className="flex-1 bg-surface">
    <KeyboardAwareScroll extraBottom={40}>
      <View className="p-5">
      <Text className="mb-4 text-sm leading-5 text-muted">
        Estos son los colores base de toda la app. Los cambios los ven los
        usuarios la próxima vez que abran Mandalo (no hace falta publicar una
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

      <ArlSection />
      <SocialSection />
      </View>
    </KeyboardAwareScroll>
    </View>
  );
}
