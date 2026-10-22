import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StarRating, StarRatingInput } from '@/components/reviews/star-rating';
import { Avatar } from '@/components/ui/avatar';
import { SwipeDownToClose } from '@/components/ui/swipe-down-to-close';
import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';
import { DEFAULT_BUSINESS_LOGO, DEFAULT_USER_AVATAR } from '@/lib/default-images';
import {
  InvoiceReviewStatus,
  REVIEW_COMMENT_MAX,
  ReviewTarget,
  reviewRoleLabel,
  reviewsService,
} from '@/services/reviews';

type Props = {
  visible: boolean;
  status: InvoiceReviewStatus;
  onClose: () => void;
  /** Se guardó una reseña: el padre recarga el estado (tarjeta del detalle). */
  onReviewed: () => void;
};

/** Palabra que acompaña a la calificación elegida. */
function ratingWord(rating: number): string {
  if (rating >= 4.5) return '¡Excelente!';
  if (rating >= 3.5) return 'Bueno';
  if (rating >= 2.5) return 'Regular';
  if (rating >= 1.5) return 'Malo';
  return 'Muy malo';
}

/**
 * "¿Cómo te fue?" al terminar un pedido: hoja desde abajo que califica UNA
 * parte a la vez (negocio, domiciliario o cliente) — "1 de 2", estrellas de
 * 0.5 a 5 y comentario opcional que aparece al elegir estrellas. Enviar u
 * omitir pasa a la siguiente; al final se cierra sola. Las reseñas no se
 * editan, así que las ya enviadas se muestran como resumen.
 */
export function ReviewDialog({ visible, status, onClose, onReviewed }: Props) {
  const insets = useSafeAreaInsets();
  const colors = useResolvedAppColors();
  // Partes que se omitieron en esta apertura (no se vuelven a ofrecer).
  const [skipped, setSkipped] = useState<string[]>([]);

  // Al cerrar se olvidan las omitidas: la próxima vez se vuelven a ofrecer.
  const close = useCallback(() => {
    setSkipped([]);
    onClose();
  }, [onClose]);

  const pending = status.open
    ? status.targets.filter((t) => !t.review && !skipped.includes(t.targetType))
    : [];
  const current = pending[0] ?? null;
  const total = status.targets.filter((t) => !t.review).length + doneCount(status);
  const stepNumber = total - pending.length + 1;

  // Omitir la última parte pendiente cierra la hoja (no queda nada más).
  function skip(targetType: string) {
    if (pending.length <= 1) close();
    else setSkipped((s) => [...s, targetType]);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={close}
      statusBarTranslucent
      navigationBarTranslucent
    >
      {/* GestureHandlerRootView: dentro de un Modal (Android) los gestos no
          llegan sin su propia raíz — sin esto no se podría arrastrar. */}
      <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end"
      >
        <Pressable className="absolute inset-0 bg-black/40" onPress={close} />

        {/* Se cierra con la X, tocando afuera o arrastrándola hacia abajo. */}
        <SwipeDownToClose
          visible={visible}
          onClose={close}
          className="rounded-t-[28px] bg-card px-6 pt-3"
          style={{ paddingBottom: insets.bottom + 20 }}
        >
          {/* Agarradera + cerrar */}
          <View className="mb-2 h-1.5 w-10 self-center rounded-full bg-muted/30" />
          <Pressable
            onPress={close}
            hitSlop={12}
            className="absolute right-4 top-4 h-9 w-9 items-center justify-center rounded-full bg-surface active:opacity-70"
          >
            <Ionicons name="close" size={20} color={colors.inkColor} />
          </Pressable>

          <Text className="mt-2 text-center text-[13px] font-semibold text-muted">
            Pedido #{status.invoiceId}
            {current && total > 1 ? `  ·  ${stepNumber} de ${total}` : ''}
          </Text>

          {current ? (
            <TargetStep
              key={current.targetType}
              invoiceId={status.invoiceId}
              target={current}
              onSent={onReviewed}
              onSkip={() => skip(current.targetType)}
            />
          ) : (
            <Summary status={status} onClose={close} />
          )}
        </SwipeDownToClose>
      </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}

function doneCount(status: InvoiceReviewStatus): number {
  return status.targets.filter((t) => !!t.review).length;
}

/** Un paso: calificar a UNA parte del pedido. */
function TargetStep({
  invoiceId,
  target,
  onSent,
  onSkip,
}: {
  invoiceId: number;
  target: ReviewTarget;
  onSent: () => void;
  onSkip: () => void;
}) {
  const colors = useResolvedAppColors();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const isBusiness = target.targetType === 'BUSINESS';
  const who = isBusiness
    ? 'el negocio'
    : target.targetType === 'DELIVERY'
      ? 'el domiciliario'
      : 'el cliente';

  async function send() {
    if (!rating || sending) return;
    setSending(true);
    try {
      await reviewsService.create(invoiceId, {
        targetType: target.targetType,
        rating,
        comment: comment.trim() || undefined,
      });
      onSent();
    } catch {
      // El toast del interceptor ya mostró el motivo (409 = ya calificado,
      // 400 = palabras no permitidas): se queda en el paso para corregir.
    } finally {
      setSending(false);
    }
  }

  return (
    <View className="items-center">
      <View className="mt-4">
        <Avatar
          uri={target.imageUrl}
          fallbackSource={isBusiness ? DEFAULT_BUSINESS_LOGO : DEFAULT_USER_AVATAR}
          icon={isBusiness ? 'storefront-outline' : 'person-outline'}
          size={72}
          shape={isBusiness ? 'rounded' : 'circle'}
        />
      </View>
      <Text className="mt-3 text-[11px] font-bold uppercase tracking-widest text-primary">
        {reviewRoleLabel(target.targetType)}
      </Text>
      <Text numberOfLines={1} className="mt-0.5 text-center text-xl font-extrabold text-ink">
        ¿Cómo te fue con {target.name}?
      </Text>

      <View className="mt-5">
        <StarRatingInput value={rating} onChange={setRating} size={44} disabled={sending} />
      </View>
      <Text
        className={`mt-4 text-[15px] font-bold ${rating ? 'text-ink' : 'text-muted'}`}
      >
        {rating ? ratingWord(rating) : 'Toca una estrella (vale media)'}
      </Text>

      {/* El comentario aparece cuando ya eligió estrellas: menos ruido. */}
      {rating > 0 && (
        <View className="mt-4 w-full">
          <TextInput
            value={comment}
            onChangeText={setComment}
            editable={!sending}
            placeholder={`Cuéntanos sobre ${who} (opcional)`}
            placeholderTextColor={colors.mutedColor}
            maxLength={REVIEW_COMMENT_MAX}
            multiline
            textAlignVertical="top"
            // Borde gris (no `border-border`: en la paleta de prod es el rojo
            // de la marca) y fondo de tarjeta: la superficie puede ser blanca
            // igual que la hoja y el campo no se distinguía.
            className="min-h-[96px] rounded-2xl border border-muted/30 bg-card px-4 py-3 text-[14px] text-ink"
          />
          <Text className="mt-1 text-right text-[11px] text-muted">
            {comment.length}/{REVIEW_COMMENT_MAX}
          </Text>
        </View>
      )}

      <Pressable
        onPress={send}
        disabled={!rating || sending}
        className={`mt-5 h-14 w-full items-center justify-center rounded-2xl active:opacity-80 ${
          rating ? 'bg-primary' : 'bg-muted/15'
        }`}
      >
        {sending ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text
            className={`text-[16px] font-bold ${rating ? 'text-white' : 'text-muted'}`}
          >
            Enviar calificación
          </Text>
        )}
      </Pressable>
      <Pressable
        onPress={onSkip}
        disabled={sending}
        className="mt-3 h-12 w-full items-center justify-center rounded-2xl border border-muted/30 active:opacity-70"
      >
        <Text className="text-[15px] font-semibold text-muted">Omitir</Text>
      </Pressable>
    </View>
  );
}

