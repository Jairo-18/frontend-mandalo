import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, Text, View } from 'react-native';

import { businessDisplayName, ExploreBusiness } from '@/services/explore';

type Props = {
  business: ExploreBusiness;
  onPress: () => void;
};

/**
 * Tarjeta CUADRADA de negocio para el grid de 2 columnas del home: logo
 * cuadrado arriba, nombre y sus etiquetas. Espejo compacto de `BusinessCard`.
 */
export function BusinessGridCard({ business, onPress }: Props) {
  const logo = business.logoUrl;

  return (
    <Pressable
      onPress={onPress}
      className="mb-3 overflow-hidden rounded-2xl bg-card active:opacity-80"
    >
      <View className="w-full bg-surface" style={{ aspectRatio: 1 }}>
        {logo ? (
          <Image
            source={{ uri: logo }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="storefront-outline" size={40} color="#C9C9D4" />
          </View>
        )}
        {business.isOpen === false && (
          <View className="absolute left-2 top-2 rounded-full bg-dark px-2 py-0.5">
            <Text className="text-[10px] font-bold text-white">Cerrado</Text>
          </View>
        )}
      </View>

      <View className="p-2.5">
        <Text numberOfLines={2} className="min-h-[36px] text-[13px] font-bold text-ink">
          {businessDisplayName(business)}
        </Text>
        {business.tags.length > 0 && (
          <View className="mt-1 flex-row flex-wrap gap-1">
            {business.tags.slice(0, 2).map((tag) => (
              <View
                key={tag.id}
                className="rounded-full bg-primary-tint px-2 py-0.5"
              >
                <Text className="text-[10px] font-bold text-primary">
                  {tag.name}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Pressable>
  );
}
