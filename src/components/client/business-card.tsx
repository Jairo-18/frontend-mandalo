import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { businessDisplayName, ExploreBusiness } from '@/services/explore';

type Props = {
  business: ExploreBusiness;
  onPress: () => void;
};

/** Tarjeta de negocio del home del cliente (toca → productos del negocio). */
export function BusinessCard({ business, onPress }: Props) {
  const location = [business.address, business.municipality?.name]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      onPress={onPress}
      className="mb-3 flex-row items-center gap-3 rounded-2xl bg-white p-3.5 active:opacity-80"
    >
      <Avatar
        uri={business.logoUrl}
        icon="storefront-outline"
        size={64}
        shape="rounded"
      />

      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text
            numberOfLines={1}
            className="shrink text-[15px] font-bold text-dark"
          >
            {businessDisplayName(business)}
          </Text>
          {business.isOpen === false && (
            <View className="rounded-full bg-dark px-2 py-0.5">
              <Text className="text-[10px] font-bold text-white">Cerrado</Text>
            </View>
          )}
        </View>

        {!!business.description && (
          <Text numberOfLines={1} className="mt-0.5 text-xs text-muted">
            {business.description}
          </Text>
        )}

        {business.tags.length > 0 && (
          <View className="mt-1.5 flex-row flex-wrap gap-1">
            {business.tags.map((tag) => (
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

        {!!location && (
          <View className="mt-1 flex-row items-center gap-1">
            <Ionicons name="location-outline" size={12} color="#7A7A8A" />
            <Text numberOfLines={1} className="flex-1 text-[11px] text-muted">
              {location}
            </Text>
          </View>
        )}
      </View>

      <Ionicons name="chevron-forward" size={18} color="#C9C9D4" />
    </Pressable>
  );
}
