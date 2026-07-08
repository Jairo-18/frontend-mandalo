import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AdminUser, adminUsersService } from '@/services/admin-users';

type Props = {
  visible: boolean;
  /** Título de la hoja ("Buscar representante"). */
  title: string;
  onClose: () => void;
  onSelect: (user: AdminUser) => void;
};

/**
 * Buscador de usuarios para vincular cuentas (hoja modal): busca contra
 * `/user/paginated` (nombre, correo, username, identificación o teléfono,
 * cualquier rol) y muestra nombre + identificación para elegir.
 */
export function UserPickerModal({ visible, title, onClose, onSelect }: Props) {
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState('');
  const [items, setItems] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);

  // Descarta respuestas viejas si el admin sigue escribiendo.
  const requestIdRef = useRef(0);

  // Busca con debounce cada vez que cambia el texto (y al abrir).
  useEffect(() => {
    if (!visible) return;

    const t = setTimeout(async () => {
      const requestId = ++requestIdRef.current;
      setLoading(true);
      try {
        const res = await adminUsersService.paginated({
          page: 1,
          perPage: 20,
          search,
        });
        if (requestId === requestIdRef.current) setItems(res.data);
      } catch {
        // El interceptor HTTP ya mostró el error.
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [visible, search]);

  // Limpia la búsqueda al abrir de nuevo.
  useEffect(() => {
    if (visible) setSearch('');
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <Pressable
          className="h-[75%] rounded-t-3xl bg-white px-4 pt-4"
          style={{ paddingBottom: insets.bottom + 16 }}
          onPress={() => {}}
        >
          <View className="mb-3 h-1 w-10 self-center rounded-full bg-gray-200" />
          <Text className="mb-3 text-center text-base font-bold text-dark">
            {title}
          </Text>

          <View className="mb-3 h-[46px] flex-row items-center gap-2.5 rounded-xl bg-surface px-3.5">
            <Ionicons name="search-outline" size={19} color="#9CA3AF" />
            <TextInput
              className="h-full flex-1 text-[15px] text-dark"
              placeholder="Nombre, identificación, correo…"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              value={search}
              onChangeText={setSearch}
            />
            {loading && <ActivityIndicator size="small" color="#FF5A3C" />}
          </View>

          <FlatList
            data={items}
            keyExtractor={(u) => u.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                onPress={() => onSelect(item)}
                className="flex-row items-center gap-3 border-b border-gray-100 py-3 active:opacity-60"
              >
                <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-tint">
                  <Text className="text-sm font-extrabold text-primary">
                    {item.fullName.trim().charAt(0).toUpperCase() || '?'}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text
                    numberOfLines={1}
                    className="text-[15px] font-bold text-dark"
                  >
                    {item.fullName}
                  </Text>
                  <Text numberOfLines={1} className="text-xs text-muted">
                    {[
                      item.identificationNumber &&
                        `ID ${item.identificationNumber}`,
                      item.email,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                </View>
                {item.roleType?.name && (
                  <Text className="text-[11px] font-bold text-muted">
                    {item.roleType.name}
                  </Text>
                )}
              </Pressable>
            )}
            ListEmptyComponent={
              loading ? null : (
                <Text className="py-8 text-center text-sm text-gray-400">
                  {search
                    ? 'No se encontraron usuarios.'
                    : 'Escribe para buscar usuarios.'}
                </Text>
              )
            }
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
