import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { FormSection } from '@/components/ui/form-section';
import { KeyboardAwareScroll } from '@/components/ui/keyboard-aware-scroll';
import { ListEmpty } from '@/components/ui/list-empty';
import { Select } from '@/components/ui/select';
import { TextField } from '@/components/ui/text-field';
import { YesNoDialog } from '@/components/ui/yes-no-dialog';
import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';
import { formatPrice } from '@/lib/price';
import { copToNumber, formatText } from '@/lib/text-format';
import {
  municipalityPricingService,
  PricingOverview,
  PricingValues,
  PricingView,
} from '@/services/municipality-pricing';

type Kind = 'cop' | 'decimal' | 'int' | 'time';

type FieldDef = {
  key: keyof PricingValues;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  kind: Kind;
  hint?: string;
};

type SectionDef = { title: string; description?: string; fields: FieldDef[] };

const SECTIONS: SectionDef[] = [
  {
    title: 'Domicilio por distancia',
    description:
      'Lo que paga el cliente por el domicilio: la tarifa base cubre hasta el radio base; cada km de más suma el valor por km adicional.',
    fields: [
      {
        key: 'baseFee',
        label: 'Tarifa base',
        icon: 'cash-outline',
        kind: 'cop',
        hint: 'También es el cobro mínimo de cualquier domicilio.',
      },
      { key: 'baseKm', label: 'Radio base (km)', icon: 'navigate-outline', kind: 'decimal' },
      { key: 'extraKmRate', label: 'Valor por km adicional', icon: 'trending-up-outline', kind: 'cop' },
      {
        key: 'baseMandaloCut',
        label: 'Parte de Mándalo en la tarifa base',
        icon: 'business-outline',
        kind: 'cop',
        hint: 'El resto de la tarifa base es del repartidor.',
      },
      {
        key: 'extraMandaloRate',
        label: '% de Mándalo en el excedente por km',
        icon: 'pie-chart-outline',
        kind: 'decimal',
        hint: 'El resto del excedente es del repartidor.',
      },
    ],
  },
  {
    title: 'Recargos',
    description:
      'Van 100% al repartidor y se le informan al cliente antes de confirmar el pedido. En 0, el recargo queda apagado.',
    fields: [
      { key: 'nightSurcharge', label: 'Recargo nocturno', icon: 'moon-outline', kind: 'cop' },
      {
        key: 'nightStartTime',
        label: 'Noche desde (HH:MM)',
        icon: 'time-outline',
        kind: 'time',
        hint: 'Hora de Colombia, formato 24 h. Ej: 23:00',
      },
      {
        key: 'nightEndTime',
        label: 'Noche hasta (HH:MM)',
        icon: 'time-outline',
        kind: 'time',
        hint: 'Puede ser del día siguiente. Ej: 05:30',
      },
      { key: 'weatherSurcharge', label: 'Recargo por lluvia fuerte', icon: 'rainy-outline', kind: 'cop' },
      {
        key: 'weatherHeavyRainMm',
        label: 'Lluvia fuerte desde (mm por hora)',
        icon: 'water-outline',
        kind: 'decimal',
        hint: 'Se mide en vivo en la ubicación del negocio. 7,5 mm/h es el estándar de "lluvia fuerte".',
      },
      { key: 'demandSurcharge', label: 'Recargo por alta demanda', icon: 'flame-outline', kind: 'cop' },
      {
        key: 'demandThreshold',
        label: 'Alta demanda desde (pedidos en espera)',
        icon: 'layers-outline',
        kind: 'int',
        hint: 'Pedidos listos sin repartidor en este municipio. 0 = apagado.',
      },
    ],
  },
  {
    title: 'Segundo intento de entrega',
    description:
      'Si el repartidor llega y no puede entregar, se espera este tiempo; después el cliente o el repartidor pueden pedir un segundo intento con este cargo (una sola vez por pedido).',
    fields: [
      { key: 'retryFee', label: 'Cargo del segundo intento', icon: 'refresh-outline', kind: 'cop' },
      { key: 'waitMinutes', label: 'Minutos de espera en el sitio', icon: 'hourglass-outline', kind: 'int' },
    ],
  },
  {
    title: 'Tarifa de servicio',
    description: 'Ingreso de Mándalo, sobre el subtotal de los productos (sin el domicilio).',
    fields: [
      { key: 'serviceFeePercent', label: '% del subtotal', icon: 'receipt-outline', kind: 'decimal' },
      {
        key: 'serviceFeeCap',
        label: 'Tope de la tarifa de servicio',
        icon: 'shield-outline',
        kind: 'cop',
        hint: '0 = sin tope.',
      },
    ],
  },
];

