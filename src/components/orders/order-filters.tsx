import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { FilterChips } from '@/components/ui/filter-chips';
import { OrderStateCode } from '@/lib/order-status';

/** Filtro rápido por estado de los listados de pedidos (cliente y repartidor). */
export type OrderFilter = 'all' | 'active' | 'delivered' | 'cancelled';

/** Estados que cubre cada chip (`undefined` = sin filtro, todos). */
export const ORDER_FILTER_CODES: Record<
  OrderFilter,
  OrderStateCode[] | undefined
> = {
  all: undefined,
  active: ['PEND', 'ACEP', 'PREP', 'RUTA'],
  delivered: ['ENTR'],
  cancelled: ['CANC'],
};

const OPTIONS: { value: OrderFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'En curso' },
  { value: 'delivered', label: 'Entregados' },
  { value: 'cancelled', label: 'Cancelados' },
];

type Props = {
  filter: OrderFilter;
  onFilter: (value: OrderFilter) => void;
  /** DESC = más nuevos primero. */
  order: 'ASC' | 'DESC';
  onOrder: (value: 'ASC' | 'DESC') => void;
};

/**
 * Barra de filtros de los listados de pedidos: chips por estado (Todos ·
 * En curso · Entregados · Cancelados) + toggle de orden por fecha
 * (más nuevos ⇄ más antiguos).
 */
export function OrderFilters({ filter, onFilter, order, onOrder }: Props) {
  const newestFirst = order === 'DESC';
  return (
    <View className="flex-row items-center gap-2">
      <View className="flex-1">
        <FilterChips options={OPTIONS} value={filter} onChange={onFilter} />
      </View>
      <Pressable
        onPress={() => onOrder(newestFirst ? 'ASC' : 'DESC')}
        hitSlop={6}
        className="flex-row items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 active:opacity-70"
      >
        <Ionicons
          name={newestFirst ? 'arrow-down' : 'arrow-up'}
          size={12}
          color="#7A7A8A"
        />
        <Text className="text-xs font-semibold text-gray-600">
          {newestFirst ? 'Nuevos' : 'Antiguos'}
        </Text>
      </Pressable>
    </View>
  );
}
