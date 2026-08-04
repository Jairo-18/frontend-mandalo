import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { formatCountdown, useCountdown } from '@/hooks/use-countdown';
import { formatPrice } from '@/lib/price';
import { getAppColors } from '@/lib/app-colors';

const WAIT_MINUTES = 5;
const RETRY_FEE = 6000;

type Props = {
  arrivedAt: string;
  retryCount: number;
  onRetry: () => void | Promise<void>;
  retrying?: boolean;
};

/**
 * Cronómetro de espera en el sitio (reunión con el cliente 2026-08-04): 5
 * minutos desde `arrivedAt`. Al agotarse (y si no se ha usado ya el único
 * segundo intento), ofrece "¿Deseas esperar 5 minutos más?" — lo comparten
 * la vista del repartidor y la del cliente (los dos pueden pedirlo).
 */
export function ArrivalCountdown({
  arrivedAt,
  retryCount,
  onRetry,
  retrying,
}: Props) {
  const { remainingSeconds, expired } = useCountdown(arrivedAt, WAIT_MINUTES * 60);
  const usedRetry = retryCount >= 1;

  if (!expired) {
    return (
      <View className="flex-row items-center gap-2 rounded-xl bg-primary-tint px-3.5 py-2.5">
        <Ionicons name="time-outline" size={18} color={getAppColors().primaryColor} />
        <Text className="flex-1 text-[13px] font-bold text-primary">
          El repartidor está en el sitio — quedan {formatCountdown(remainingSeconds)} para dar el código.
        </Text>
      </View>
    );
  }

  if (usedRetry) {
    return (
      <View className="flex-row items-center gap-2 rounded-xl bg-amber-50 px-3.5 py-2.5">
        <Ionicons name="alert-circle-outline" size={18} color="#B45309" />
        <Text className="flex-1 text-[13px] font-bold text-amber-700">
          Se agotó el tiempo de espera y ya se usó el segundo intento.
        </Text>
      </View>
    );
  }

  return (
    <View className="rounded-xl bg-amber-50 p-3.5">
      <View className="flex-row items-center gap-2">
        <Ionicons name="alert-circle-outline" size={18} color="#B45309" />
        <Text className="flex-1 text-[13px] font-bold text-amber-700">
          Se agotaron los {WAIT_MINUTES} minutos de espera.
        </Text>
      </View>
      <Pressable
        onPress={onRetry}
        disabled={retrying}
        className={`mt-2.5 h-[44px] items-center justify-center rounded-xl bg-amber-600 active:opacity-80 ${
          retrying ? 'opacity-60' : ''
        }`}
      >
        {retrying ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text className="text-[14px] font-bold text-white">
            ¿Deseas esperar {WAIT_MINUTES} minutos más? (+{formatPrice(RETRY_FEE)})
          </Text>
        )}
      </Pressable>
    </View>
  );
}
