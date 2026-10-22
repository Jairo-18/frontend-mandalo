import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ListEmpty } from '@/components/ui/list-empty';
import { YesNoDialog } from '@/components/ui/yes-no-dialog';
import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';
import { formatPrice } from '@/lib/price';
import {
  OwnerPromotion,
  PROMOTION_STATUS_LABEL,
  promotionContents,
  promotionsService,
} from '@/services/promotions';

/**
 * Publicidades de un negocio vistas por el ADMIN (moderación): todas, con su
 * estado; puede ocultarlas (dejan de verse aunque estén activas), volver a
 * mostrarlas o borrarlas. El negocio ve "Oculta por el admin".
 */
export function BusinessPromotionsModal({
  business,
  onClose,
}: {
  business: { id: number; name: string } | null;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const colors = useResolvedAppColors();
  const [promos, setPromos] = useState<OwnerPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [toDelete, setToDelete] = useState<OwnerPromotion | null>(null);
  const businessId = business?.id;

  const reload = useCallback(async () => {
    if (!businessId) return;
    try {
      const res = await promotionsService.adminForBusiness(businessId);
      setPromos(res.data);
    } catch {
      // El toast del interceptor ya avisó.
    }
  }, [businessId]);

  useEffect(() => {
    if (!businessId) return;
    let alive = true;
    promotionsService
      .adminForBusiness(businessId)
      .then((res) => {
        if (alive) setPromos(res.data);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [businessId]);

  async function toggleHidden(promo: OwnerPromotion) {
    try {
      await promotionsService.setHidden(promo.id, !promo.hiddenByAdmin);
      await reload();
    } catch {
      // El toast del interceptor ya avisó.
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await promotionsService.remove(toDelete.id);
      await reload();
    } catch {
      // El toast del interceptor ya avisó.
    } finally {
      setToDelete(null);
    }
  }

  return (
    <Modal
      visible={!!business}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center gap-3 border-b border-border bg-card px-5 py-3.5">
          <View className="flex-1">
            <Text className="text-[11px] font-bold uppercase tracking-wide text-muted">
              Publicidad
            </Text>
            <Text numberOfLines={1} className="text-lg font-extrabold text-ink">
              {business?.name}
            </Text>
          </View>
          <Pressable onPress={onClose} hitSlop={10} className="active:opacity-60">
            <Ionicons name="close" size={26} color={colors.inkColor} />
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator className="mt-10" color={colors.primaryColor} />
        ) : (
          <FlatList
            data={promos}
            keyExtractor={(p) => String(p.id)}
            contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
            ItemSeparatorComponent={() => <View className="h-3" />}
            ListEmptyComponent={
              <ListEmpty icon="megaphone-outline" message="Este negocio no tiene publicidades." />
            }
            renderItem={({ item }) => (
              <View className="flex-row gap-3 rounded-2xl border border-border bg-card p-3">
                <View className="overflow-hidden rounded-xl bg-surface" style={{ width: 112, height: 63 }}>
                  {!!item.imageUrl && (
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={{ width: 112, height: 63 }}
                      contentFit="contain"
                    />
                  )}
                </View>
                <View className="flex-1">
                  <Text numberOfLines={1} className="text-[14px] font-bold text-ink">
                    {item.title}
                  </Text>
                  <Text className="text-[11px] text-muted">
                    {PROMOTION_STATUS_LABEL[item.status]} · {formatPrice(item.price)}
                  </Text>
                  {!!item.message && (
                    <Text numberOfLines={2} className="mt-0.5 text-[12px] text-ink">
                      {item.message}
                    </Text>
                  )}
                  <Text numberOfLines={1} className="text-[11px] text-muted">
                    {promotionContents(item)}
                  </Text>
                  <View className="mt-2 flex-row gap-2">
                    <Pressable
                      onPress={() => toggleHidden(item)}
                      className="h-8 flex-1 flex-row items-center justify-center gap-1 rounded-lg border border-border active:opacity-70"
                    >
                      <Ionicons
                        name={item.hiddenByAdmin ? 'eye-outline' : 'eye-off-outline'}
                        size={14}
                        color={colors.inkColor}
                      />
                      <Text className="text-[12px] font-bold text-ink">
                        {item.hiddenByAdmin ? 'Mostrar' : 'Ocultar'}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setToDelete(item)}
                      className="h-8 w-9 items-center justify-center rounded-lg bg-red-50 active:opacity-70"
                    >
                      <Ionicons name="trash-outline" size={14} color="#DC2626" />
                    </Pressable>
                  </View>
                </View>
              </View>
            )}
          />
        )}

        <YesNoDialog
          visible={!!toDelete}
          destructive
          title="¿Eliminar publicidad?"
          message={`Se borra "${toDelete?.title}". Si solo es inapropiada por un tiempo, mejor ocúltala.`}
          confirmLabel="Eliminar"
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
          stacked
        />
      </View>
    </Modal>
  );
}
