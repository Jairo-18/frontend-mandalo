import {
  AddressMapPickerFallback,
  AddressPickerResult,
} from '@/components/client/address-map-picker-fallback';
import { DeviceCoords } from '@/lib/location';

type Props = {
  visible: boolean;
  initialCoords?: DeviceCoords;
  onClose: () => void;
  onConfirm: (result: AddressPickerResult) => void;
};

/**
 * Versión WEB del selector de dirección (`react-native-maps` es módulo nativo
 * y no existe en el navegador — Metro elige este archivo automáticamente al
 * compilar para web, mismo patrón que `order-map.web.tsx`). La pantalla sin
 * mapa vive en `address-map-picker-fallback.tsx`, compartida con el caso de
 * Android sin Google Mobile Services (Huawei).
 */
export function AddressMapPicker(props: Props) {
  return <AddressMapPickerFallback {...props} reason="web" />;
}
