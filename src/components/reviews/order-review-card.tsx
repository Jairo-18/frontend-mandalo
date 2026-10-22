import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ReviewDialog } from '@/components/reviews/review-dialog';
import { STAR_COLOR } from '@/components/reviews/star-rating';
import { deviceStoreGet, deviceStoreSet } from '@/lib/device-store';
import { InvoiceReviewStatus, reviewsService } from '@/services/reviews';

/** Marca por pedido: ya se le abrió solo el diálogo (no volver a insistir). */
const promptedKey = (invoiceId: number) => `review_prompted_${invoiceId}`;

/**
 * Tarjeta de calificación en el detalle de un pedido ENTREGADO (los 3 roles).
 * La primera vez que se ve el pedido con algo por calificar, el diálogo se
 * abre solo ("¿deseas dejar una reseña?"); después queda la tarjeta para
 * hacerlo cuando quiera, dentro de los 7 días.
 */
export function OrderReviewCard({ invoiceId }: { invoiceId: number }) {
  const [status, setStatus] = useState<InvoiceReviewStatus | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await reviewsService.status(invoiceId);
      setStatus(res.data);
      return res.data;
    } catch {
      return null; // Silencioso: sin la tarjeta, el detalle sigue igual.
    }
  }, [invoiceId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const fresh = await load();
      if (cancelled || !fresh?.canReview) return;
      const key = promptedKey(invoiceId);
      if (await deviceStoreGet(key).catch(() => null)) return;
      void deviceStoreSet(key, '1').catch(() => {});
      if (!cancelled) setDialogOpen(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [invoiceId, load]);

  if (!status || status.targets.length === 0) return null;
  const pending = status.targets.filter((t) => !t.review).length;
  // Cerrado y sin nada calificado: no hay nada que mostrar.
  if (!status.open && pending === status.targets.length) return null;

  return (
    <>
      <Pressable
        onPress={() => setDialogOpen(true)}
        className="mb-5 flex-row items-center gap-3 rounded-2xl bg-amber-50 p-4 active:opacity-80"
      >
        <Ionicons name="star" size={24} color={STAR_COLOR} />
        <View className="flex-1">
          <Text className="text-[14px] font-extrabold text-amber-900">
            {status.canReview ? 'Califica este pedido' : 'Tus calificaciones'}
          </Text>
          <Text className="text-[12px] text-amber-800">
            {status.canReview
              ? `Te falta calificar ${pending === 1 ? 'a 1 parte' : `a ${pending} partes`}.`
              : 'Toca para ver lo que calificaste.'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#92400E" />
      </Pressable>

      <ReviewDialog
        visible={dialogOpen}
        status={status}
        onClose={() => setDialogOpen(false)}
        onReviewed={() => void load()}
      />
    </>
  );
}
