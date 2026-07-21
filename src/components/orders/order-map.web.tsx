import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';

import {
  DeliveryPosition,
  useDeliveryPosition,
} from '@/lib/orders-socket';
import { Order } from '@/services/orders';

type LatLng = { latitude: number; longitude: number };

type Props = {
  order: Order;
  /** delivery = el repartidor (ve su punto azul); client = ve la moto en vivo. */
  perspective: 'client' | 'delivery';
};

/**
 * Versión WEB del mapa del pedido (`react-native-maps` es módulo nativo y no
 * existe en el navegador — Metro elige este archivo automáticamente al
 * compilar para web). En vez del MapView: tarjeta con enlaces que abren cada
 * punto en Google Maps en otra pestaña. La posición en vivo del repartidor
 * llega por el mismo socket y actualiza su enlace.
 */
export function OrderMap({ order }: Props) {
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
    <View className="mb-5 rounded-2xl bg-white p-4">
      <Text className="mb-3 text-sm font-extrabold text-dark">
        Ubicaciones del pedido
      </Text>
      {business && (
        <MapLink
          icon="storefront"
          color="#1E1E2D"
          label="Negocio (punto de recogida)"
          coords={business}
        />
      )}
      {destination && (
        <MapLink
          icon="home"
          color="#FF5A3C"
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
        Los enlaces abren Google Maps en otra pestaña.
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
        <Text className="text-sm font-bold text-dark">{label}</Text>
        <Text className="text-xs text-primary">Ver en Google Maps</Text>
      </View>
      <Ionicons name="open-outline" size={16} color="#7A7A8A" />
    </Pressable>
  );
}
