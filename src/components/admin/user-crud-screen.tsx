import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { UserFormModal } from '@/components/admin/user-form-modal';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Fab } from '@/components/ui/fab';
import { FilterChips, FilterChipOption } from '@/components/ui/filter-chips';
import { ListEmpty } from '@/components/ui/list-empty';
import { Paginator } from '@/components/ui/paginator';
import { SearchBar } from '@/components/ui/search-bar';
import { YesNoDialog } from '@/components/ui/yes-no-dialog';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import {
  AdminUser,
  adminUsersService,
  RoleCode,
  UserSearchField,
} from '@/services/admin-users';

/** Campos por los que puede buscar el admin. */
const SEARCH_FIELDS: FilterChipOption<UserSearchField>[] = [
  { value: 'search', label: 'Todos' },
  { value: 'fullName', label: 'Nombre' },
  { value: 'email', label: 'Correo' },
  { value: 'phone', label: 'Celular' },
  { value: 'username', label: 'Usuario' },
  { value: 'identificationNumber', label: 'Identificación' },
];

/** Filtro por estado de la cuenta (chips bajo el buscador). */
type AccountFilter = 'all' | 'active' | 'inactive' | 'banned' | 'unverified';

const ACCOUNT_FILTERS: FilterChipOption<AccountFilter>[] = [
  { value: 'all', label: 'Todas' },
  { value: 'active', label: 'Activas' },
  { value: 'inactive', label: 'Inactivas' },
  { value: 'banned', label: 'Baneadas' },
  { value: 'unverified', label: 'Sin verificar' },
];

/** Params del backend que aplica cada filtro de estado. */
const ACCOUNT_FILTER_PARAMS: Record<
  AccountFilter,
  { isActive?: boolean; isBanned?: boolean; isEmailVerified?: boolean }
> = {
  all: {},
  active: { isActive: true },
  inactive: { isActive: false },
  banned: { isBanned: true },
  unverified: { isEmailVerified: false },
};

type Props = {
  /** Roles que lista esta pantalla (Usuarios = USER+NEGO+ADMIN, Repartidores = DELI). */
  roleCodes: RoleCode[];
  /** Rol con el que se crean las cuentas nuevas desde esta pantalla. */
  createRoleCode: 'USER' | 'DELI';
  /** Nombre en singular para los textos ("usuario", "repartidor"). */
  entityName: string;
  /** Nombre en plural para el contador ("usuarios", "repartidores"). */
  entityNamePlural: string;
};

/**
 * CRUD de cuentas por rol para el panel admin: listado paginado con búsqueda
 * por campo, crear/editar en modal y eliminar con confirmación. Se reutiliza
 * para Usuarios y Repartidores.
 */
