import { ProfileScreen } from '@/components/profile/profile-screen';

/** Mi perfil del REPARTIDOR (la pantalla compartida vive en components/profile). */
export default function DeliveryProfileRoute() {
  return (
    <ProfileScreen
      changePasswordHref="/delivery/change-password"
      resendDocumentsHref="/delivery/resend-documents"
    />
  );
}
