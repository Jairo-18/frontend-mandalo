import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/badge';
import { ListEmpty } from '@/components/ui/list-empty';
import { Paginator } from '@/components/ui/paginator';
import { PhotoPreviewModal } from '@/components/ui/photo-preview-modal';
import { YesNoDialog } from '@/components/ui/yes-no-dialog';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { getAppColors } from '@/lib/app-colors';
import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';
import {
  DeliveryAccident,
  deliveryAccidentService,
} from '@/services/delivery-accident';

type PendingFilter = 'pending' | 'reviewed' | 'all';

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/**
 * Panel admin "Accidentes" (reunión con el cliente 2026-08-04): lista de
 * reportes de repartidores, con detalle (pedido, fotos, ARL) y "Procesar
 * accidente" (marca como atendido).
 */
export function AccidentsScreen() {
  const colors = useResolvedAppColors();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<PendingFilter>('pending');
  const [selected, setSelected] = useState<DeliveryAccident | null>(null);
  const [detail, setDetail] = useState<DeliveryAccident | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [toReview, setToReview] = useState<DeliveryAccident | null>(null);

  const list = usePaginatedList<DeliveryAccident>(
    useCallback(
      ({ page, perPage }) =>
        deliveryAccidentService.paginated({
          page,
          perPage,
          onlyPending: filter === 'all' ? undefined : filter === 'pending',
        }),
      [filter],
    ),
  );

  async function openDetail(item: DeliveryAccident) {
    setSelected(item);
    setLoadingDetail(true);
    try {
      const res = await deliveryAccidentService.getOne(item.id);
      setDetail(res.data);
    } catch {
      setSelected(null);
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleReview() {
    if (!toReview) return;
    await deliveryAccidentService.review(toReview.id);
    setToReview(null);
    setSelected(null);
    setDetail(null);
    list.fetchPage(list.meta?.page ?? 1, 'refresh');
  }

  return (
    <View className="flex-1 bg-surface">
      <View className="flex-row gap-2 px-4 pb-2 pt-3">
        {(['pending', 'reviewed', 'all'] as const).map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            className={`rounded-full border px-3.5 py-1.5 ${
              filter === f ? 'border-primary bg-primary-tint' : 'border-border bg-card'
            }`}
          >
            <Text
              className={`text-xs font-bold ${filter === f ? 'text-primary' : 'text-muted'}`}
            >
              {f === 'pending' ? 'Pendientes' : f === 'reviewed' ? 'Atendidos' : 'Todos'}
            </Text>
          </Pressable>
        ))}
      </View>

      {list.loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primaryColor} />
        </View>
      ) : (
        <FlatList
          data={list.items}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => openDetail(item)}
              className="mb-3 rounded-2xl border border-border bg-card p-4 active:opacity-80"
            >
              <View className="flex-row items-center justify-between">
                <Text className="flex-1 text-[15px] font-extrabold text-ink">
                  {item.deliveryUser?.fullName ?? 'Repartidor'}
                </Text>
                <Badge
                  label={item.reviewedAt ? 'Atendido' : 'Pendiente'}
                  tone={item.reviewedAt ? 'green' : 'amber'}
                />
              </View>
              <Text className="mt-1 text-xs text-muted">
                {item.reasonCode} · Pedido #{item.invoiceId ?? '—'}
              </Text>
              <Text className="mt-1 text-xs text-muted">{fmtDate(item.incidentAt)}</Text>
            </Pressable>
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
          refreshing={list.refreshing}
          onRefresh={() => list.fetchPage(list.meta?.page ?? 1, 'refresh')}
          ListEmptyComponent={
            <ListEmpty icon="warning-outline" message="No hay reportes de accidentes." />
          }
        />
      )}

      <View style={{ paddingBottom: insets.bottom }} className="bg-card">
        <Paginator
          pagination={list.meta}
          disabled={list.loading || list.refreshing}
          onPageChange={(page) => list.fetchPage(page, 'page')}
          onPerPageChange={list.setPerPage}
        />
      </View>

      {/* Detalle */}
      <Modal
        visible={selected != null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View
            className="max-h-[88%] rounded-t-[24px] bg-card p-5"
            style={{ paddingBottom: insets.bottom + 16 }}
          >
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-lg font-extrabold text-ink">Reporte de accidente</Text>
              <Pressable onPress={() => setSelected(null)} hitSlop={10}>
                <Ionicons name="close" size={22} color={colors.inkColor} />
              </Pressable>
            </View>

            {loadingDetail || !detail ? (
              <ActivityIndicator size="large" color={colors.primaryColor} style={{ marginTop: 24 }} />
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Badge
                  label={detail.reviewedAt ? 'Atendido' : 'Pendiente'}
                  tone={detail.reviewedAt ? 'green' : 'amber'}
                />

                <Text className="mb-1 mt-4 text-[11px] font-bold uppercase tracking-wide text-muted">
                  Repartidor
                </Text>
                <Text className="text-[14px] font-bold text-ink">
                  {detail.deliveryUser?.fullName ?? '—'}
                </Text>
                <Text className="text-[13px] text-muted">
                  {detail.deliveryUser?.phone ?? 'Sin teléfono'}
                </Text>
                <Text className="text-[13px] text-muted">
                  ARL individual: {detail.deliveryUser?.arlIndividualNumber ?? 'Sin asignar'}
                </Text>

                <Text className="mb-1 mt-4 text-[11px] font-bold uppercase tracking-wide text-muted">
                  Pedido
                </Text>
                {detail.invoice ? (
                  <>
                    <Text className="text-[14px] font-bold text-ink">
                      #{detail.invoice.id} —{' '}
                      {detail.invoice.organizational?.tradeName ||
                        detail.invoice.organizational?.legalName ||
                        'Pedido personalizado'}
                    </Text>
                    <Text className="text-[13px] text-muted">{detail.invoice.deliveryAddress}</Text>
                    {!!detail.invoice.details?.length && (
                      <Text className="mt-1 text-[13px] text-muted">
                        {detail.invoice.details
                          .map((d) => `${d.quantity}× ${d.productName}`)
                          .join(', ')}
                      </Text>
                    )}
                  </>
                ) : (
                  <Text className="text-[13px] text-muted">Pedido no disponible</Text>
                )}

                <Text className="mb-1 mt-4 text-[11px] font-bold uppercase tracking-wide text-muted">
                  Qué pasó
                </Text>
                <Text className="text-[14px] font-bold text-ink">{detail.reasonCode}</Text>
                {!!detail.notes && (
                  <Text className="mt-1 text-[13px] leading-5 text-muted">{detail.notes}</Text>
                )}
                <Text className="mt-1 text-[12px] text-muted">{fmtDate(detail.incidentAt)}</Text>

                <Text className="mb-2 mt-4 text-[11px] font-bold uppercase tracking-wide text-muted">
                  Fotos
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {detail.photos.map((url) => (
                    <Pressable key={url} onPress={() => setPreview(url)}>
                      <Image
                        source={{ uri: url }}
                        style={{ width: 84, height: 84, borderRadius: 12 }}
                        resizeMode="cover"
                      />
                    </Pressable>
                  ))}
                </View>

                {detail.reviewedAt ? (
                  <Text className="mt-5 text-[12px] text-muted">
                    Atendido por {detail.reviewedByAdmin?.fullName ?? 'un admin'} el{' '}
                    {fmtDate(detail.reviewedAt)}.
                  </Text>
                ) : (
                  <Pressable
                    onPress={() => setToReview(detail)}
                    className="mt-5 h-[48px] flex-row items-center justify-center gap-2 rounded-2xl bg-primary active:opacity-80"
                  >
                    <Ionicons name="checkmark-done-outline" size={18} color="#FFFFFF" />
                    <Text className="text-[15px] font-bold text-white">
                      Procesar accidente
                    </Text>
                  </Pressable>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <PhotoPreviewModal uri={preview} onClose={() => setPreview(null)} />

      <YesNoDialog
        visible={!!toReview}
        icon="checkmark-done-outline"
        title="¿Marcar como atendido?"
        message="Confirmas que ya revisaste este reporte de accidente."
        confirmLabel="Sí, procesar"
        onConfirm={handleReview}
        onCancel={() => setToReview(null)}
      />
    </View>
  );
}
