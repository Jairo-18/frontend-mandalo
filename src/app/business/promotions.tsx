import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PromotionFormModal } from '@/components/business/promotion-form-modal';
import { Fab } from '@/components/ui/fab';
import { ListEmpty } from '@/components/ui/list-empty';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { YesNoDialog } from '@/components/ui/yes-no-dialog';
import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';
import { getAppColors } from '@/lib/app-colors';
import { formatPrice } from '@/lib/price';
import {
  MAX_ACTIVE_PROMOTIONS,
  OwnerPromotion,
  PROMOTION_STATUS_LABEL,
  PromotionStatus,
  promotionContents,
  promotionsService,
} from '@/services/promotions';

const STATUS_STYLE: Record<PromotionStatus, { box: string; text: string }> = {
  ACTIVE: { box: 'bg-emerald-50', text: 'text-emerald-700' },
  SCHEDULED: { box: 'bg-sky-50', text: 'text-sky-700' },
  PAUSED: { box: 'bg-amber-50', text: 'text-amber-800' },
  EXPIRED: { box: 'bg-muted/15', text: 'text-muted' },
  HIDDEN: { box: 'bg-red-50', text: 'text-red-600' },
};

/**
 * "Mis publicidades" del negocio: sus promociones con
 * estado, crear/editar/pausar/borrar. Las activas salen en el carrusel del
 * home de los clientes cercanos y arriba en la tienda del negocio.
 */
export default function BusinessPromotionsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useResolvedAppColors();
  const [promos, setPromos] = useState<OwnerPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<OwnerPromotion | null>(null);
  const [toDelete, setToDelete] = useState<OwnerPromotion | null>(null);

  const load = useCallback(async (mode: 'initial' | 'refresh') => {
    if (mode === 'refresh') setRefreshing(true);
    try {
      const res = await promotionsService.mine();
      setPromos(res.data);
    } catch {
      // El toast del interceptor ya avisó.
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    promotionsService
      .mine()
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
  }, []);

  const activeCount = promos.filter(
    (p) => p.isActive && p.status !== 'EXPIRED',
  ).length;

  async function togglePaused(promo: OwnerPromotion) {
    try {
      await promotionsService.update(promo.id, { isActive: !promo.isActive });
      await load('refresh');
    } catch {
      // El toast del interceptor ya avisó (p. ej. tope de 5 activas).
    }
  }

  async function handleDelete() {
    if (!toDelete) return;
    try {
      await promotionsService.remove(toDelete.id);
      await load('refresh');
    } catch {
      // El toast del interceptor ya avisó.
    } finally {
      setToDelete(null);
    }
  }

  return (
    <View className="flex-1 bg-surface">
      {/* Continúa el header de degradado del drawer (mismo patrón que Mis pagos). */}
      <LinearGradient
        colors={[getAppColors().primaryColor, getAppColors().darkColor]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}
      >
        <View className="flex-row items-center gap-3 px-5 pb-5 pt-1">
          <View className="flex-1">
            <Text className="text-lg font-extrabold text-white">Mis publicidades</Text>
            <Text className="text-xs text-white/70">
              {activeCount} de {MAX_ACTIVE_PROMOTIONS} activas
            </Text>
          </View>
          <ThemeToggle
            className="h-10 w-10 items-center justify-center rounded-full bg-white/15 active:opacity-70"
            iconColor="#FFFFFF"
          />
        </View>
      </LinearGradient>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primaryColor} />
        </View>
      ) : (
        <FlatList
          data={promos}
          keyExtractor={(p) => String(p.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: 96 + insets.bottom }}
          ItemSeparatorComponent={() => <View className="h-4" />}
          refreshing={refreshing}
          onRefresh={() => load('refresh')}
          ListEmptyComponent={
            <ListEmpty
              icon="megaphone-outline"
              message="Aún no tienes publicidades. Crea una con el botón + y aparecerá en el inicio de los clientes cercanos."
            />
          }
          renderItem={({ item }) => (
            <PromotionCard
              promo={item}
              onEdit={() => {
                setEditing(item);
                setFormVisible(true);
              }}
              onTogglePaused={() => togglePaused(item)}
              onDelete={() => setToDelete(item)}
            />
          )}
        />
      )}

      <Fab
        onPress={() => {
          setEditing(null);
          setFormVisible(true);
        }}
      />

      <PromotionFormModal
        visible={formVisible}
        editing={editing}
        onClose={() => setFormVisible(false)}
        onSaved={() => {
          setFormVisible(false);
          void load('refresh');
        }}
      />

      <YesNoDialog
        visible={!!toDelete}
        destructive
        title="¿Eliminar publicidad?"
        message={`"${toDelete?.title}" deja de mostrarse y se borra. Los pedidos que ya la incluyeron no cambian.`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
        stacked
      />
    </View>
  );
}