const ALL_FIELDS = SECTIONS.flatMap((s) => s.fields);
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DECIMAL_RE = /^\d+([.,]\d{1,2})?$/;
const INT_RE = /^\d+$/;

type FormValues = Record<keyof PricingValues, string>;

function toText(kind: Kind, value: number | string): string {
  if (kind === 'time') return String(value);
  if (kind === 'cop') return formatText('cop', String(Math.round(Number(value))));
  if (kind === 'decimal') return String(value).replace('.', ',');
  return String(value);
}

function toForm(values: PricingValues): FormValues {
  const out = {} as FormValues;
  for (const f of ALL_FIELDS) out[f.key] = toText(f.kind, values[f.key]);
  return out;
}

/** Texto del campo → valor para el backend (NaN / null si no es válido). */
function parse(kind: Kind, text: string): number | string | null {
  const value = text.trim();
  if (kind === 'time') return TIME_RE.test(value) ? value : null;
  if (kind === 'cop') {
    const n = copToNumber(value);
    return Number.isFinite(n) ? n : null;
  }
  if (kind === 'decimal') {
    return DECIMAL_RE.test(value) ? parseFloat(value.replace(',', '.')) : null;
  }
  return INT_RE.test(value) ? parseInt(value, 10) : null;
}

function kindError(kind: Kind): string {
  if (kind === 'time') return 'Usa el formato HH:MM, ej: 23:00';
  if (kind === 'int') return 'Debe ser un número entero';
  if (kind === 'decimal') return 'Debe ser un número (máx. 2 decimales)';
  return 'Debe ser un valor en pesos';
}

/** Misma fórmula que el backend (DeliveryPricingService.feeForDistance). */
function feeFor(km: number, baseKm: number, baseFee: number, extraKmRate: number) {
  return km <= baseKm ? baseFee : baseFee + (km - baseKm) * extraKmRate;
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
}

type EditorProps = {
  /** Nombre de lo que se edita ("Tarifa general", "Mocoa"). */
  title: string;
  kind: 'general' | 'municipality';
  isCustom: boolean;
  pricing: PricingView;
  readOnlyFields: (keyof PricingValues)[];
  onSave: (payload: Partial<PricingValues>) => Promise<void>;
  onReset?: () => Promise<void>;
};

