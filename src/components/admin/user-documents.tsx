import { Ionicons } from '@expo/vector-icons';
import { Image, Text, View } from 'react-native';

type Props = {
  frontUrl?: string | null;
  backUrl?: string | null;
};

/**
 * Documento de identidad del repartidor (solo lectura): las fotos que subió
 * al registrarse, para que el admin las revise antes de activar la cuenta.
 */
export function UserDocuments({ frontUrl, backUrl }: Props) {
  if (!frontUrl && !backUrl) return null;

  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-bold text-gray-700">
        Documento de identidad (subido en el registro)
      </Text>
      <View className="flex-row gap-3">
        {[
          { label: 'Frente', url: frontUrl },
          { label: 'Respaldo', url: backUrl },
        ].map(({ label, url }) => (
          <View key={label} className="flex-1">
            {url ? (
              <Image
                source={{ uri: url }}
                style={{ width: '100%', height: 110, borderRadius: 12 }}
                resizeMode="cover"
              />
            ) : (
              <View className="h-[110px] items-center justify-center rounded-xl bg-surface">
                <Ionicons name="card-outline" size={24} color="#7A7A8A" />
              </View>
            )}
            <Text className="mt-1 text-center text-xs text-muted">{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
