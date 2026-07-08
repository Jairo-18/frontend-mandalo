import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** La misma metadata que devuelve el backend en `pagination`. */
export type PaginationMeta = {
  page: number;
  perPage: number;
  total: number;
  pageCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

type Props = {
  pagination: PaginationMeta | null;
  onPageChange: (page: number) => void;
  /** Si se pasa, muestra el selector de tamaño de página. */
  onPerPageChange?: (perPage: number) => void;
  perPageOptions?: number[];
  /** Deshabilita los controles mientras carga. */
  disabled?: boolean;
};

/**
 * Paginador reutilizable estilo mat-paginator (como en samawe/Angular):
 * "Por página" + rango "1–20 de 133" + botones anterior/siguiente. Se conecta
 * directo con la metadata `pagination` de los endpoints paginados.
 */
export function Paginator({
  pagination,
  onPageChange,
  onPerPageChange,
  perPageOptions = [10, 20, 50],
  disabled = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const [perPageOpen, setPerPageOpen] = useState(false);

  if (!pagination) return null;

  const { page, perPage, total, hasPreviousPage, hasNextPage } = pagination;
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  return (
    <View className="flex-row items-center justify-between border-t border-gray-100 bg-white px-4 py-2.5">
      {/* Tamaño de página */}
      {onPerPageChange ? (
        <Pressable
          onPress={() => setPerPageOpen(true)}
          disabled={disabled}
          className="flex-row items-center gap-1 rounded-lg bg-surface px-2.5 py-1.5 active:opacity-70"
        >
          <Text className="text-xs font-bold text-dark">{perPage}</Text>
          <Ionicons name="chevron-down" size={12} color="#7A7A8A" />
          <Text className="text-xs text-muted">por pág.</Text>
        </Pressable>
      ) : (
        <View />
      )}

      {/* Rango + navegación */}
      <View className="flex-row items-center gap-2">
        <Text className="text-xs font-medium text-muted">
          {from}–{to} de {total}
        </Text>
        <Pressable
          onPress={() => onPageChange(page - 1)}
          disabled={disabled || !hasPreviousPage}
          hitSlop={6}
          className={`h-9 w-9 items-center justify-center rounded-full active:opacity-70 ${
            hasPreviousPage && !disabled ? 'bg-surface' : 'opacity-30'
          }`}
        >
          <Ionicons name="chevron-back" size={18} color="#1E1E2D" />
        </Pressable>
        <Pressable
          onPress={() => onPageChange(page + 1)}
          disabled={disabled || !hasNextPage}
          hitSlop={6}
          className={`h-9 w-9 items-center justify-center rounded-full active:opacity-70 ${
            hasNextPage && !disabled ? 'bg-surface' : 'opacity-30'
          }`}
        >
          <Ionicons name="chevron-forward" size={18} color="#1E1E2D" />
        </Pressable>
      </View>

      {/* Hoja para elegir el tamaño de página */}
      <Modal
        visible={perPageOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPerPageOpen(false)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/40"
          onPress={() => setPerPageOpen(false)}
        >
          <Pressable
            className="rounded-t-3xl bg-white px-4 pt-4"
            style={{ paddingBottom: insets.bottom + 16 }}
            onPress={() => {}}
          >
            <View className="mb-3 h-1 w-10 self-center rounded-full bg-gray-200" />
            <Text className="mb-3 text-center text-base font-bold text-dark">
              Resultados por página
            </Text>
            {perPageOptions.map((option) => (
              <Pressable
                key={option}
                onPress={() => {
                  setPerPageOpen(false);
                  if (option !== perPage) onPerPageChange?.(option);
                }}
                className="flex-row items-center justify-between border-b border-gray-100 py-3.5 active:opacity-60"
              >
                <Text
                  className={`text-[15px] ${
                    option === perPage
                      ? 'font-bold text-primary'
                      : 'text-gray-800'
                  }`}
                >
                  {option}
                </Text>
                {option === perPage && (
                  <Ionicons name="checkmark" size={18} color="#FF5A3C" />
                )}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
