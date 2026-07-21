import { UserCrudScreen } from '@/components/admin/user-crud-screen';

/** Domiciliarios (rol DELI). */
export default function DeliveriesScreen() {
  return (
    <UserCrudScreen
      roleCodes={['DELI']}
      createRoleCode="DELI"
      entityName="domiciliario"
      entityNamePlural="domiciliarios"
    />
  );
}
