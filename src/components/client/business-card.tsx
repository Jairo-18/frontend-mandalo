import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { businessDisplayName, ExploreBusiness } from '@/services/explore';
import { getAppColors } from '@/lib/app-colors';
import { DEFAULT_BUSINESS_LOGO } from '@/lib/default-images';
import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';

type Props = {
  business: ExploreBusiness;
  onPress: () => void;
};

/** Tarjeta de negocio del home del cliente (toca → productos del negocio). */
export function BusinessCard({ business, onPress }: Props) {
  const colors = useResolvedAppColors();
  const location = [business.address, business.municipality?.name]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      onPress={onPress}
      className="mb-3 flex-row items-center gap-3 rounded-2xl border border-border bg-card p-3.5 active:opacity-80"
    >
      <Avatar
        uri={business.logoUrl}
        fallbackSource={DEFAULT_BUSINESS_LOGO}
        icon="storefront-outline"
        size={64}
        shape="rounded"
      />

      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text
            numberOfLines={1}
            className="shrink text-[15px] font-bold text-ink"
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
            <Ionicons name="location-outline" size={12} color={colors.mutedColor} />
            <Text numberOfLines={1} className="flex-1 text-[11px] text-muted">
              {location}
            </Text>
          </View>
        )}
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.mutedColor} />
    </Pressable>
  );
}
