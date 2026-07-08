import { UserCrudScreen } from '@/components/admin/user-crud-screen';

/** Repartidores (rol DELI). */
export default function DeliveriesScreen() {
  return (
    <UserCrudScreen
      roleCodes={['DELI']}
      createRoleCode="DELI"
      entityName="repartidor"
      entityNamePlural="repartidores"
    />
  );
}
