import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';

import {
  DeliveryPosition,
  useDeliveryPosition,
} from '@/lib/orders-socket';
import { Order } from '@/services/orders';
import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';

type LatLng = { latitude: number; longitude: number };

type Props = {
  order: Order;
  /** Por qué no hay mapa acá — solo cambia el texto del pie. */
  reason: 'web' | 'no-google-services';
};

/**
 * Mapa del pedido SIN MapView: tarjeta con un enlace por punto (negocio,
 * destino y la moto en vivo) que abre esa coordenada en Google Maps. La
 * posición del repartidor llega por el mismo socket que alimenta al mapa
 * real, así que el enlace se actualiza solo.
 *
 * Lo usan las dos plataformas donde `react-native-maps` con proveedor de
 * Google no sirve: **web** (`order-map.web.tsx`) y **Android sin GMS**
 * (`order-map.tsx`, ver `lib/google-services.ts`). En un equipo sin GMS no
 * hay app de Google Maps instalada, pero el enlace `https` abre igual en el
 * navegador — por eso el enlace es web y no un intent `geo:`.
 */
export function OrderMapFallback({ order, reason }: Props) {
  const colors = useResolvedAppColors();
  const business: LatLng | null =
    order.organizational?.latitude != null &&
    order.organizational?.longitude != null
      ? {
          latitude: order.organizational.latitude,
          longitude: order.organizational.longitude,
        }
      : null;
  const destination: LatLng | null =
    order.deliveryLatitude != null && order.deliveryLongitude != null
      ? {
          latitude: order.deliveryLatitude,
          longitude: order.deliveryLongitude,
        }
      : null;

  // Moto del repartidor en vivo (solo llega si el pedido va EN RUTA).
  const [courier, setCourier] = useState<LatLng | null>(null);
  useDeliveryPosition(
    useCallback(
      (position: DeliveryPosition) => {
        if (position.invoiceId !== order.id) return;
        setCourier({
          latitude: position.latitude,
          longitude: position.longitude,
        });
      },
      [order.id],
    ),
  );

  if (!business && !destination) return null;

  return (
    <View className="mb-5 rounded-2xl bg-card p-4">
      <Text className="mb-3 text-sm font-extrabold text-ink">
        Ubicaciones del pedido
      </Text>
      {business && (
        <MapLink
          icon="storefront"
          color={colors.darkColor}
          label="Negocio (punto de recogida)"
          coords={business}
        />
      )}
      {destination && (
        <MapLink
          icon="home"
          color={colors.primaryColor}
          label="Dirección de entrega"
          coords={destination}
        />
      )}
      {courier && (
        <MapLink
          icon="bicycle"
          color="#22C55E"
          label="Domiciliario (posición en vivo)"
          coords={courier}
        />
      )}
      <Text className="mt-2 text-xs text-muted">
        {reason === 'web'
          ? 'Los enlaces abren Google Maps en otra pestaña.'
          : 'Este teléfono no tiene los servicios de Google que usa el mapa; los enlaces abren cada punto en el navegador.'}
      </Text>
    </View>
  );
}

/** Fila con icono de marca + enlace "Ver en Google Maps" del punto. */
function MapLink({
  icon,
  color,
  label,
  coords,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
  coords: LatLng;
}) {
  const colors = useResolvedAppColors();
  const url = `https://www.google.com/maps/search/?api=1&query=${coords.latitude},${coords.longitude}`;
  return (
    <Pressable
      className="mb-2 flex-row items-center rounded-xl bg-surface px-3 py-2.5 active:opacity-70"
      onPress={() => Linking.openURL(url)}
    >
      <View
        className="mr-3 h-8 w-8 items-center justify-center rounded-full"
        style={{ backgroundColor: color }}
      >
        <Ionicons name={icon} size={15} color="#FFFFFF" />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-bold text-ink">{label}</Text>
        <Text className="text-xs text-primary">Ver en Google Maps</Text>
      </View>
      <Ionicons name="open-outline" size={16} color={colors.mutedColor} />
    </Pressable>
  );
}
