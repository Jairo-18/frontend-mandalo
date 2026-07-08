import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddressFormModal } from '@/components/client/address-form-modal';
import { YesNoDialog } from '@/components/ui/yes-no-dialog';
import { UserAddress, userAddressesService } from '@/services/user-addresses';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** La lista cambió (selección/alta/edición/borrado): el home refresca el chip. */
  onChanged?: (addresses: UserAddress[]) => void;
};

/**
 * Hoja "Mis direcciones" del cliente: elegir a dónde enviar (tocar una la
 * vuelve la principal), agregar, editar y eliminar. Es el destino del chip
 * "Enviar a…" del home.
 */
export function AddressSheet({ visible, onClose, onChanged }: Props) {
  const insets = useSafeAreaInsets();

  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingId, setSettingId] = useState<number | null>(null);

  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<UserAddress | null>(null);
  const [toDelete, setToDelete] = useState<UserAddress | null>(null);

  const load = useCallback(
    async (notify = false) => {
      setLoading(true);
      try {
        const res = await userAddressesService.list();
        setAddresses(res.data);
        if (notify) onChanged?.(res.data);
      } catch {
        // El interceptor HTTP ya mostró el error.
      } finally {
        setLoading(false);
      }
    },
    [onChanged],
  );

  useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  /** Tocar una dirección = enviar ahí (se marca principal). */
  async function choose(item: UserAddress) {
    if (item.isDefault || settingId) return;
    setSettingId(item.id);
    try {
      await userAddressesService.setDefault(item.id);
      await load(true);
    } catch {
      // El interceptor HTTP ya mostró el error.
    } finally {
      setSettingId(null);
    }
  }

  async function handleDelete() {
    if (!toDelete) return;
    try {
      await userAddressesService.remove(toDelete.id);
      await load(true);
    } catch {
      // El interceptor HTTP ya mostró el error.
    } finally {
      setToDelete(null);
    }
  }

  function openCreate() {
    setEditing(null);
    setFormVisible(true);
  }

  function openEdit(item: UserAddress) {
    setEditing(item);
    setFormVisible(true);
  }

  function handleSaved() {
    setFormVisible(false);
    load(true);
  }

  function renderItem({ item }: { item: UserAddress }) {
    return (
      <Pressable
        onPress={() => choose(item)}
        className="mb-2 flex-row items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3.5 active:opacity-70"
      >
        {/* Radio de selección */}
        {settingId === item.id ? (
          <ActivityIndicator size="small" color="#FF5A3C" />
        ) : (
          <Ionicons
            name={item.isDefault ? 'radio-button-on' : 'radio-button-off'}
            size={22}
            color={item.isDefault ? '#FF5A3C' : '#C9C9D4'}
          />
        )}

        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text numberOfLines={1} className="text-[15px] font-bold text-dark">
              {item.label}
            </Text>
            {item.isDefault && (
              <View className="rounded-full bg-primary-tint px-2 py-0.5">
                <Text className="text-[10px] font-bold uppercase text-primary">
                  Principal
                </Text>
              </View>
            )}
          </View>
          <Text numberOfLines={1} className="text-xs text-muted">
            {item.address}
          </Text>
          {!!item.details && (
            <Text numberOfLines={1} className="text-xs text-muted">
              {item.details}
            </Text>
          )}
        </View>

        <Pressable
          onPress={() => openEdit(item)}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full bg-surface active:opacity-70"
        >
          <Ionicons name="pencil-outline" size={16} color="#1E1E2D" />
        </Pressable>
        <Pressable
          onPress={() => setToDelete(item)}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full bg-red-50 active:opacity-70"
        >
          <Ionicons name="trash-outline" size={16} color="#DC2626" />
        </Pressable>
      </Pressable>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop: tocar afuera cierra */}
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />

      <View
        className="max-h-[75%] rounded-t-[24px] bg-white px-5 pt-4"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-lg font-extrabold text-dark">
            Mis direcciones
          </Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={24} color="#1E1E2D" />
          </Pressable>
        </View>

        {loading ? (
          <View className="items-center py-10">
            <ActivityIndicator size="large" color="#FF5A3C" />
          </View>
        ) : (
          <FlatList
            data={addresses}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            ListEmptyComponent={
              <View className="items-center py-8">
                <Ionicons name="location-outline" size={40} color="#C9C9D4" />
                <Text className="mt-2 text-center text-sm text-muted">
                  Aún no tienes direcciones guardadas.
                </Text>
              </View>
            }
          />
        )}

        {/* Agregar dirección */}
        <Pressable
          onPress={openCreate}
          className="mt-2 flex-row items-center justify-center gap-2 rounded-xl border border-dashed border-primary px-4 py-3 active:opacity-70"
        >
          <Ionicons name="add-circle-outline" size={20} color="#FF5A3C" />
          <Text className="text-[15px] font-bold text-primary">
            Agregar dirección
          </Text>
        </Pressable>
      </View>

      <AddressFormModal
        visible={formVisible}
        editing={editing}
        onClose={() => setFormVisible(false)}
        onSaved={handleSaved}
      />

      <YesNoDialog
        visible={!!toDelete}
        destructive
        title="¿Eliminar dirección?"
        message={`Se eliminará "${toDelete?.label}".`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </Modal>
  );
}