export function UserCrudScreen({
  roleCodes,
  createRoleCode,
  entityName,
  entityNamePlural,
}: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [searchField, setSearchField] = useState<UserSearchField>('search');
  const [accountFilter, setAccountFilter] = useState<AccountFilter>('all');

  const list = usePaginatedList<AdminUser>(
    useCallback(
      (params) =>
        adminUsersService.paginated({
          ...params,
          roleTypeCodes: roleCodes,
          searchField,
          ...ACCOUNT_FILTER_PARAMS[accountFilter],
        }),
      [roleCodes, searchField, accountFilter],
    ),
  );

  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [toDelete, setToDelete] = useState<AdminUser | null>(null);
  // Activación rápida de repartidores pendientes (sin abrir el form).
  const [toActivate, setToActivate] = useState<AdminUser | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  // Con más de un rol en pantalla, cada tarjeta muestra el suyo.
  const showRoleBadge = roleCodes.length > 1;

  function openCreate() {
    setEditing(null);
    setFormVisible(true);
  }

  function openEdit(item: AdminUser) {
    setEditing(item);
    setFormVisible(true);
  }

  function handleSaved() {
    setFormVisible(false);
    list.reload();
  }

  async function handleDelete() {
    if (!toDelete) return;
    try {
      await adminUsersService.remove(toDelete.id);
      list.reload();
    } catch {
      // El interceptor HTTP ya mostró el error.
    } finally {
      setToDelete(null);
    }
  }

  /** Activa la cuenta de un repartidor pendiente directo desde la tarjeta. */
  async function handleActivate() {
    if (!toActivate) return;
    try {
      setActivatingId(toActivate.id);
      await adminUsersService.update(toActivate.id, { isActive: true });
      list.reload();
    } catch {
      // El interceptor HTTP ya mostró el error.
    } finally {
      setActivatingId(null);
      setToActivate(null);
    }
  }

  function renderItem({ item }: { item: AdminUser }) {
    const location = [item.municipality?.name, item.department?.name]
      .filter(Boolean)
      .join(', ');

    return (
      <View className="mb-3 rounded-2xl bg-white p-4">
        <View className="flex-row items-center gap-3">
          <Avatar uri={item.avatarUrl} label={item.fullName} />

          <View className="flex-1">
            <Text numberOfLines={1} className="text-[15px] font-bold text-dark">
              {item.fullName}
            </Text>
            <Text numberOfLines={1} className="text-xs text-muted">
              {item.email}
            </Text>
            {(item.phone || location) && (
              <Text numberOfLines={1} className="text-xs text-muted">
                {[item.phone, location].filter(Boolean).join(' · ')}
              </Text>
            )}
          </View>

          {createRoleCode === 'DELI' && (
            <Pressable
              onPress={() =>
                router.navigate({
                  pathname: '/admin/delivery-billing',
                  params: { userId: item.id, name: item.fullName },
                })
              }
              hitSlop={8}
              className="h-9 w-9 items-center justify-center rounded-full bg-primary-tint active:opacity-70"
            >
              <Ionicons name="cash-outline" size={17} color="#FF5A3C" />
            </Pressable>
          )}
          <Pressable
            onPress={() => openEdit(item)}
            hitSlop={8}
            className="h-9 w-9 items-center justify-center rounded-full bg-surface active:opacity-70"
          >
            <Ionicons name="pencil-outline" size={17} color="#1E1E2D" />
          </Pressable>
          <Pressable
            onPress={() => setToDelete(item)}
            hitSlop={8}
            className="h-9 w-9 items-center justify-center rounded-full bg-red-50 active:opacity-70"
          >
            <Ionicons name="trash-outline" size={17} color="#DC2626" />
          </Pressable>
        </View>

        <View className="mt-3 flex-row flex-wrap gap-1.5">
          {showRoleBadge && item.roleType?.name && (
            <Badge label={item.roleType.name} tone="primary" />
          )}
          <Badge
            label={item.isActive ? 'Activo' : 'Inactivo'}
            tone={item.isActive ? 'green' : 'gray'}
          />
          {item.isBanned && <Badge label="Baneado" tone="red" />}
          {!item.isEmailVerified && <Badge label="Sin verificar" tone="amber" />}
        </View>

        {/* Repartidor pendiente de revisión: activar sin abrir el form. */}
        {createRoleCode === 'DELI' && !item.isActive && !item.isBanned && (
          <Pressable
            onPress={() => setToActivate(item)}
            disabled={activatingId === item.id}
            className="mt-3 h-10 flex-row items-center justify-center gap-1.5 rounded-xl bg-emerald-600 active:opacity-80"
          >
            {activatingId === item.id ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" />
                <Text className="text-sm font-bold text-white">
                  Activar cuenta
                </Text>
              </>
            )}
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Búsqueda por campo + contador */}
      <View className="px-4 pb-1 pt-3">
        <SearchBar
          value={list.search}
          onChangeText={list.setSearch}
          placeholder={`Buscar ${entityNamePlural}…`}
        />

        <View className="mt-2">
          <FilterChips
            options={SEARCH_FIELDS}
            value={searchField}
            onChange={setSearchField}
          />
        </View>

        {/* Estado de la cuenta (Repartidores: "Inactivas" = pendientes de activar) */}
        <View className="mt-1.5">
          <FilterChips
            options={ACCOUNT_FILTERS}
            value={accountFilter}
            onChange={setAccountFilter}
          />
        </View>

        {!list.loading && list.meta && (
          <Text className="mt-1.5 text-xs font-medium text-muted">
            {list.meta.total}{' '}
            {list.meta.total === 1 ? entityName : entityNamePlural}
          </Text>
        )}
      </View>

      {list.loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF5A3C" />
        </View>
      ) : (
        <FlatList
          data={list.items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 96,
          }}
          refreshing={list.refreshing}
          onRefresh={() => list.fetchPage(list.meta?.page ?? 1, 'refresh')}
          ListEmptyComponent={
            <ListEmpty
              icon="people-outline"
              message={
                list.query
                  ? `No hay ${entityNamePlural} que coincidan con la búsqueda.`
                  : `Aún no hay ${entityNamePlural} registrados.`
              }
            />
          }
        />
      )}

      {/* Paginador */}
      <View style={{ paddingBottom: insets.bottom }} className="bg-white">
        <Paginator
          pagination={list.meta}
          disabled={list.loading || list.refreshing}
          onPageChange={(page) => list.fetchPage(page, 'page')}
          onPerPageChange={list.setPerPage}
        />
      </View>

      <Fab onPress={openCreate} />

      <UserFormModal
        visible={formVisible}
        roleCode={createRoleCode}
        entityName={entityName}
        editing={editing}
        onClose={() => setFormVisible(false)}
        onSaved={handleSaved}
      />

      <YesNoDialog
        visible={!!toActivate}
        icon="checkmark-circle-outline"
        title="¿Activar esta cuenta?"
        message={`${toActivate?.fullName ?? 'El domiciliario'} podrá empezar a tomar pedidos. Revisa antes sus documentos (editar → fotos).`}
        confirmLabel="Sí, activar"
        cancelLabel="No"
        onConfirm={handleActivate}
        onCancel={() => setToActivate(null)}
      />

      <YesNoDialog
        visible={!!toDelete}
        destructive
        title={`¿Eliminar ${entityName}?`}
        message={`Se eliminará a "${toDelete?.fullName}". Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </View>
  );
}
