import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

import {
  DeliveryPosition,
  useDeliveryPosition,
} from '@/lib/orders-socket';
import { useSharedTick } from '@/hooks/use-shared-tick';
import { Order } from '@/services/orders';
import { getAppColors } from '@/lib/app-colors';
import { OrderMapFallback } from '@/components/orders/order-map-fallback';
import { useGoogleServices } from '@/hooks/use-google-services';

/** Sin una posición nueva en más de esto, se avisa que puede haber perdido señal. */
const STALE_MS = 45_000;

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
  const googleServices = useGoogleServices();
  // Sin Google Mobile Services (Huawei de la AppGallery) el MapView con
  // PROVIDER_GOOGLE pinta un recuadro gris: se cae a la misma tarjeta de
  // enlaces que usa la web. Ver `lib/google-services.ts`.
  if (!googleServices) {
    return <OrderMapFallback order={order} reason="no-google-services" />;
  }
  return <OrderMapView order={order} perspective={perspective} />;
}

/** El mapa real con MapView (solo donde hay mapa de Google disponible). */
function OrderMapView({ order, perspective }: Props) {
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
  // Cuándo llegó el último reporte de posición — si pasa mucho sin uno
  // nuevo, lo más probable es que el repartidor se quedó sin señal (no que
  // esté literalmente inmóvil), y el punto en el mapa lo disimula.
  const [courierUpdatedAt, setCourierUpdatedAt] = useState<number | null>(null);
  useDeliveryPosition(
    useCallback(
      (position: DeliveryPosition) => {
        if (position.invoiceId !== order.id) return;
        setCourier({
          latitude: position.latitude,
          longitude: position.longitude,
        });
        setCourierUpdatedAt(Date.now());
      },
      [order.id],
    ),
  );
  const now = useSharedTick();
  const courierStale =
    isOnRoute &&
    !!courier &&
    courierUpdatedAt != null &&
    now - courierUpdatedAt > STALE_MS;

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
            opacity={courierStale ? 0.5 : 1}
          >
            <PinBubble icon="bicycle" color={courierStale ? '#9CA3AF' : '#22C55E'} />
          </Marker>
        )}
      </MapView>

      {/* Sin reporte de posición hace rato: probablemente perdió señal, no
          que esté literalmente detenido — se avisa en vez de dejar el punto
          congelado sin explicación. */}
      {courierStale && (
        <View
          pointerEvents="none"
          className="absolute bottom-3 left-3 right-3 flex-row items-center justify-center gap-1.5 rounded-xl bg-dark/85 px-3 py-2"
        >
          <Ionicons name="cloud-offline-outline" size={14} color="#FFFFFF" />
          <Text className="text-[12px] font-semibold text-white">
            Sin señal reciente del domiciliario
          </Text>
        </View>
      )}
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
