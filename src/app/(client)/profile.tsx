import { ProfileScreen } from '@/components/profile/profile-screen';

/** Mi perfil del CLIENTE (la pantalla compartida vive en components/profile). */
export default function ClientProfileRoute() {
  return <ProfileScreen changePasswordHref="/change-password" />;
}
