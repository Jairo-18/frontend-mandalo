import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProductCrudScreen } from '@/components/business/product-crud-screen';
import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';

/**
 * Productos de un negocio vistos por el ADMIN (desde Negocios): la misma
 * pantalla del negocio en modo admin — editar precio/fotos/estado y borrar,
 * sin crear (el catálogo lo arma el negocio).
 */
export function BusinessProductsModal({
  business,
  onClose,
}: {
  business: { id: number; name: string } | null;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const colors = useResolvedAppColors();
  return (
    <Modal visible={!!business} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center gap-3 border-b border-border bg-card px-5 py-3.5">
          <View className="flex-1">
            <Text className="text-[11px] font-bold uppercase tracking-wide text-muted">
              Productos
            </Text>
            <Text numberOfLines={1} className="text-lg font-extrabold text-ink">
              {business?.name}
            </Text>
          </View>
          <Pressable onPress={onClose} hitSlop={10} className="active:opacity-60">
            <Ionicons name="close" size={26} color={colors.inkColor} />
          </Pressable>
        </View>
        {business && <ProductCrudScreen organizationalId={business.id} />}
      </View>
    </Modal>
  );
}
