import { UserCrudScreen } from '@/components/admin/user-crud-screen';

/** Cuentas de la app que NO son repartidores: clientes, negocios, admins y superadmin. */
export default function UsersScreen() {
  return (
    <UserCrudScreen
      roleCodes={['USER', 'NEGO', 'ADMIN', 'SUPERADMIN']}
      createRoleCode="USER"
      entityName="usuario"
      entityNamePlural="usuarios"
    />
  );
}
