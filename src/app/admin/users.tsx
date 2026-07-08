import { UserCrudScreen } from '@/components/admin/user-crud-screen';

/** Cuentas de la app que NO son repartidores: clientes, negocios y admins. */
export default function UsersScreen() {
  return (
    <UserCrudScreen
      roleCodes={['USER', 'NEGO', 'ADMIN']}
      createRoleCode="USER"
      entityName="usuario"
      entityNamePlural="usuarios"
    />
  );
}
