import { http } from '@/lib/http';
import { RoleCode } from '@/services/admin-users';

/** Rol permitidos para la alta masiva (nunca ADMIN). */
export type BulkInviteRole = Extract<RoleCode, 'USER' | 'NEGO' | 'DELI'>;

export type BulkInviteResult = {
  created: string[];
  skippedExisting: string[];
  failed: string[];
};

/**
 * Sube una tanda de correos (rol fijo para todos) al endpoint del admin —
 * crea las cuentas nuevas con la contraseña fija de ese rol y manda un
 * correo de bienvenida individual a cada una. Los que ya tenían cuenta se
 * omiten sin tocarlos.
 */
export async function bulkInviteUsers(
  roleTypeCode: BulkInviteRole,
  emails: string[],
): Promise<BulkInviteResult> {
  const res = await http<{ data: BulkInviteResult }>('/user/bulk-invite', {
    method: 'POST',
    auth: true,
    body: { roleTypeCode, emails },
  });
  return res.data;
}
