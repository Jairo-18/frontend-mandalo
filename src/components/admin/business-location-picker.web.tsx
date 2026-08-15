import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddressSearchModal } from '@/components/admin/address-search-modal';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { GOOGLE_MAPS_WEB_KEY } from '@/constants/api';
import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';
import { loadGoogleMapsWeb } from '@/lib/google-maps-web-loader';
import { DeviceCoords, getDeviceCoordsSilently } from '@/lib/location';
import { extractCoordsFromMapsUrl } from '@/lib/maps-url';
import { mapsService } from '@/services/maps';

const DEFAULT_CENTER: DeviceCoords = { latitude: 1.0865, longitude: -76.6325 };

export type BusinessLocationResult = { coords: DeviceCoords; label?: string };

type Props = {
  visible: boolean;
  initialCoords?: DeviceCoords | null;
  onClose: () => void;
  onConfirm: (result: BusinessLocationResult) => void;
};

/**
 * Versión WEB del selector de ubicación de negocios (admin): mapa real con
 * Google Maps JavaScript API (marker arrastrable) — a diferencia de
 * `address-map-picker.web.tsx` (cliente, sin mapa interactivo) acá SÍ hace
 * falta uno real: el admin normalmente registra negocios sin estar
 * físicamente ahí, así que el buscador (Nominatim) + el link pegado son las
 * vías principales, y el mapa sirve para AJUSTAR el punto exacto.
 *
 * Sin `GOOGLE_MAPS_WEB_KEY` configurada (ver `.env.local`), el mapa se
 * reemplaza por un aviso — buscador y link pegado siguen funcionando igual,
 * nunca bloquea poder guardar una ubicación.
 */
export function BusinessLocationPicker({
  visible,
  initialCoords,
  onClose,
  onConfirm,
}: Props) {
  const colors = useResolvedAppColors();
  const insets = useSafeAreaInsets();
  const mapContainerRef = useRef<View>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);

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
  const [mapState, setMapState] = useState<'loading' | 'ready' | 'error'>(
    GOOGLE_MAPS_WEB_KEY ? 'loading' : 'error',
  );
  const resolveSeq = useRef(0);

  const resolve = useCallback(async (coords: DeviceCoords) => {
    const seq = ++resolveSeq.current;
    setResolving(true);
    try {
      const res = await mapsService.reverseGeocode(coords.latitude, coords.longitude);
      if (seq !== resolveSeq.current) return;
      setLabel(res.data.label ?? undefined);
    } catch {
      if (seq === resolveSeq.current) setLabel(undefined);
    } finally {
      if (seq === resolveSeq.current) setResolving(false);
    }
  }, []);

  const moveTo = useCallback(
    (coords: DeviceCoords) => {
      setCenter(coords);
      const point = { lat: coords.latitude, lng: coords.longitude };
      mapInstanceRef.current?.panTo(point);
      markerInstanceRef.current?.setPosition(point);
      void resolve(coords);
    },
    [resolve],
  );

  // Carga el mapa (una sola vez por apertura del modal) y engancha el drag.
  // Sin ubicación previa (negocio nuevo): arranca en el centro fijo de
  // Putumayo y, si el GPS silencioso llega ANTES de que el mapa termine de
  // cargar, `startRef` ya tiene el punto correcto para crearlo ahí mismo; si
  // llega DESPUÉS, `moveTo` re-centra el mapa ya creado (mismo patrón que la
  // versión nativa, `business-location-picker.tsx`).
  useEffect(() => {
    if (!visible || !GOOGLE_MAPS_WEB_KEY) return;
    let cancelled = false;
    const startRef = { current: initialCoords ?? DEFAULT_CENTER };
    setCenter(startRef.current);
    setMapsUrl('');
    setLinkError(undefined);
    setShowLinkInput(false);
    void resolve(startRef.current);

    if (!initialCoords) {
      getDeviceCoordsSilently().then((coords) => {
        if (cancelled || !coords) return;
        startRef.current = coords;
        moveTo(coords);
      });
    }

    loadGoogleMapsWeb(GOOGLE_MAPS_WEB_KEY)
      .then((google) => {
        if (cancelled) return;
        const container = mapContainerRef.current as unknown as HTMLElement | null;
        if (!container) return;
        const point = { lat: startRef.current.latitude, lng: startRef.current.longitude };

        if (!mapInstanceRef.current) {
          mapInstanceRef.current = new google.maps.Map(container, {
            center: point,
            zoom: 16,
            mapTypeId: 'hybrid',
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          });
          markerInstanceRef.current = new google.maps.Marker({
            position: point,
            map: mapInstanceRef.current,
            draggable: true,
          });
          markerInstanceRef.current.addListener('dragend', () => {
            const pos = markerInstanceRef.current.getPosition();
            if (!pos) return;
            const coords = { latitude: pos.lat(), longitude: pos.lng() };
            setCenter(coords);
            void resolve(coords);
          });
        } else {
          mapInstanceRef.current.panTo(point);
          markerInstanceRef.current.setPosition(point);
        }
        setMapState('ready');
      })
      .catch(() => {
        if (!cancelled) setMapState('error');
      });

    return () => {
      cancelled = true;
    };
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

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View className="flex-1 bg-card">
        {mapState === 'ready' ? (
          <View ref={mapContainerRef} style={{ flex: 1 }} />
        ) : mapState === 'loading' ? (
          <View className="flex-1 items-center justify-center bg-surface">
            <ActivityIndicator size="large" color={colors.primaryColor} />
          </View>
        ) : (
          <View className="flex-1 items-center justify-center bg-surface px-10">
            <Ionicons name="map-outline" size={36} color={colors.mutedColor} />
            <Text className="mb-1 mt-3 text-center text-[15px] font-bold text-ink">
              El mapa no está disponible
            </Text>
            <Text className="text-center text-[13px] leading-5 text-muted">
              Busca la dirección o pega el link de Google Maps del negocio —
              igual queda guardada la ubicación exacta.
            </Text>
          </View>
        )}

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
                {label ?? 'Busca o pega un link para elegir el punto'}
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
