import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { AddressMapPicker } from '@/components/client/address-map-picker';
import { FormModal } from '@/components/ui/form-modal';
import { PhotoField } from '@/components/ui/photo-field';
import { TextField } from '@/components/ui/text-field';
import { useFormErrors } from '@/hooks/use-form-errors';
import {
  DeviceCoords,
  getDeviceLocation,
} from '@/lib/location';
import { getAppColors } from '@/lib/app-colors';
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
  // Foto de la fachada (opcional): `photoUri` es la recién elegida (local, aún
  // sin subir); `photoRemoved` marca que se quitó la que ya estaba guardada.
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const { errors, setErrors, clearError, bind, validate } = useFormErrors();

  const isEdit = !!editing;

  // En edición, guardar solo se habilita si algo cambió respecto a lo cargado
  // (evita PATCH inútiles); al crear siempre está habilitado.
  const fieldsDirty =
    label !== (editing?.label ?? '') ||
    address !== (editing?.address ?? '') ||
    details !== (editing?.details ?? '') ||
    (coords?.latitude ?? null) !== (editing?.latitude ?? null) ||
    (coords?.longitude ?? null) !== (editing?.longitude ?? null);
  const photoDirty = !!photoUri || photoRemoved;
  const dirty = !isEdit || fieldsDirty || photoDirty;

  // Prellena (edición) o limpia (creación) cada vez que se abre.
  useEffect(() => {
    if (!visible) return;
    setErrors({});
    setLabel(editing?.label ?? '');
    setAddress(editing?.address ?? '');
    setDetails(editing?.details ?? '');
    setPhotoUri(null);
    setPhotoRemoved(false);
    setCoords(
      editing?.latitude != null && editing?.longitude != null
        ? { latitude: editing.latitude, longitude: editing.longitude }
        : undefined,
    );
  }, [visible, editing, setErrors]);

  /** Mapa: el usuario elige el punto (su GPS o cualquier otro, incluso otra
   * ciudad — p. ej. para mandar un pedido a alguien en Mocoa) y confirma. */
  function handleMapConfirm(result: {
    coords: DeviceCoords;
    address?: string;
  }) {
    setCoords(result.coords);
    clearError('location');
    if (result.address) {
      setAddress(result.address);
      clearError('address');
    }
    setMapVisible(false);
  }

  /**
   * "Usar mi ubicación": pide permiso/GPS del sistema, marca el punto y
   * prellena la dirección con el geocoder. Si el usuario no activa la
   * ubicación, `getDeviceLocation` muestra el toast con la instrucción — el
   * campo queda vacío para que la llene a mano (el aviso lo refuerza).
   */
  async function handleUseMyLocation() {
    setLocating(true);
    try {
      const loc = await getDeviceLocation();
      if (!loc) return; // El toast ya le dijo qué hacer.
      setCoords(loc.coords);
      clearError('location');
      if (loc.address) {
        setAddress(loc.address);
        clearError('address');
      }
    } finally {
      setLocating(false);
    }
  }

  async function handleSave() {
    const ok = validate({
      label: label.trim() ? undefined : 'Ponle un nombre (ej: Casa).',
      address: address.trim() ? undefined : 'Ingresa la dirección.',
      // Sin coordenadas el explorar no puede filtrar por cercanía ni el
      // repartidor ubicar la entrega: la ubicación GPS es obligatoria.
      location: coords
        ? undefined
        : 'Marca la ubicación en el mapa.',
      // El GPS marca el punto pero el texto suele quedar genérico ("Mocoa"):
      // el barrio/casa/referencias los pone el usuario y son obligatorios
      // para que el repartidor encuentre la puerta.
      details: details.trim()
        ? undefined
        : 'Ingresa la dirección específica (barrio, casa, referencias).',
    });
    if (!ok) return;

    const payload: UserAddressPayload = {
      label: label.trim(),
      address: address.trim(),
      details: details.trim(),
      ...(coords ?? {}),
    };

    try {
      setSaving(true);
      let addressId: number;
      if (isEdit) {
        addressId = editing.id;
        // Solo cambió la foto: no hace falta un PATCH de campos.
        if (fieldsDirty) await userAddressesService.update(addressId, payload);
      } else {
        const created = await userAddressesService.create(payload);
        addressId = Number(created.data.rowId);
      }
      // La foto va aparte (multipart): si falla, la dirección ya quedó
      // guardada y el interceptor HTTP avisó — no se pierde lo demás.
      try {
        if (photoUri) {
          await userAddressesService.uploadPhoto(addressId, photoUri);
        } else if (photoRemoved) {
          await userAddressesService.removePhoto(addressId);
        }
      } catch {
        // Ya mostró el error.
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
      saveDisabled={!dirty}
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

      {/* Dirección + botón de GPS: activar ubicación llena el campo solo. */}
      <View className="flex-row items-center gap-1.5">
        <View className="flex-1">
          <TextField
            label="Dirección"
            icon="home-outline"
            format="text"
            value={address}
            onChangeText={bind('address', setAddress)}
            error={errors.address}
            placeholder="Calle 1 # 2-3, Barrio Centro"
          />
        </View>
        <Pressable
          onPress={handleUseMyLocation}
          disabled={locating}
          hitSlop={6}
          className="mb-1.5 h-11 w-11 items-center justify-center rounded-full border border-primary/30 bg-primary-tint active:opacity-70"
        >
          {locating ? (
            <ActivityIndicator size="small" color={getAppColors().primaryColor} />
          ) : (
            <Ionicons
              name="locate"
              size={20}
              color={getAppColors().primaryColor}
              // Mismo padding de fuente extra de Android que corre los
              // glifos dentro de su caja (ver filter-chips.tsx).
              style={{ includeFontPadding: false }}
            />
          )}
        </Pressable>
      </View>
      {!address.trim() && (
        <View className="-mt-1 mb-1 flex-row items-start gap-1.5">
          <Ionicons
            name="bulb-outline"
            size={14}
            color={getAppColors().primaryColor}
          />
          <Text className="flex-1 text-xs text-primary">
            Toca el ícono
            <Text className="font-bold"> ubicación</Text> para llenarla con tu
            GPS, o escríbela a mano por favor (calle, n° y barrio).
          </Text>
        </View>
      )}

      <Pressable
        onPress={() => setMapVisible(true)}
        className="mb-2 flex-row items-center gap-1.5 self-start"
      >
        <Ionicons
          name={coords ? 'checkmark-circle' : 'map-outline'}
          size={16}
          color={getAppColors().primaryColor}
        />
        <Text className="text-[13px] font-bold text-primary">
          {coords
            ? 'Ubicación marcada — toca para cambiarla'
            : 'Marcar ubicación en el mapa (obligatorio)'}
        </Text>
      </Pressable>
      {!!errors.location && (
        <Text className="-mt-1 mb-2 text-xs text-red-600">
          {errors.location}
        </Text>
      )}

      <TextField
        label="Dirección específica"
        icon="information-circle-outline"
        format="text"
        value={details}
        onChangeText={bind('details', setDetails)}
        error={errors.details}
        placeholder="Barrio Centro, casa esquinera, portón café"
      />

      {/* Foto opcional del lugar: el repartidor la ve al entregar el pedido. */}
      <View className="mt-2 items-center">
        <PhotoField
          label="Foto de la fachada o portón (opcional)"
          shape="rounded"
          placeholderIcon="home-outline"
          imageUrl={photoRemoved ? null : editing?.photoUrl}
          pendingUri={photoUri}
          onChange={(uri) => {
            setPhotoUri(uri);
            setPhotoRemoved(false);
          }}
          onRemove={() => {
            setPhotoUri(null);
            setPhotoRemoved(!!editing?.photoUrl);
          }}
        />
        <Text className="-mt-2 mb-2 px-4 text-center text-[11px] text-muted">
          Ayuda al domiciliario a reconocer tu casa. Solo la ve quien lleve tu pedido.
        </Text>
      </View>

      <AddressMapPicker
        visible={mapVisible}
        initialCoords={coords}
        onClose={() => setMapVisible(false)}
        onConfirm={handleMapConfirm}
      />
    </FormModal>
  );
}