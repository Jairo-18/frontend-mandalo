import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

import {
  DeliveryPosition,
  useDeliveryPosition,
} from '@/lib/orders-socket';
import { Order } from '@/services/orders';
import { getAppColors } from '@/lib/app-colors';

type LatLng = { latitude: number; longitude: number };

type Props = {
  order: Order;
  /** delivery = el repartidor (ve su punto azul); client = ve la moto en vivo. */
  perspective: 'client' | 'delivery';
};

/** Región que encierra todos los puntos con margen (~60 % extra). */
function regionFor(points: LatLng[]) {
  const lats = points.map((p) => p.latitude);
  const lngs = points.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.6, 0.012),
    longitudeDelta: Math.max((maxLng - minLng) * 1.6, 0.012),
  };
}

/**
 * Mapa en vivo del pedido: pin del negocio (recogida), pin de la dirección
 * de entrega y — desde que el repartidor TOMA el pedido (PREP, camino al
 * negocio) hasta que lo entrega (RUTA) — la moto moviéndose (evento
 * `delivery:position` del socket, ver `delivery-tracker.ts`). El repartidor
 * además ve su propio punto azul para orientarse. Si el pedido no tiene
 * coordenadas no pinta nada.
 *
 * Líneas de ruta, cada una solo cuando hay datos reales para trazarla:
 * - Negocio → destino (línea de referencia recta, siempre que haya ambos
 *   puntos): "hacia dónde va el pedido en general".
 * - Repartidor → negocio (mientras está EN PREPARACIÓN, camino a recoger) o
 *   Repartidor → destino (mientras está EN RUTA, camino a entregar): el
 *   tramo que falta EN VIVO, solo con la moto ya reportando posición — más
 *   útil que la de arriba porque se actualiza con el avance real.
 * Son líneas rectas (sin Directions API/costo extra) — no siguen calles.
 */
export function OrderMap({ order, perspective }: Props) {
  const mapRef = useRef<MapView>(null);
  const isOnRoute = order.stateType?.code === 'RUTA';

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

  const points = [business, destination, courier].filter(
    (p): p is LatLng => p != null,
  );

  // Re-encuadra suave cuando entra/avanza la moto.
  const pointsKey = points.map((p) => `${p.latitude},${p.longitude}`).join('|');
  useEffect(() => {
    if (points.length > 1) {
      mapRef.current?.animateToRegion(regionFor(points), 600);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointsKey]);

  if (points.length === 0) return null;

  return (
    <View className="mb-5 overflow-hidden rounded-2xl">
      <MapView
        ref={mapRef}
        // Android exige el provider de Google (key en app.json). En iPhone se
        // usa Apple Maps (sin key, funciona de una); si algún día se quieren
        // tiles de Google en iOS: llenar ios.config.googleMapsApiKey y poner
        // PROVIDER_GOOGLE también acá.
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        // Satélite real (foto), mismo motivo que en el picker de dirección.
        mapType="hybrid"
        style={{ height: 320, width: '100%' }}
        initialRegion={regionFor(points)}
        showsUserLocation={perspective === 'delivery'}
        showsMyLocationButton={perspective === 'delivery'}
        toolbarEnabled={false}
      >
        {business && destination && (
          <Polyline
            coordinates={[business, destination]}
            strokeColor={`${getAppColors().mutedColor}80`}
            strokeWidth={2}
            lineDashPattern={[8, 6]}
          />
        )}
        {isOnRoute && courier && destination && (
          <Polyline
            coordinates={[courier, destination]}
            strokeColor={getAppColors().primaryColor}
            strokeWidth={3}
          />
        )}
        {!isOnRoute && courier && business && (
          <Polyline
            coordinates={[courier, business]}
            strokeColor={getAppColors().primaryColor}
            strokeWidth={3}
          />
        )}
        {business && (
          <Marker
            coordinate={business}
            title="Negocio"
            description="Punto de recogida"
          >
            <PinBubble icon="storefront" color={getAppColors().darkColor} />
          </Marker>
        )}
        {destination && (
          <Marker
            coordinate={destination}
            title="Entrega"
            description={order.deliveryAddress}
          >
            <PinBubble icon="home" color={getAppColors().primaryColor} />
          </Marker>
        )}
        {courier && (
          <Marker
            coordinate={courier}
            title="Domiciliario"
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <PinBubble icon="bicycle" color="#22C55E" />
          </Marker>
        )}
      </MapView>
    </View>
  );
}

/** Pin circular de marca (icono blanco sobre color) con puntita. */
function PinBubble({
  icon,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}) {
  return (
    <View className="items-center">
      <View
        className="h-9 w-9 items-center justify-center rounded-full border-2 border-white"
        style={{ backgroundColor: color, elevation: 4 }}
      >
        <Ionicons name={icon} size={17} color="#FFFFFF" />
      </View>
    </View>
  );
}
