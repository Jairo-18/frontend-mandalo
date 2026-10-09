import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';

import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';

type Variant = 'primary' | 'success' | 'danger-outline';

type Props = {
  label: string;
  onPress: () => void | Promise<void>;
  variant?: Variant;
  /** Visible pero sin acción (p. ej. mientras corre una espera). */
  disabled?: boolean;
};

const STYLES: Record<
  Exclude<Variant, 'primary'>,
  { box: string; text: string; spinner: string }
> = {
  success: { box: 'bg-emerald-600', text: 'text-white', spinner: '#FFFFFF' },
  'danger-outline': {
    box: 'border border-red-200 bg-card',
    text: 'text-red-600',
    spinner: '#DC2626',
  },
};

/** Botón de acción de pedido con estado de carga (aceptar, preparar, tomar…).
 * La variante `primary` usa el degradado de marca (antes `bg-primary` sólido).
 *
 * `flex-1` reparte el ANCHO cuando va en fila (Cancelar | Preparar). Solo, en
 * una columna (`gap-2`), `flex-1` = flexBasis 0 y el botón quedaba en 0 de
 * alto: invisible ("Rechazar comprobante" del negocio). `min-h-[52px]` lo
 * evita sin cambiar nada en las filas. */
export function ActionButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
}: Props) {
  const [working, setWorking] = useState(false);
  const colors = useResolvedAppColors();

  async function handlePress() {
    if (working || disabled) return;
    try {
      setWorking(true);
      await onPress();
    } catch {
      // El interceptor HTTP ya mostró el error (p. ej. una transición
      // rechazada por tocar cuando el pedido ya cambió de estado).
    } finally {
      setWorking(false);
    }
  }

  const content = working ? (
    <ActivityIndicator
      color={variant === 'primary' ? '#FFFFFF' : STYLES[variant].spinner}
    />
  ) : (
    <Text
      className={`text-[15px] font-bold ${
        variant === 'primary' ? 'text-white' : STYLES[variant].text
      }`}
    >
      {label}
    </Text>
  );

  if (variant === 'primary') {
    return (
      <Pressable
        onPress={handlePress}
        disabled={working || disabled}
        className={`min-h-[52px] flex-1 overflow-hidden rounded-2xl active:opacity-80 ${working ? 'opacity-70' : ''} ${disabled ? 'opacity-40' : ''}`}
      >
        <LinearGradient
          colors={[colors.primaryColor, colors.darkColor]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ height: 52, alignItems: 'center', justifyContent: 'center' }}
        >
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={working || disabled}
      className={`h-[52px] min-h-[52px] flex-1 items-center justify-center rounded-2xl active:opacity-80 ${STYLES[variant].box} ${
        working ? 'opacity-70' : ''
      } ${disabled ? 'opacity-40' : ''}`}
    >
      {content}
    </Pressable>
  );
}
