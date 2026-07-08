import { Text, View } from 'react-native';

type Props = {
  label: string;
  tone: 'green' | 'gray' | 'red' | 'amber' | 'primary';
};

/** Etiquetita de estado de las tarjetas (Activo, Baneado, rol, etc.). */
export function Badge({ label, tone }: Props) {
  const tones = {
    green: 'bg-emerald-50 text-emerald-600',
    gray: 'bg-gray-100 text-gray-500',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
    primary: 'bg-primary-tint text-primary',
  } as const;
  const [bg, text] = tones[tone].split(' ');

  return (
    <View className={`rounded-full px-2.5 py-1 ${bg}`}>
      <Text className={`text-[11px] font-bold ${text}`}>{label}</Text>
    </View>
  );
}
