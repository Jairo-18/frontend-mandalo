import { http } from '@/lib/http';
import { filePart } from '@/lib/upload';
import { DeliveryPhotos } from '@/services/auth';

type CatalogRef = { id: number; code: string; name: string };

/** Perfil propio tal como lo devuelve `GET /user/me` (con relaciones). */
export type MyProfile = {
  id: string;
  fullName: string;
  username: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  departmentId: number | null;
  municipalityId: number | null;
  identificationNumber: string | null;
  identificationTypeId: number | null;
  identificationType?: CatalogRef | null;
  /** Si tiene valor, la cuenta ya está vinculada con Google. */
  googleId: string | null;
  avatarUrl: string | null;
  isEmailVerified: boolean;
};

export type MyProfilePayload = {
  fullName?: string;
  phone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  departmentId?: number;
  municipalityId?: number;
  identificationNumber?: string;
  identificationTypeId?: number;
};

/**
 * Perfil del usuario autenticado (pantalla "Mi perfil" del panel del cliente).
 * Todos los endpoints son self-scoped por el JWT — nunca viaja un userId.
 */
export const profileService = {
  getMe: () => http<{ data: MyProfile }>('/user/me', { auth: true }),

  updateMe: (payload: MyProfilePayload) =>
    http<{ message?: string }>('/user/me', {
      method: 'PATCH',
      body: payload,
      auth: true,
      toastSuccess: true,
    }),

  uploadAvatar: (uri: string) => {
    const form = new FormData();
    form.append('file', filePart(uri));
    return http<{ data: { avatarUrl: string } }>('/user/me/avatar', {
      method: 'POST',
      body: form,
      auth: true,
    });
  },

  changePassword: (currentPassword: string, newPassword: string) =>
    http<{ message?: string }>('/user/me/password', {
      method: 'PATCH',
      body: { currentPassword, newPassword },
      auth: true,
      toastSuccess: true,
    }),

  /** Vincula la cuenta de Google (idToken del sign-in nativo) a esta cuenta. */
  linkGoogle: (idToken: string) =>
    http<{ message?: string }>('/auth/link-google', {
      method: 'POST',
      body: { idToken },
      auth: true,
      toastSuccess: true,
    }),

  /** Quita el vínculo con Google (queda el acceso por correo + contraseña). */
  unlinkGoogle: () =>
    http<{ message?: string }>('/auth/unlink-google', {
      method: 'POST',
      auth: true,
      toastSuccess: true,
    }),

  /**
   * Onboarding post-Google: convierte la cuenta en repartidor (multipart con
   * identificación + fotos de verificación). La cuenta queda inactiva hasta
   * que un admin la revise.
   */
  becomeDelivery: (
    payload: { identificationNumber: string; identificationTypeId: number },
    photos: DeliveryPhotos,
  ) => {
    const form = new FormData();
    form.append('identificationNumber', payload.identificationNumber);
    form.append('identificationTypeId', String(payload.identificationTypeId));
    form.append('avatar', filePart(photos.avatar), 'avatar.jpg');
    form.append('idFront', filePart(photos.idFront), 'id-front.jpg');
    form.append('idBack', filePart(photos.idBack), 'id-back.jpg');
    return http<{ message?: string }>('/user/me/become-delivery', {
      method: 'POST',
      body: form,
      auth: true,
      toastSuccess: true,
    });
  },
};
