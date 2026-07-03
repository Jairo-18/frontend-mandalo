import { ActivityIndicator, Pressable, Text } from 'react-native';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
}: Props) {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`h-[54px] items-center justify-center rounded-[30px] active:opacity-80 ${
        isPrimary
          ? 'bg-primary shadow-md'
          : 'border-[1.5px] border-primary bg-white'
      } ${disabled ? 'opacity-50' : ''}`}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#FFFFFF' : '#FF5A3C'} />
      ) : (
        <Text
          className={`text-base font-bold ${
            isPrimary ? 'text-white' : 'text-primary'
          }`}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
