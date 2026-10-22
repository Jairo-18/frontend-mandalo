import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatRating, StarRating } from '@/components/reviews/star-rating';
import { Avatar } from '@/components/ui/avatar';
import { ListEmpty } from '@/components/ui/list-empty';
import { DEFAULT_BUSINESS_LOGO, DEFAULT_USER_AVATAR } from '@/lib/default-images';
import { YesNoDialog } from '@/components/ui/yes-no-dialog';
import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';
import {
  RatingSummary,
  Review,
  reviewRoleLabel,
  ReviewsPage,
} from '@/services/reviews';

/**
 * Promedio grande + reseñas (más nuevas primero) con scroll infinito.
 * `fetchPage` viene de `reviewsService` según de quién son las reseñas.
 */
export function ReviewsList({
  fetchPage,
  emptyMessage,
  onDelete,
}: {
  fetchPage: (page: number) => Promise<{ data: ReviewsPage }>;
  emptyMessage: string;
  /** Moderación (admin): muestra la papelera en cada reseña. */
  onDelete?: (review: Review) => Promise<unknown>;
}) {
  const colors = useResolvedAppColors();
  const [summary, setSummary] = useState<RatingSummary | null>(null);
  const [items, setItems] = useState<Review[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [toDelete, setToDelete] = useState<Review | null>(null);
  // La función cambia de identidad en cada render del padre: se lee por ref
  // (actualizada en un efecto, no durante el render).
  const fetchRef = useRef(fetchPage);
  useEffect(() => {
    fetchRef.current = fetchPage;
  }, [fetchPage]);

  /** Aplica una página recibida (la 1 reemplaza; las siguientes se suman). */
  const applyPage = useCallback((target: number, res: { data: ReviewsPage }) => {
    setSummary(res.data.summary);
    setItems((prev) =>
      target === 1 ? res.data.reviews.data : [...prev, ...res.data.reviews.data],
    );
    setPage(target);
    setHasNext(res.data.reviews.pagination.hasNextPage);
  }, []);

  const load = useCallback(
    async (target: number, mode: 'more' | 'refresh') => {
      if (mode === 'more') setLoadingMore(true);
      if (mode === 'refresh') setRefreshing(true);
      try {
        applyPage(target, await fetchRef.current(target));
      } catch {
        // El toast del interceptor ya avisó.
      } finally {
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [applyPage],
  );

  // Carga inicial: el estado se toca solo cuando llega la respuesta.
  useEffect(() => {
    let alive = true;
    fetchRef.current(1)
      .then((res) => {
        if (alive) applyPage(1, res);
      })
      .catch(() => {
        // El toast del interceptor ya avisó.
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [applyPage]);

  async function confirmDelete() {
    if (!toDelete || !onDelete) return;
    try {
      await onDelete(toDelete);
      await load(1, 'refresh'); // el promedio también cambió
    } catch {
      // El toast del interceptor ya avisó.
    } finally {
      setToDelete(null);
    }
  }

  if (loading) {
    return (
      <View className="items-center py-10">
        <ActivityIndicator color={colors.primaryColor} />
      </View>
    );
  }

  return (
    <>
    <FlatList
      data={items}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
      ListHeaderComponent={<SummaryCard summary={summary} />}
      renderItem={({ item }) => (
        <ReviewItem review={item} onDelete={onDelete ? () => setToDelete(item) : undefined} />
      )}
      ItemSeparatorComponent={() => <View className="h-3" />}
      refreshing={refreshing}
      onRefresh={() => load(1, 'refresh')}
      onEndReached={() => {
        if (hasNext && !loadingMore) void load(page + 1, 'more');
      }}
      onEndReachedThreshold={0.4}
      ListFooterComponent={
        loadingMore ? (
          <ActivityIndicator className="mt-4" color={colors.primaryColor} />
        ) : null
      }
      ListEmptyComponent={<ListEmpty icon="star-outline" message={emptyMessage} />}
    />
    <YesNoDialog
      visible={!!toDelete}
      destructive
      title="¿Eliminar reseña?"
      message="Se borra para siempre y el promedio se recalcula. Úsalo para groserías o reseñas falsas."
      confirmLabel="Eliminar"
      onConfirm={confirmDelete}
      onCancel={() => setToDelete(null)}
    />
    </>
  );
}

function SummaryCard({ summary }: { summary: RatingSummary | null }) {
  const hasReviews = !!summary?.count && summary.average != null;
  return (
    <View className="mb-4 items-center rounded-2xl bg-card p-5">
      <Text className="text-4xl font-extrabold text-ink">
        {hasReviews ? formatRating(summary!.average!) : '—'}
      </Text>
      <View className="mt-1.5">
        <StarRating value={hasReviews ? summary!.average! : 0} size={22} />
      </View>
      <Text className="mt-1.5 text-[13px] text-muted">
        {hasReviews
          ? `${summary!.count} ${summary!.count === 1 ? 'calificación' : 'calificaciones'}`
          : 'Aún sin calificaciones'}
      </Text>
    </View>
  );
}

function ReviewItem({ review, onDelete }: { review: Review; onDelete?: () => void }) {
  const role = reviewRoleLabel(review.authorRole).toLowerCase();
  const isBusiness = review.authorRole === 'NEGO';
  return (
    // Borde gris (no `border-border`: en la paleta de prod es el rojo de marca).
    <View className="rounded-2xl border border-muted/25 bg-card p-3.5">
      {/* Autor: foto + nombre + rol (la foto ayuda a confiar en la reseña). */}
      <View className="flex-row items-center gap-2.5">
        <Avatar
          uri={review.authorImageUrl}
          fallbackSource={isBusiness ? DEFAULT_BUSINESS_LOGO : DEFAULT_USER_AVATAR}
          icon={isBusiness ? 'storefront-outline' : 'person-outline'}
          size={36}
          shape={isBusiness ? 'rounded' : 'circle'}
        />
        <View className="flex-1">
          <Text numberOfLines={1} className="text-[13px] font-bold text-ink">
            {review.authorName ?? `Un ${role}`}
          </Text>
          <Text className="text-[11px] text-muted">
            {reviewRoleLabel(review.authorRole)} · {formatDate(review.createdAt)}
          </Text>
        </View>
        {onDelete && (
          <Pressable
            onPress={onDelete}
            hitSlop={8}
            className="h-8 w-8 items-center justify-center rounded-full bg-red-50 active:opacity-70"
          >
            <Ionicons name="trash-outline" size={15} color="#DC2626" />
          </Pressable>
        )}
      </View>
      <View className="mt-2.5">
        <StarRating value={review.rating} size={15} />
      </View>
      {!!review.comment && (
        <Text className="mt-1.5 text-[14px] leading-5 text-ink">{review.comment}</Text>
      )}
    </View>
  );
}

/**
 * Hoja a pantalla completa con las reseñas de alguien (negocio en el home o
 * la tienda; cliente/repartidor desde el detalle del pedido).
 */
export function ReviewsSheet({
  visible,
  title,
  fetchPage,
  onClose,
  onDelete,
}: {
  visible: boolean;
  title: string;
  fetchPage: (page: number) => Promise<{ data: ReviewsPage }>;
  onClose: () => void;
  onDelete?: (review: Review) => Promise<unknown>;
}) {
  const insets = useSafeAreaInsets();
  const colors = useResolvedAppColors();
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center gap-3 border-b border-border bg-card px-5 py-3.5">
          <Text numberOfLines={1} className="flex-1 text-lg font-extrabold text-ink">
            {title}
          </Text>
          <Pressable onPress={onClose} hitSlop={10} className="active:opacity-60">
            <Ionicons name="close" size={26} color={colors.inkColor} />
          </Pressable>
        </View>
        {visible && (
          <ReviewsList
            fetchPage={fetchPage}
            emptyMessage="Aún no tiene reseñas."
            onDelete={onDelete}
          />
        )}
      </View>
    </Modal>
  );
}

/** "21 oct 2026" en la zona del teléfono. */
function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}
