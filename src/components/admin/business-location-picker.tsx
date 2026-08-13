import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddressSearchModal } from '@/components/admin/address-search-modal';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useAppTheme } from '@/context/app-theme';
import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';
import {
  DeviceCoords,
  getDeviceCoordsSilently,
  reverseGeocodeCoords,
} from '@/lib/location';
import { extractCoordsFromMapsUrl } from '@/lib/maps-url';

/** Centro del área de operación (Putumayo) si no hay ubicación previa. */
const DEFAULT_CENTER: DeviceCoords = { latitude: 1.0865, longitude: -76.6325 };

const DELTA = 0.01;

export type BusinessLocationResult = { coords: DeviceCoords; label?: string };

type Props = {
  visible: boolean;
  /** Ubicación ya asignada al negocio (edición) o null (crear). */
  initialCoords?: DeviceCoords | null;
  onClose: () => void;
  onConfirm: (result: BusinessLocationResult) => void;
};

/**
 * Selector de ubicación del negocio (admin): mapa real con pin fijo al
 * centro (patrón Uber/Rappi, igual que `AddressMapPicker` del cliente) +
 * buscador de direcciones (Nominatim, `AddressSearchModal`) + pegar un link
 * de Google Maps como vía adicional (`extractCoordsFromMapsUrl`, ya
 * resuelve los links "Compartir" acortados del lado del backend). El admin
 * casi nunca está físicamente en el negocio que está registrando, así que
 * a diferencia de `AddressMapPicker` acá el peso principal es buscar/pegar
 * un link, y el mapa sirve para AJUSTAR el punto exacto.
 */
export function BusinessLocationPicker({
  visible,
  initialCoords,
  onClose,
  onConfirm,
}: Props) {
  const colors = useResolvedAppColors();
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const mapRef = useRef<MapView>(null);

  const [center, setCenter] = useState<DeviceCoords>(
    initialCoords ?? DEFAULT_CENTER,
  );
  const [label, setLabel] = useState<string | undefined>();
  const [resolving, setResolving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [mapsUrl, setMapsUrl] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [linkError, setLinkError] = useState<string | undefined>();
  const resolveSeq = useRef(0);

  const resolve = useCallback(async (coords: DeviceCoords) => {
    const seq = ++resolveSeq.current;
    setResolving(true);
    const result = await reverseGeocodeCoords(coords);
    if (seq !== resolveSeq.current) return;
    setLabel(result.address ?? result.city);
    setResolving(false);
  }, []);

  const moveTo = useCallback(
    (coords: DeviceCoords) => {
      mapRef.current?.animateToRegion(
        { ...coords, latitudeDelta: DELTA, longitudeDelta: DELTA },
        400,
      );
      setCenter(coords);
      void resolve(coords);
    },
    [resolve],
  );

  // Al abrir: arranca desde la ubicación en edición (si la hay).
  useEffect(() => {
    if (!visible) return;
    const start = initialCoords ?? DEFAULT_CENTER;
    setCenter(start);
    setMapsUrl('');
    setLinkError(undefined);
    setShowLinkInput(false);
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
      if (coords) moveTo(coords);
    } finally {
      setLocating(false);
    }
  }

  async function handleExtractLink() {
    if (!mapsUrl.trim() || extracting) return;
    setExtracting(true);
    setLinkError(undefined);
    try {
      const result = await extractCoordsFromMapsUrl(mapsUrl);
      if (result) {
        moveTo(result);
        setShowLinkInput(false);
      } else {
        setLinkError(
          'No pudimos leer la ubicación de ese link. Prueba buscando la dirección o ajusta el pin en el mapa.',
        );
      }
    } finally {
      setExtracting(false);
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
          mapType="hybrid"
          style={{ flex: 1 }}
          initialRegion={{ ...center, latitudeDelta: DELTA, longitudeDelta: DELTA }}
          onRegionChangeComplete={handleRegionChangeComplete}
          userInterfaceStyle={isDark ? 'dark' : 'light'}
        />

        {/* Pin fijo al centro: el mapa se mueve por debajo. */}
        <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
          <View className="-mt-8 items-center">
            <View
              className="h-11 w-11 items-center justify-center rounded-full border-2 border-white"
              style={{ backgroundColor: colors.primaryColor, elevation: 4 }}
            >
              <Ionicons name="storefront" size={20} color="#FFFFFF" />
            </View>
            <View
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: colors.darkColor, marginTop: -2 }}
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
            <Ionicons name="close" size={22} color={colors.inkColor} />
          </Pressable>
          <View className="flex-row gap-2.5">
            <Pressable
              onPress={handleUseMyLocation}
              disabled={locating}
              className="h-10 w-10 items-center justify-center rounded-full bg-card shadow-md"
            >
              {locating ? (
                <ActivityIndicator size="small" color={colors.primaryColor} />
              ) : (
                <Ionicons name="locate" size={20} color={colors.primaryColor} />
              )}
            </Pressable>
            <Pressable
              onPress={() => setShowLinkInput((v) => !v)}
              className="h-10 w-10 items-center justify-center rounded-full bg-card shadow-md"
            >
              <Ionicons name="link" size={19} color={colors.primaryColor} />
            </Pressable>
            <Pressable
              onPress={() => setSearchVisible(true)}
              className="h-10 w-10 items-center justify-center rounded-full bg-card shadow-md"
            >
              <Ionicons name="search" size={19} color={colors.primaryColor} />
            </Pressable>
          </View>
        </View>

        {/* Pegar link de Google Maps: vía adicional, colapsada por defecto. */}
        {showLinkInput && (
          <View
            className="absolute left-4 right-4 rounded-2xl bg-card px-4 pt-3 shadow-lg"
            style={{ top: insets.top + 64 }}
          >
            <TextField
              label="Link de Google Maps (opcional)"
              icon="link-outline"
              value={mapsUrl}
              onChangeText={(text) => {
                setMapsUrl(text);
                setLinkError(undefined);
              }}
              error={linkError}
              placeholder="https://maps.app.goo.gl/…"
              autoCapitalize="none"
            />
            <Button
              label="Extraer ubicación del link"
              onPress={handleExtractLink}
              disabled={!mapsUrl.trim()}
              loading={extracting}
              variant="outline"
            />
            <View className="h-3" />
          </View>
        )}

        {/* Tarjeta inferior: dirección resuelta + confirmar */}
        <View
          className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-card px-5 pt-4 shadow-lg"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          <Text className="mb-1 text-xs font-bold uppercase text-muted">
            Ubicación del negocio
          </Text>
          <View className="mb-4 min-h-[44px] flex-row items-center gap-2">
            {resolving ? (
              <>
                <ActivityIndicator size="small" color={colors.primaryColor} />
                <Text className="text-sm text-muted">Buscando dirección…</Text>
              </>
            ) : (
              <Text className="flex-1 text-[15px] font-semibold text-ink">
                {label ?? 'Busca, pega un link o mueve el mapa para elegir el punto'}
              </Text>
            )}
          </View>
          <Button
            label="Confirmar esta ubicación"
            disabled={resolving}
            onPress={() => onConfirm({ coords: center, label })}
          />
        </View>
      </View>

      <AddressSearchModal
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
        onSelect={(result) => {
          moveTo({ latitude: result.latitude, longitude: result.longitude });
          setSearchVisible(false);
        }}
      />
    </Modal>
  );
}
