import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';

import { FormModal } from '@/components/ui/form-modal';
import { TextField } from '@/components/ui/text-field';
import { useFormErrors } from '@/hooks/use-form-errors';
import { DeviceCoords, getDeviceLocation } from '@/lib/location';
import {
  UserAddress,
  UserAddressPayload,
  userAddressesService,
} from '@/services/user-addresses';

type Props = {
  visible: boolean;
  /** Dirección a editar; null = crear. */
  editing: UserAddress | null;
  onClose: () => void;
  /** Se guardó bien: la hoja recarga la lista y cierra este modal. */
  onSaved: () => void;
};

/** Crear/editar una dirección de entrega del usuario (con GPS opcional). */
export function AddressFormModal({ visible, editing, onClose, onSaved }: Props) {
  const [label, setLabel] = useState('');
  const [address, setAddress] = useState('');
  const [details, setDetails] = useState('');
  const [coords, setCoords] = useState<DeviceCoords>();
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const { errors, setErrors, clearError, bind, validate } = useFormErrors();

  const isEdit = !!editing;

  // Prellena (edición) o limpia (creación) cada vez que se abre.
  useEffect(() => {
    if (!visible) return;
    setErrors({});
    setLabel(editing?.label ?? '');
    setAddress(editing?.address ?? '');
    setDetails(editing?.details ?? '');
    setCoords(
      editing?.latitude != null && editing?.longitude != null
        ? { latitude: editing.latitude, longitude: editing.longitude }
        : undefined,
    );
  }, [visible, editing, setErrors]);

  /** GPS: guarda coordenadas y prellena el texto (sigue editable). */
  async function handleUseLocation() {
    setLocating(true);
    try {
      const result = await getDeviceLocation();
      if (result) {
        setCoords(result.coords);
        if (result.address) {
          setAddress(result.address);
          clearError('address');
        }
      }
    } finally {
      setLocating(false);
    }
  }

  async function handleSave() {
    const ok = validate({
      label: label.trim() ? undefined : 'Ponle un nombre (ej: Casa).',
      address: address.trim() ? undefined : 'Ingresa la dirección.',
    });
    if (!ok) return;

    const payload: UserAddressPayload = {
      label: label.trim(),
      address: address.trim(),
      details: details.trim() || null,
      ...(coords ?? {}),
    };

    try {
      setSaving(true);
      if (isEdit) {
        await userAddressesService.update(editing.id, payload);
      } else {
        await userAddressesService.create(payload);
      }
      onSaved();
    } catch {
      // El interceptor HTTP ya mostró el mensaje del backend.
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormModal
      visible={visible}
      title={isEdit ? 'Editar dirección' : 'Nueva dirección'}
      onClose={onClose}
      saveLabel={isEdit ? 'Guardar cambios' : 'Guardar dirección'}
      onSave={handleSave}
      saving={saving}
    >
      <TextField
        label="Nombre de la dirección"
        icon="bookmark-outline"
        format="text"
        value={label}
        onChangeText={bind('label', setLabel)}
        error={errors.label}
        placeholder="Casa, Trabajo, Donde mi mamá…"
      />

      <TextField
        label="Dirección"
        icon="home-outline"
        format="text"
        value={address}
        onChangeText={bind('address', setAddress)}
        error={errors.address}
        placeholder="Calle 1 # 2-3, Barrio Centro"
      />
      <Pressable
        onPress={handleUseLocation}
        disabled={locating}
        className="-mt-2 mb-4 flex-row items-center gap-1.5 self-start"
      >
        {locating ? (
          <ActivityIndicator size="small" color="#FF5A3C" />
        ) : (
          <Ionicons
            name={coords ? 'checkmark-circle' : 'locate-outline'}
            size={16}
            color="#FF5A3C"
          />
        )}
        <Text className="text-[13px] font-bold text-primary">
          {locating
            ? 'Obteniendo ubicación…'
            : coords
              ? 'Ubicación marcada — toca para actualizar'
              : 'Usar mi ubicación actual'}
        </Text>
      </Pressable>

      <TextField
        label="Detalles (opcional)"
        icon="information-circle-outline"
        format="text"
        value={details}
        onChangeText={setDetails}
        placeholder="Torre 2 apto 301, portón café"
      />
    </FormModal>
  );
}
