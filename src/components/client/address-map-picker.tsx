import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, Text, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { useAppTheme } from '@/context/app-theme';
import { getAppColors } from '@/lib/app-colors';
import {
  DeviceCoords,
  getDeviceCoordsSilently,
  reverseGeocodeCoords,
} from '@/lib/location';

/** Centro del área de operación (Putumayo) si no hay GPS ni dirección previa. */
const DEFAULT_CENTER: DeviceCoords = { latitude: 1.0865, longitude: -76.6325 };

const DELTA = 0.01;

type Props = {
  visible: boolean;
  /** Punto de partida del pin (dirección en edición, o última posición conocida). */
  initialCoords?: DeviceCoords;
  onClose: () => void;
  onConfirm: (result: {
    coords: DeviceCoords;
    address?: string;
    city?: string;
    region?: string;
  }) => void;
};

/**
 * Elegir la ubicación de una dirección en un mapa real (en vez de solo el GPS
 * actual): el pin queda FIJO al centro de la pantalla y el usuario mueve el
 * mapa por debajo (patrón Uber/Rappi) — así puede pellizcar/hacer zoom y
 * arrastrar hasta OTRO municipio (p. ej. marcar una dirección en Mocoa estando
 * en Villagarzón, para mandar un pedido/regalo allá). Reverse-geocoding con
 * el mismo geocoder nativo que ya usa "Usar mi ubicación actual" — sin API
 * keys ni costo extra de Google Places.
 */
export function AddressMapPicker({ visible, initialCoords, onClose, onConfirm }: Props) {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const mapRef = useRef<MapView>(null);

  const [center, setCenter] = useState<DeviceCoords>(initialCoords ?? DEFAULT_CENTER);
  const [address, setAddress] = useState<string | undefined>();
  const [city, setCity] = useState<string | undefined>();
  const [region, setRegion] = useState<string | undefined>();
  const [resolving, setResolving] = useState(false);
  const [locating, setLocating] = useState(false);
  const resolveSeq = useRef(0);

  const resolve = useCallback(async (coords: DeviceCoords) => {
    const seq = ++resolveSeq.current;
    setResolving(true);
    const result = await reverseGeocodeCoords(coords);
    // Descarta si el usuario ya movió el mapa de nuevo mientras resolvía.
    if (seq !== resolveSeq.current) return;
    setAddress(result.address);
    setCity(result.city);
    setRegion(result.region);
    setResolving(false);
  }, []);

  // Al abrir: arranca desde la dirección en edición (si la hay) y resuelve el
  // texto una vez. El MapView sigue montado entre aperturas (mismo patrón que
  // el resto de modales de la app), así que hay que re-centrarlo a mano —
  // `initialRegion` solo aplica en el montaje inicial, no en reaperturas con
  // otras coords (p. ej. crear una dirección después de editar otra).
  useEffect(() => {
    if (!visible) return;
    const start = initialCoords ?? DEFAULT_CENTER;
    setCenter(start);
    mapRef.current?.animateToRegion(
      { ...start, latitudeDelta: DELTA, longitudeDelta: DELTA },
      0,
    );
    void resolve(start);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  async function handleUseMyLocation() {
    setLocating(true);
    try {
      const coords = await getDeviceCoordsSilently();
      if (!coords) return;
      mapRef.current?.animateToRegion(
        { ...coords, latitudeDelta: DELTA, longitudeDelta: DELTA },
        400,
      );
      setCenter(coords);
      void resolve(coords);
    } finally {
      setLocating(false);
    }
  }

  function handleRegionChangeComplete(next: Region) {
    const coords = { latitude: next.latitude, longitude: next.longitude };
    setCenter(coords);
    void resolve(coords);
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View className="flex-1 bg-card">
        <MapView
          ref={mapRef}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          style={{ flex: 1 }}
          initialRegion={{ ...center, latitudeDelta: DELTA, longitudeDelta: DELTA }}
          onRegionChangeComplete={handleRegionChangeComplete}
          userInterfaceStyle={isDark ? 'dark' : 'light'}
        />

        {/* Pin fijo al centro: el mapa se mueve por debajo, el pin siempre
            marca el punto exacto (evita el desfase de arrastrar un Marker). */}
        <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
          <View className="-mt-8 items-center">
            <View
              className="h-11 w-11 items-center justify-center rounded-full border-2 border-white"
              style={{ backgroundColor: getAppColors().primaryColor, elevation: 4 }}
            >
              <Ionicons name="location" size={22} color="#FFFFFF" />
            </View>
            <View
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: getAppColors().darkColor, marginTop: -2 }}
            />
          </View>
        </View>

        {/* Cabecera */}
        <View
          className="absolute left-0 right-0 top-0 flex-row items-center justify-between px-5 pb-3"
          style={{ paddingTop: insets.top + 12 }}
        >
          <Pressable
            onPress={onClose}
            hitSlop={10}
            className="h-10 w-10 items-center justify-center rounded-full bg-card shadow-md"
          >
            <Ionicons name="close" size={22} color={getAppColors().inkColor} />
          </Pressable>
          <Pressable
            onPress={handleUseMyLocation}
            disabled={locating}
            className="h-10 w-10 items-center justify-center rounded-full bg-card shadow-md"
          >
            {locating ? (
              <ActivityIndicator size="small" color={getAppColors().primaryColor} />
            ) : (
              <Ionicons name="locate" size={20} color={getAppColors().primaryColor} />
            )}
          </Pressable>
        </View>

        {/* Tarjeta inferior: dirección resuelta + confirmar */}
        <View
          className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-card px-5 pt-4 shadow-lg"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          <Text className="mb-1 text-xs font-bold uppercase text-muted">
            Ubicación seleccionada
          </Text>
          <View className="mb-4 min-h-[44px] flex-row items-center gap-2">
            {resolving ? (
              <>
                <ActivityIndicator size="small" color={getAppColors().primaryColor} />
                <Text className="text-sm text-muted">Buscando dirección…</Text>
              </>
            ) : (
              <Text className="flex-1 text-[15px] font-semibold text-ink">
                {address ?? city ?? 'Mueve el mapa para elegir el punto'}
              </Text>
            )}
          </View>
          <Button
            label="Confirmar esta ubicación"
            disabled={resolving}
            onPress={() => onConfirm({ coords: center, address, city, region })}
          />
        </View>
      </View>
    </Modal>
  );
}
