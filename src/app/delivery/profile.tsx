import { MenuButton } from '@/components/client/menu-button';
import { ProfileScreen } from '@/components/profile/profile-screen';

/** Mi perfil del REPARTIDOR (la pantalla compartida vive en components/profile). */
export default function DeliveryProfileRoute() {
  return (
    <ProfileScreen
      menu={<MenuButton parent="/delivery" />}
      changePasswordHref="/delivery/change-password"
      resendDocumentsHref="/delivery/resend-documents"
    />
  );
}