function PricingEditor({
  title,
  kind,
  isCustom,
  pricing,
  readOnlyFields,
  onSave,
  onReset,
}: EditorProps) {
  const colors = useResolvedAppColors();
  const initial = useMemo(() => toForm(pricing), [pricing]);
  const [values, setValues] = useState<FormValues>(initial);
  const [saving, setSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const parsed = useMemo(() => {
    const out: Partial<Record<keyof PricingValues, number | string | null>> = {};
    for (const f of ALL_FIELDS) out[f.key] = parse(f.kind, values[f.key]);
    return out;
  }, [values]);

  const fieldErrors = useMemo(() => {
    const errors: Partial<Record<keyof PricingValues, string>> = {};
    for (const f of ALL_FIELDS) {
      if (parsed[f.key] === null) errors[f.key] = kindError(f.kind);
    }
    const cut = parsed.baseMandaloCut;
    const base = parsed.baseFee;
    if (typeof cut === 'number' && typeof base === 'number' && cut > base) {
      errors.baseMandaloCut = 'No puede ser mayor que la tarifa base';
    }
    if (typeof base === 'number' && base <= 0) {
      errors.baseFee = 'La tarifa base debe ser mayor a 0';
    }
    if (
      typeof parsed.nightStartTime === 'string' &&
      parsed.nightStartTime === parsed.nightEndTime
    ) {
      errors.nightEndTime = 'Debe ser distinta de la hora de inicio';
    }
    return errors;
  }, [parsed]);

  const changedKeys = ALL_FIELDS.filter(
    (f) => values[f.key] !== initial[f.key],
  ).map((f) => f.key);
  const valid = Object.keys(fieldErrors).length === 0;
  // Un municipio que hereda la general se puede "guardar" sin cambios: eso
  // lo deja con tarifa propia (congelada con los valores actuales).
  const canSave =
    valid && (changedKeys.length > 0 || (kind === 'municipality' && !isCustom));

  const examples = useMemo(() => {
    const { baseKm, baseFee, extraKmRate } = parsed;
    if (
      typeof baseKm !== 'number' ||
      typeof baseFee !== 'number' ||
      typeof extraKmRate !== 'number'
    ) {
      return null;
    }
    const kms = [Math.max(1, Math.floor(baseKm)), Math.ceil(baseKm) + 2, Math.ceil(baseKm) + 5];
    return kms
      .map((km) => `${km} km → ${formatPrice(feeFor(km, baseKm, baseFee, extraKmRate))}`)
      .join('   ·   ');
  }, [parsed]);

  async function handleSave() {
    if (!canSave) return;
    const payload: Partial<Record<keyof PricingValues, number | string>> = {};
    for (const key of changedKeys) {
      if (readOnlyFields.includes(key)) continue;
      payload[key] = parsed[key] as number | string;
    }
    setSaving(true);
    try {
      await onSave(payload as Partial<PricingValues>);
    } catch {
      // El interceptor HTTP ya mostró el error.
    } finally {
      setSaving(false);
    }
  }

  const updatedAt = formatDate(pricing.updatedAt);
  const showMeta = (kind === 'general' || isCustom) && (updatedAt || pricing.updatedBy);

  return (
    <View>
      {/* Estado de la tarifa */}
      <View className="mb-4 rounded-2xl bg-card p-4">
        <View className="flex-row items-center gap-2">
          <Ionicons
            name={kind === 'general' ? 'globe-outline' : 'location-outline'}
            size={20}
            color={colors.primaryColor}
          />
          <Text className="flex-1 text-[17px] font-extrabold text-ink">{title}</Text>
          {kind === 'municipality' && (
            <View
              className={`rounded-full px-2.5 py-1 ${isCustom ? 'bg-primary-tint' : 'bg-surface'}`}
            >
              <Text
                className={`text-[11px] font-bold ${isCustom ? 'text-primary' : 'text-muted'}`}
              >
                {isCustom ? 'Tarifa propia' : 'Usa la tarifa general'}
              </Text>
            </View>
          )}
        </View>
        <Text className="mt-2 text-[13px] leading-5 text-muted">
          {kind === 'general'
            ? 'Aplica a todos los municipios que no tienen tarifa propia. Los municipios con tarifa propia no se ven afectados por estos cambios.'
            : isCustom
              ? 'Este municipio tiene su propia tarifa: los cambios en la tarifa general no lo afectan.'
              : 'Hoy este municipio cobra con la tarifa general (valores de abajo). Al guardar, quedará con tarifa propia y ya no seguirá los cambios de la general.'}
        </Text>
        <Text className="mt-2 text-[12px] leading-5 text-muted">
          Los pedidos ya creados no cambian: cada pedido guarda los valores con los que se cobró.
        </Text>
        {showMeta ? (
          <Text className="mt-2 text-[12px] text-muted">
            Última edición{updatedAt ? `: ${updatedAt}` : ''}
            {pricing.updatedBy ? ` · ${pricing.updatedBy.fullName}` : ''}
          </Text>
        ) : null}
        {kind === 'municipality' && isCustom && onReset ? (
          <Pressable
            onPress={() => setConfirmReset(true)}
            className="mt-3 flex-row items-center gap-1.5 self-start active:opacity-70"
          >
            <Ionicons name="arrow-undo-outline" size={16} color={colors.primaryColor} />
            <Text className="text-[13px] font-bold text-primary">Volver a la tarifa general</Text>
          </Pressable>
        ) : null}
      </View>

      {SECTIONS.map((section) => (
        <View key={section.title} className="mb-4 rounded-2xl bg-card p-4">
          <FormSection label={section.title} />
          {section.description ? (
            <Text className="-mt-2 mb-3 text-xs leading-5 text-muted">{section.description}</Text>
          ) : null}
          {section.fields.map((field) => {
            const readOnly = readOnlyFields.includes(field.key);
            return (
              <View key={field.key} className="mb-1">
                <TextField
                  label={field.label}
                  icon={field.icon}
                  value={values[field.key]}
                  readOnly={readOnly}
                  format={field.kind === 'cop' ? 'cop' : undefined}
                  keyboardType={
                    field.kind === 'decimal'
                      ? 'decimal-pad'
                      : field.kind === 'int'
                        ? 'number-pad'
                        : field.kind === 'time'
                          ? 'numbers-and-punctuation'
                          : undefined
                  }
                  maxLength={field.kind === 'time' ? 5 : 12}
                  autoCorrect={false}
                  onChangeText={(text) => setValues((v) => ({ ...v, [field.key]: text }))}
                  error={fieldErrors[field.key]}
                />
                {readOnly ? (
                  <Text className="-mt-2 mb-2 text-xs text-muted">
                    Solo el superadministrador puede cambiar este valor.
                  </Text>
                ) : field.hint ? (
                  <Text className="-mt-2 mb-2 text-xs text-muted">{field.hint}</Text>
                ) : null}
              </View>
            );
          })}
          {section.title === 'Domicilio por distancia' && examples ? (
            <View className="mt-1 rounded-xl bg-surface px-3 py-2.5">
              <Text className="text-[12px] font-bold text-ink">Así queda el domicilio (sin recargos)</Text>
              <Text className="mt-1 text-[12px] text-muted">{examples}</Text>
            </View>
          ) : null}
        </View>
      ))}

      <Button
        label={
          kind === 'general'
            ? 'Guardar tarifa general'
            : isCustom
              ? `Guardar tarifa de ${title}`
              : `Crear tarifa propia de ${title}`
        }
        onPress={handleSave}
        loading={saving}
        disabled={!canSave}
      />

      <YesNoDialog
        visible={confirmReset}
        title={`¿Volver ${title} a la tarifa general?`}
        message="Se borra la tarifa propia de este municipio y sus nuevos pedidos se cobrarán con la tarifa general. Los pedidos ya creados no cambian."
        confirmLabel="Sí, usar la general"
        icon="arrow-undo-outline"
        onCancel={() => setConfirmReset(false)}
        onConfirm={async () => {
          try {
            await onReset?.();
          } catch {
            // El interceptor HTTP ya mostró el error.
          } finally {
            setConfirmReset(false);
          }
        }}
      />
    </View>
  );
}

/** 0 = tarifa general (los ids de municipio empiezan en 1). */
const GENERAL = 0;

/**
 * "Tarifas" del panel admin: precio del domicilio, recargos, segundo intento
 * y tarifa de servicio, POR MUNICIPIO.
 * - SUPERADMIN: elige "Tarifa general" o cualquier municipio del Putumayo
 *   (o donde haya negocios) y edita todo.
 * - ADMIN regional: va directo a SU municipio; no ve el selector ni toca la
 *   parte de Mándalo (el backend lo hace cumplir igual).
 */
export function PricingScreen() {
  const colors = useResolvedAppColors();
  const [overview, setOverview] = useState<PricingOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);

  // Recarga (tras guardar/restablecer/reintentar): se llama desde handlers,
  // nunca desde el cuerpo de un efecto (regla react-hooks/set-state-in-effect).
  const load = useCallback(
    () =>
      municipalityPricingService
        .overview()
        .then((res) => {
          setOverview(res.data);
          setSelected((current) => {
            if (current != null) return current;
            if (res.data.canEditGeneral) return GENERAL;
            return res.data.municipalities[0]?.municipality.id ?? null;
          });
        })
        .catch(() => {
          // El interceptor HTTP ya mostró el error.
        })
        .finally(() => setLoading(false)),
    [],
  );

  useEffect(() => {
    municipalityPricingService
      .overview()
      .then((res) => {
        setOverview(res.data);
        setSelected(
          res.data.canEditGeneral
            ? GENERAL
            : (res.data.municipalities[0]?.municipality.id ?? null),
        );
      })
      .catch(() => {
        // El interceptor HTTP ya mostró el error.
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color={colors.primaryColor} />
      </View>
    );
  }

  if (!overview) {
    return (
      <View className="flex-1 bg-surface">
        <ListEmpty
          icon="cloud-offline-outline"
          message="No se pudieron cargar las tarifas."
          actionLabel="Reintentar"
          onAction={() => {
            setLoading(true);
            load();
          }}
        />
      </View>
    );
  }

  if (!overview.canEditGeneral && overview.municipalities.length === 0) {
    return (
      <View className="flex-1 bg-surface">
        <ListEmpty
          icon="location-outline"
          message="Tu usuario administrador no tiene un municipio asignado. Pídele al superadministrador que te lo asigne para poder gestionar sus tarifas."
        />
      </View>
    );
  }

  const item =
    selected == null || selected === GENERAL
      ? null
      : overview.municipalities.find((m) => m.municipality.id === selected) ?? null;

  const options = [
    ...(overview.canEditGeneral ? [{ label: 'Tarifa general', value: GENERAL }] : []),
    ...overview.municipalities.map((m) => ({
      label: `${m.municipality.name}${m.isCustom ? ' · tarifa propia' : ' · usa la general'}`,
      value: m.municipality.id,
    })),
  ];

  const customCount = overview.municipalities.filter((m) => m.isCustom).length;

  return (
    <View className="flex-1 bg-surface">
      <KeyboardAwareScroll extraBottom={40}>
        <View className="p-5">
          {overview.canEditGeneral ? (
            <>
              <Text className="mb-4 text-sm leading-5 text-muted">
                Cada municipio cobra con su tarifa propia o, si no tiene, con la
                tarifa general. La tarifa que aplica a un pedido es la del
                municipio del negocio. {customCount > 0
                  ? `Hoy ${customCount} ${customCount === 1 ? 'municipio tiene' : 'municipios tienen'} tarifa propia.`
                  : 'Hoy todos los municipios usan la tarifa general.'}
              </Text>
              <Select<number>
                label="¿Qué tarifa quieres ver?"
                icon="map-outline"
                options={options}
                value={selected ?? undefined}
                onSelect={setSelected}
              />
            </>
          ) : (
            <Text className="mb-4 text-sm leading-5 text-muted">
              Estas son las tarifas con las que se cobran los pedidos de los
              negocios de tu municipio.
            </Text>
          )}

          {selected === GENERAL ? (
            <PricingEditor
              key={`general-${overview.general.updatedAt ?? ''}`}
              title="Tarifa general"
              kind="general"
              isCustom
              pricing={overview.general}
              readOnlyFields={overview.readOnlyFields}
              onSave={async (payload) => {
                await municipalityPricingService.updateGeneral(payload);
                await load();
              }}
            />
          ) : item ? (
            <PricingEditor
              key={`m-${item.municipality.id}-${item.isCustom}-${item.pricing.updatedAt ?? ''}`}
              title={item.municipality.name}
              kind="municipality"
              isCustom={item.isCustom}
              pricing={item.pricing}
              readOnlyFields={overview.readOnlyFields}
              onSave={async (payload) => {
                await municipalityPricingService.updateMunicipality(
                  item.municipality.id,
                  payload,
                );
                await load();
              }}
              onReset={async () => {
                await municipalityPricingService.resetMunicipality(item.municipality.id);
                await load();
              }}
            />
          ) : null}
        </View>
      </KeyboardAwareScroll>
    </View>
  );
}
