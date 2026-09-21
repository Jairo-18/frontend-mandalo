import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';

import { businessDisplayName, ExploreBusiness } from '@/services/explore';
import { DEFAULT_BUSINESS_LOGO } from '@/lib/default-images';

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
      // Sin `flex-1`: altura propia (foto cuadrada + texto fijo). Ver el
      // comentario largo en `ProductGridCard`.
      className="mb-3 overflow-hidden rounded-2xl border border-border bg-card active:opacity-80"
    >
      <View className="w-full bg-surface" style={{ aspectRatio: 1 }}>
        <Image
          source={logo ? { uri: logo } : DEFAULT_BUSINESS_LOGO}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          // Sin esto, al reciclar la celda se ve por un frame el logo anterior.
          recyclingKey={String(business.id)}
          cachePolicy="memory-disk"
          transition={150}
        />
        {business.isOpen === false && (
          <View className="absolute left-2 top-2 rounded-full bg-dark px-2 py-0.5">
            <Text className="text-[10px] font-bold text-white">Cerrado</Text>
          </View>
        )}
      </View>

      {/* Alto FIJO (no mínimo), igual que en `ProductGridCard`: la fila de
          etiquetas es opcional, así que sin fijarlo los negocios sin etiquetas
          quedaban más bajos que los demás. 10 padding + 36 nombre + 4 + 17
          etiquetas + 10 padding = 77, con 3px de holgura. */}
      <View className="h-[80px] p-2.5">
        <Text numberOfLines={2} className="h-[36px] text-[13px] font-bold text-ink">
          {businessDisplayName(business)}
        </Text>
        {/* Siempre montada aunque no haya etiquetas: es lo que mantiene el alto
            parejo. Sin `flex-wrap` y con `overflow-hidden` para que dos
            etiquetas largas se recorten en vez de saltar a una segunda fila. */}
        <View className="mt-1 h-[17px] flex-row gap-1 overflow-hidden">
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
      </View>
    </Pressable>
  );
}
