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

import { getAppColors } from '@/lib/app-colors';
import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';
import { AddressSearchResult, mapsService } from '@/services/maps';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (result: AddressSearchResult) => void;
};

/**
 * Buscador de direcciones/lugares para el selector de ubicación del negocio
 * (admin): busca contra Nominatim vía backend (`/organizational/search-address`)
 * y deja elegir un resultado para centrar el mapa ahí. Mismo patrón de
 * "buscador con debounce + lista" que `UserPickerModal`.
 */
export function AddressSearchModal({ visible, onClose, onSelect }: Props) {
  const colors = useResolvedAppColors();
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState('');
  const [items, setItems] = useState<AddressSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Descarta respuestas viejas si el admin sigue escribiendo.
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!visible || !search.trim()) {
      setItems([]);
      return;
    }

    const t = setTimeout(async () => {
      const requestId = ++requestIdRef.current;
      setLoading(true);
      try {
        const res = await mapsService.searchAddress(search.trim());
        if (requestId === requestIdRef.current) setItems(res.data);
      } catch {
        if (requestId === requestIdRef.current) setItems([]);
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
          className="h-[75%] rounded-t-3xl bg-card px-4 pt-4"
          style={{ paddingBottom: insets.bottom + 16 }}
          onPress={() => {}}
        >
          <View className="mb-3 h-1 w-10 self-center rounded-full bg-border" />
          <Text className="mb-3 text-center text-base font-bold text-ink">
            Buscar dirección o lugar
          </Text>

          <View className="mb-3 h-[46px] flex-row items-center gap-2.5 rounded-xl bg-surface px-3.5">
            <Ionicons name="search-outline" size={19} color={colors.mutedColor} />
            <TextInput
              className="h-full flex-1 text-[15px] text-ink"
              placeholder="Nombre del negocio, dirección, barrio…"
              placeholderTextColor={colors.mutedColor}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              value={search}
              onChangeText={setSearch}
            />
            {loading && <ActivityIndicator size="small" color={colors.primaryColor} />}
          </View>

          <FlatList
            data={items}
            keyExtractor={(item, index) => `${item.latitude},${item.longitude},${index}`}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                onPress={() => onSelect(item)}
                className="flex-row items-center gap-3 border-b border-border py-3 active:opacity-60"
              >
                <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-tint">
                  <Ionicons name="location" size={18} color={colors.primaryColor} />
                </View>
                <Text numberOfLines={2} className="flex-1 text-[14px] text-ink">
                  {item.label}
                </Text>
              </Pressable>
            )}
            ListEmptyComponent={
              loading ? null : (
                <Text className="py-8 text-center text-sm text-muted">
                  {search.trim()
                    ? 'No se encontraron resultados.'
                    : 'Escribe para buscar una dirección o lugar.'}
                </Text>
              )
            }
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
