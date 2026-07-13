import { MenuButton } from '@/components/client/menu-button';
import { ProfileScreen } from '@/components/profile/profile-screen';

/** Mi perfil del CLIENTE (la pantalla compartida vive en components/profile). */
export default function ClientProfileRoute() {
  return (
    <ProfileScreen menu={<MenuButton />} changePasswordHref="/change-password" />
  );
}
