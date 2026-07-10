import { useState } from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';

type Variant = 'primary' | 'success' | 'danger-outline';

type Props = {
  label: string;
  onPress: () => void | Promise<void>;
  variant?: Variant;
};

const STYLES: Record<Variant, { box: string; text: string; spinner: string }> = {
  primary: { box: 'bg-primary', text: 'text-white', spinner: '#FFFFFF' },
  success: { box: 'bg-emerald-600', text: 'text-white', spinner: '#FFFFFF' },
  'danger-outline': {
    box: 'border border-red-200 bg-white',
    text: 'text-red-600',
    spinner: '#DC2626',
  },
};

/** Botón de acción de pedido con estado de carga (aceptar, preparar, tomar…). */
export function ActionButton({ label, onPress, variant = 'primary' }: Props) {
  const [working, setWorking] = useState(false);
  const style = STYLES[variant];

  async function handlePress() {
    if (working) return;
    try {
      setWorking(true);
      await onPress();
    } finally {
      setWorking(false);
    }
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={working}
      className={`h-[52px] flex-1 items-center justify-center rounded-2xl active:opacity-80 ${style.box} ${
        working ? 'opacity-70' : ''
      }`}
    >
      {working ? (
        <ActivityIndicator color={style.spinner} />
      ) : (
        <Text className={`text-[15px] font-bold ${style.text}`}>{label}</Text>
      )}
    </Pressable>
  );
}
