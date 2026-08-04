import { Ionicons } from '@expo/vector-icons';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { SettlementPeriodCard } from '@/components/admin/settlement-period-card';
import { ListEmpty } from '@/components/ui/list-empty';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useSettlementDrillDown } from '@/hooks/use-settlement-drilldown';
import { formatPrice } from '@/lib/price';
import { myBusinessSettlementsService, SettlementPeriod } from '@/services/admin-settlements';
import { getAppColors } from '@/lib/app-colors';

const SUBPERIOD_LABEL = { year: 'meses', month: 'quincenas' } as const;

/**
 * "Mis pagos" del negocio (§42): año → mes → quincena, SOLO LECTURA — lo que
 * ya vendió y cuánto de eso ya le PAGÓ a Mándalo (el negocio nos paga la
 * comisión). Espejo de `admin/billing.tsx` pero self-scoped y sin botón de
 * marcar (el admin es quien marca el cobro, acá el negocio solo consulta).
 */
export default function BusinessEarningsScreen() {
  const insets = useSafeAreaInsets();

  const fetcher = useCallback(async (periodType: 'quincena' | 'month' | 'year') => {
    const res = await myBusinessSettlementsService.periods(periodType);
    return res.data.periods;
  }, []);
  const dd = useSettlementDrillDown<SettlementPeriod>(fetcher);

  return (
    <View className="flex-1 bg-surface">
      {/* Continúa el header de degradado del drawer (mismo patrón que dashboard/products). */}
      <LinearGradient
        colors={[getAppColors().primaryColor, getAppColors().darkColor]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}
      >
      <View className="flex-row items-center gap-3 px-5 pb-5 pt-1">
        {dd.level !== 'year' && (
          <Pressable
            onPress={dd.goBack}
            hitSlop={8}
            className="h-9 w-9 items-center justify-center rounded-full bg-white/10 active:opacity-70"
          >
            <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
          </Pressable>
        )}
        <View className="flex-1">
          <Text className="text-lg font-extrabold text-white">Mis pagos</Text>
          <Text className="text-xs text-white/70">
            {dd.level === 'year'
              ? 'Lo que vendiste y lo que ya le pagaste a Mandalo, por año'
              : dd.level === 'month'
                ? `${dd.year} · por mes`
                : `${dd.month} · quincenas`}
          </Text>
        </View>
        <ThemeToggle
          className="h-10 w-10 items-center justify-center rounded-full bg-white/15 active:opacity-70"
          iconColor="#FFFFFF"
        />
      </View>
      </LinearGradient>

      {dd.loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={getAppColors().primaryColor} />
        </View>
      ) : (
        <FlatList
          data={dd.items}
          keyExtractor={(item) => item.periodStart}
          renderItem={({ item }) => (
            <SettlementPeriodCard
              periodType={item.periodType}
              periodStart={item.periodStart}
              periodEnd={item.periodEnd}
              ordersCount={item.ordersCount}
              primaryLabel="Vendiste"
              primaryValue={formatPrice(item.salesTotal)}
              secondaryLabel={`Comisión (${item.commissionRate}%)`}
              secondaryValue={formatPrice(item.commissionTotal)}
              tertiaryLabel="Tarifa de servicio a devolver"
              tertiaryValue={formatPrice(item.serviceFeeTotal)}
              isPaid={item.settlement?.isPaid}
              paidLabel="Pagado"
              pendingLabel="Pendiente"
              paidSubperiods={item.paidSubperiods}
              totalSubperiods={item.totalSubperiods}
              subperiodsLabel={dd.level === 'month' ? SUBPERIOD_LABEL.month : SUBPERIOD_LABEL.year}
              onPress={() => item.periodType !== 'quincena' && dd.drillInto(item.periodStart)}
            />
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
          ListEmptyComponent={
            <ListEmpty icon="cash-outline" message="Aún no tienes pedidos entregados." />
          }
        />
      )}
    </View>
  );
}
