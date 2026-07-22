import { Ionicons } from '@expo/vector-icons';
import { ReactNode, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BusinessFormModal } from '@/components/admin/business-form-modal';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useMyBusiness } from '@/hooks/use-my-business';
import { refreshMyBusiness } from '@/lib/my-business';
import { formatHour12, formatText } from '@/lib/text-format';

/** Nombres cortos de los días (0 = domingo), para mostrar el horario. */
const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/** "1,2,3" → "Lun, Mar, Mié" · vacío/null = todos los días. */
function formatOpenDays(openDays: string | null): string {
  if (!openDays?.trim()) return 'Todos los días';
  const days = openDays
    .split(',')
    .map((d) => Number(d.trim()))
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
    .sort((a, b) => a - b);
  if (days.length === 7 || days.length === 0) return 'Todos los días';
  return days.map((d) => DAY_NAMES[d]).join(', ');
}

/**
 * Pantalla "Mi negocio" (rol NEGO): resumen de solo lectura del negocio +
 * botón "Editar mi negocio" que abre el formulario (mismo `BusinessFormModal`
 * en modo `selfBusiness`). Espejo de "Mi perfil" del cliente/repartidor. Al
 * guardar refresca el store compartido (cabecera del drawer + esta pantalla).
 */
export function BusinessProfileScreen() {
  const insets = useSafeAreaInsets();
  const business = useMyBusiness();
  const [loading, setLoading] = useState(!business);
  const [refreshing, setRefreshing] = useState(false);
  const [formVisible, setFormVisible] = useState(false);

  useEffect(() => {
    refreshMyBusiness().finally(() => setLoading(false));
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await refreshMyBusiness();
    setRefreshing(false);
  }

  function handleSaved() {
    setFormVisible(false);
    refreshMyBusiness();
  }

  if (loading && !business) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color="#FF5A3C" />
      </View>
    );
  }

  if (!business) {
    return (
      <View className="flex-1 items-center justify-center bg-surface px-8">
        <Ionicons name="storefront-outline" size={48} color="#7A7A8A" />
        <Text className="mt-3 text-center text-[15px] text-muted">
          Tu cuenta aún no tiene un negocio asociado. Contacta al administrador.
        </Text>
      </View>
    );
  }

  const idType = business.identificationType?.name;
  const idNumber = business.identificationNumber;
  const hasSchedule = !!business.openTime && !!business.closeTime;
  const hasPayment =
    !!business.paymentHolderName ||
    !!business.nequiNumber ||
    !!business.bancolombiaAccount ||
    !!business.bancolombiaQrUrl;

  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#FF5A3C"
        />
      }
    >
      {/* Cabecera con el logo y el nombre del negocio */}
      <View className="items-center rounded-b-[28px] bg-dark px-5 pb-7 pt-2">
        <Avatar
          uri={business.logoUrl}
          icon="storefront"
          shape="rounded"
          tone="solid"
          size={84}
        />
        <Text className="mt-3 text-center text-xl font-extrabold text-white">
          {business.tradeName || business.legalName}
        </Text>
        {!!business.tradeName && (
          <Text className="mt-0.5 text-center text-xs text-white/60">
            {business.legalName}
          </Text>
        )}
        <View className="mt-3 flex-row flex-wrap justify-center gap-2">
          <StatusBadge
            ok={business.isActive}
            okText="Activo"
            offText="Inactivo"
          />
          {business.temporarilyClosed && (
            <View className="rounded-full bg-amber-500/20 px-3 py-1">
              <Text className="text-[11px] font-bold text-amber-300">
                Cerrado temporalmente
              </Text>
            </View>
          )}
        </View>
      </View>

      <View className="px-5">
        <View className="mt-5">
          <Button
            label="Editar mi negocio"
            onPress={() => setFormVisible(true)}
          />
        </View>

        {/* Datos del negocio */}
        <SectionLabel label="Datos del negocio" />
        <Card>
          <InfoRow icon="business-outline" label="Razón social">
            {business.legalName}
          </InfoRow>
          <InfoRow icon="card-outline" label="Identificación">
            {idNumber ? `${idType ? `${idType} · ` : ''}${idNumber}` : '—'}
          </InfoRow>
          <InfoRow icon="document-text-outline" label="Descripción">
            {business.description || '—'}
          </InfoRow>
          <InfoRow icon="call-outline" label="Teléfono" last>
            {business.phone ? formatText('phone', business.phone) : '—'}
          </InfoRow>
        </Card>

        {/* Ubicación */}
        <SectionLabel label="Ubicación" />
        <Card>
          <InfoRow icon="map-outline" label="Departamento">
            {business.department?.name || '—'}
          </InfoRow>
          <InfoRow icon="location-outline" label="Municipio">
            {business.municipality?.name || '—'}
          </InfoRow>
          <InfoRow icon="home-outline" label="Dirección">
            {business.address || '—'}
          </InfoRow>
          <InfoRow icon="navigate-outline" label="Ubicación exacta" last>
            {business.latitude != null && business.longitude != null
              ? 'Asignada por el administrador'
              : 'Sin asignar'}
          </InfoRow>
        </Card>

        {/* Horario */}
        <SectionLabel label="Horario de atención" />
        <Card>
          <InfoRow icon="time-outline" label="Horas">
            {hasSchedule
              ? `${formatHour12(business.openTime!)} – ${formatHour12(business.closeTime!)}`
              : 'Siempre abierto'}
          </InfoRow>
          <InfoRow icon="calendar-outline" label="Días que abre" last>
            {formatOpenDays(business.openDays)}
          </InfoRow>
        </Card>

        {/* Etiquetas */}
        <SectionLabel label="Etiquetas" />
        <Card>
          {business.tags.length > 0 ? (
            <View className="flex-row flex-wrap gap-2">
              {business.tags.map((tag) => (
                <View
                  key={tag.id}
                  className="rounded-full border border-primary bg-primary-tint px-3.5 py-2"
                >
                  <Text className="text-[13px] font-semibold text-primary">
                    {tag.name}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-[14px] text-muted">
              El administrador aún no te asignó etiquetas.
            </Text>
          )}
        </Card>

        {/* Datos de pago */}
        <SectionLabel label="Datos de pago" />
        <Card>
          {hasPayment ? (
            <>
              <InfoRow icon="person-outline" label="Titular">
                {business.paymentHolderName || '—'}
              </InfoRow>
              <InfoRow icon="phone-portrait-outline" label="Nequi">
                {business.nequiNumber || '—'}
              </InfoRow>
              <InfoRow icon="business-outline" label="Bancolombia" last>
                {business.bancolombiaAccount ||
                  (business.bancolombiaQrUrl ? 'QR disponible' : '—')}
              </InfoRow>
            </>
          ) : (
            <Text className="text-[14px] text-muted">
              Sin datos de pago: los clientes solo podrán pagar en efectivo.
            </Text>
          )}
        </Card>
      </View>

      <BusinessFormModal
        visible={formVisible}
        editing={business}
        selfBusiness
        onClose={() => setFormVisible(false)}
        onSaved={handleSaved}
      />
    </ScrollView>
  );
}

/** Título de sección alineado a las cards (el parent ya aplica px-5). */
function SectionLabel({ label }: { label: string }) {
  return (
    <View className="mb-2 mt-6 flex-row items-center gap-2">
      <View className="h-4 w-1.5 rounded-full bg-primary" />
      <Text className="text-base font-extrabold text-dark">{label}</Text>
    </View>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <View className="rounded-2xl bg-white p-4">{children}</View>;
}

function InfoRow({
  icon,
  label,
  children,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  children: ReactNode;
  last?: boolean;
}) {
  return (
    <View
      className={`flex-row items-start gap-3 ${
        last ? '' : 'mb-3 border-b border-gray-100 pb-3'
      }`}
    >
      <Ionicons name={icon} size={20} color="#7A7A8A" style={{ marginTop: 2 }} />
      <View className="flex-1">
        <Text className="text-[11px] font-bold uppercase tracking-wide text-muted">
          {label}
        </Text>
        <Text className="text-[14px] font-medium text-dark">{children}</Text>
      </View>
    </View>
  );
}

function StatusBadge({
  ok,
  okText,
  offText,
}: {
  ok: boolean;
  okText: string;
  offText: string;
}) {
  return (
    <View
      className={`rounded-full px-3 py-1 ${ok ? 'bg-green-500/20' : 'bg-white/15'}`}
    >
      <Text
        className={`text-[11px] font-bold ${ok ? 'text-green-300' : 'text-white/70'}`}
      >
        {ok ? okText : offText}
      </Text>
    </View>
  );
}
