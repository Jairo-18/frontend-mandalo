import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { getAppColors } from '@/lib/app-colors';
import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';
import {
  DeviceCoords,
  getDeviceCoordsSilently,
  reverseGeocodeCoords,
} from '@/lib/location';

type Props = {
  visible: boolean;
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
 * Versión WEB del selector de dirección (`react-native-maps` es módulo nativo
 * y no existe en el navegador — Metro elige este archivo automáticamente al
 * compilar para web, mismo patrón que `order-map.web.tsx`). Sin mapa
 * arrastrable: usa la geolocalización del navegador (mismo `getDeviceCoordsSilently`
 * que ya tolera web) y deja que el usuario confirme esa ubicación o cierre el
 * selector y escriba la dirección a mano en el campo de texto del formulario
 * (que sigue disponible detrás de este modal).
 */
export function AddressMapPicker({ visible, initialCoords, onClose, onConfirm }: Props) {
  const colors = useResolvedAppColors();
  const insets = useSafeAreaInsets();
  const [coords, setCoords] = useState<DeviceCoords | null>(initialCoords ?? null);
  const [address, setAddress] = useState<string | undefined>();
  const [city, setCity] = useState<string | undefined>();
  const [region, setRegion] = useState<string | undefined>();
  const [locating, setLocating] = useState(false);
  const resolveSeq = useRef(0);

  async function locate() {
    setLocating(true);
    setAddress(undefined);
    setCity(undefined);
    setRegion(undefined);
    const seq = ++resolveSeq.current;
    try {
      const gps = await getDeviceCoordsSilently();
      if (!gps || seq !== resolveSeq.current) return;
      setCoords(gps);
      const result = await reverseGeocodeCoords(gps);
      if (seq !== resolveSeq.current) return;
      setAddress(result.address);
      setCity(result.city);
      setRegion(result.region);
    } finally {
      if (seq === resolveSeq.current) setLocating(false);
    }
  }

  // Al abrir: si ya había coords (dirección en edición) las usa tal cual; si
  // no, intenta ubicar con el GPS del navegador de una vez.
  useEffect(() => {
    if (!visible) return;
    if (initialCoords) {
      setCoords(initialCoords);
    } else {
      void locate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View className="flex-1 bg-card">
        <View
          className="flex-row items-center justify-between px-5 pb-3"
          style={{ paddingTop: insets.top + 12 }}
        >
          <Pressable
            onPress={onClose}
            hitSlop={10}
            className="h-10 w-10 items-center justify-center rounded-full bg-surface"
          >
            <Ionicons name="close" size={22} color={colors.inkColor} />
          </Pressable>
          <Text className="text-[15px] font-extrabold text-ink">Ubicación</Text>
          <View className="h-10 w-10" />
        </View>

        <View className="flex-1 items-center justify-center px-8">
          <View className="mb-4 h-16 w-16 items-center justify-center">
            <Ionicons name="location" size={36} color={colors.primaryColor} />
          </View>
          <Text className="mb-2 text-center text-[15px] font-bold text-ink">
            La versión web no tiene mapa interactivo
          </Text>
          <Text className="mb-5 text-center text-[13px] leading-5 text-muted">
            Usa tu ubicación actual del navegador, o cierra esta ventana y
            escribe la dirección directamente en el formulario.
          </Text>

          <View className="w-full min-h-[44px] flex-row items-center justify-center gap-2 rounded-xl bg-surface px-4 py-3">
            {locating ? (
              <>
                <ActivityIndicator size="small" color={colors.primaryColor} />
                <Text className="text-sm text-muted">Buscando tu ubicación…</Text>
              </>
            ) : (
              <Text className="flex-1 text-center text-[14px] font-semibold text-ink">
                {address ?? city ?? 'Sin ubicación todavía'}
              </Text>
            )}
          </View>
        </View>

        <View
          className="px-5 pt-4"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          <Pressable
            onPress={locate}
            disabled={locating}
            className="mb-3 h-12 flex-row items-center justify-center gap-2 rounded-xl border border-primary active:opacity-70"
          >
            <Ionicons name="locate" size={18} color={colors.primaryColor} />
            <Text className="text-[14px] font-bold text-primary">
              Usar mi ubicación actual
            </Text>
          </Pressable>
          <Button
            label="Confirmar esta ubicación"
            disabled={locating || !coords}
            onPress={() =>
              coords && onConfirm({ coords, address, city, region })
            }
          />
        </View>
      </View>
    </Modal>
  );
}
