import { Text, View } from 'react-native';

import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';

type Props = {
  /** 0–1. */
  fraction: number;
  /** Texto arriba de la barra (p. ej. "Subiendo foto 2 de 3"). */
  label?: string;
};

/**
 * Barra de progreso de subida real (no un spinner ciego): las subidas con
 * varias fotos (registro de repartidor, fotos de producto) pueden tardar
 * bastante en conexión rural, y sin feedback de avance se sienten "colgadas"
 * aunque estén funcionando bien. Se usa junto al botón de guardar mientras
 * `loading`/`saving` está en true.
 */
export function UploadProgressBar({ fraction, label }: Props) {
  const colors = useResolvedAppColors();
  const pct = Math.round(Math.min(1, Math.max(0, fraction)) * 100);

  return (
    <View className="mb-3">
      <View className="mb-1.5 flex-row items-center justify-between">
        <Text className="text-xs font-medium text-muted">
          {label ?? 'Subiendo…'}
        </Text>
        <Text className="text-xs font-bold text-primary">{pct}%</Text>
      </View>
      <View className="h-2 overflow-hidden rounded-full bg-surface">
        <View
          className="h-2 rounded-full"
          style={{ width: `${pct}%`, backgroundColor: colors.primaryColor }}
        />
      </View>
    </View>
  );
}