/** Sin nada pendiente: lo que ya calificó (no se edita) o el plazo vencido. */
function Summary({
  status,
  onClose,
}: {
  status: InvoiceReviewStatus;
  onClose: () => void;
}) {
  const done = status.targets.filter((t) => !!t.review);
  return (
    <View>
      <Text className="mt-3 text-center text-xl font-extrabold text-ink">
        {done.length ? 'Tus calificaciones' : 'Ya no se puede calificar'}
      </Text>
      {!status.open && !done.length && (
        <Text className="mt-1 text-center text-[13px] text-muted">
          El plazo de 7 días para calificar este pedido terminó.
        </Text>
      )}
      <View className="mt-4 gap-3">
        {done.map((target) => (
          <View
            key={target.targetType}
            className="rounded-2xl border border-muted/30 p-4"
          >
            <View className="flex-row items-center justify-between gap-2">
              <Text numberOfLines={1} className="flex-1 text-[14px] font-bold text-ink">
                {target.name}
              </Text>
              <StarRating value={target.review!.rating} size={15} />
            </View>
            <Text className="text-[11px] text-muted">
              {reviewRoleLabel(target.targetType)}
            </Text>
            {!!target.review!.comment && (
              <Text className="mt-1.5 text-[13px] text-ink">{target.review!.comment}</Text>
            )}
          </View>
        ))}
      </View>
      <Pressable
        onPress={onClose}
        className="mt-5 h-14 items-center justify-center rounded-2xl bg-primary active:opacity-80"
      >
        <Text className="text-[16px] font-bold text-white">Listo</Text>
      </Pressable>
    </View>
  );
}