function PromotionCard({
  promo,
  onEdit,
  onTogglePaused,
  onDelete,
}: {
  promo: OwnerPromotion;
  onEdit: () => void;
  onTogglePaused: () => void;
  onDelete: () => void;
}) {
  const colors = useResolvedAppColors();
  const style = STATUS_STYLE[promo.status];
  const canToggle = promo.status !== 'EXPIRED' && promo.status !== 'HIDDEN';
  return (
    <View className="overflow-hidden rounded-2xl border border-border bg-card">
      <View className="w-full bg-surface" style={{ aspectRatio: 16 / 9 }}>
        {promo.imageUrl ? (
          <Image
            source={{ uri: promo.imageUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="image-outline" size={28} color={colors.mutedColor} />
          </View>
        )}
        <View className={`absolute left-3 top-3 rounded-full px-2.5 py-1 ${style.box}`}>
          <Text className={`text-[11px] font-bold ${style.text}`}>
            {PROMOTION_STATUS_LABEL[promo.status]}
          </Text>
        </View>
      </View>

      <View className="p-4">
        <Text className="text-[16px] font-extrabold text-ink">{promo.title}</Text>
        {!!promo.message && (
          <Text className="mt-0.5 text-[13px] text-muted">{promo.message}</Text>
        )}
        <Text className="mt-1.5 text-[12px] text-ink">{promotionContents(promo)}</Text>
        <View className="mt-2 flex-row items-baseline gap-2">
          <Text className="text-[17px] font-extrabold text-primary">
            {formatPrice(promo.price)}
          </Text>
          {promo.regularPrice > promo.price && (
            <Text className="text-[12px] text-muted line-through">
              {formatPrice(promo.regularPrice)}
            </Text>
          )}
        </View>
        <Text className="mt-1 text-[11px] text-muted">
          {promo.status === 'EXPIRED' ? 'Venció el ' : 'Vence el '}
          {new Date(promo.endsAt).toLocaleDateString('es-CO', {
            day: 'numeric',
            month: 'short',
          })}
          {promo.status === 'HIDDEN' ? ' · el administrador la ocultó' : ''}
        </Text>

        <View className="mt-3 flex-row gap-2">
          <Pressable
            onPress={onEdit}
            className="h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-border active:opacity-70"
          >
            <Ionicons name="create-outline" size={16} color={colors.inkColor} />
            <Text className="text-[13px] font-bold text-ink">
              {promo.status === 'EXPIRED' ? 'Renovar' : 'Editar'}
            </Text>
          </Pressable>
          {canToggle && (
            <Pressable
              onPress={onTogglePaused}
              className="h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-border active:opacity-70"
            >
              <Ionicons
                name={promo.isActive ? 'pause-outline' : 'play-outline'}
                size={16}
                color={colors.inkColor}
              />
              <Text className="text-[13px] font-bold text-ink">
                {promo.isActive ? 'Pausar' : 'Activar'}
              </Text>
            </Pressable>
          )}
          <Pressable
            onPress={onDelete}
            className="h-10 w-10 items-center justify-center rounded-xl bg-red-50 active:opacity-70"
          >
            <Ionicons name="trash-outline" size={16} color="#DC2626" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
