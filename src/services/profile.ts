import { http } from '@/lib/http';
import { appendDocument, DocumentValue, filePart } from '@/lib/upload';
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
  /** Solo repartidor: false = cuenta en proceso de habilitación. */
  isActive: boolean;
  /** Nota del admin (por qué no se activa la cuenta, qué documento corregir). */
  observations: string | null;
  /** Documentos del repartidor (§17/§40): identidad, vehículo y sus papeles. */
  identificationFrontUrl: string | null;
  identificationBackUrl: string | null;
  vehiclePlate: string | null;
  licenseFrontUrl: string | null;
  licenseBackUrl: string | null;
  soatUrl: string | null;
  technicalInspectionUrl: string | null;
  /** Cuándo/qué versión aceptó Términos y Tratamiento de Datos (null = nunca). */
  termsAcceptedAt: string | null;
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
  /** Onboarding post-Google (cliente): solo `true` tiene efecto. */
  acceptedTerms?: boolean;
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

  uploadAvatar: async (uri: string) => {
    const form = new FormData();
    form.append('file', await filePart(uri));
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
   * identificación, placa y documentos de verificación). La cuenta queda
   * inactiva hasta que un admin la revise.
   */
  becomeDelivery: async (
    payload: {
      identificationNumber: string;
      identificationTypeId: number;
      vehiclePlate: string;
      acceptedTerms: boolean;
    },
    photos: DeliveryPhotos,
  ) => {
    const form = new FormData();
    form.append('identificationNumber', payload.identificationNumber);
    form.append('identificationTypeId', String(payload.identificationTypeId));
    form.append('vehiclePlate', payload.vehiclePlate);
    form.append('acceptedTerms', String(payload.acceptedTerms));
    form.append('avatar', await filePart(photos.avatar), 'avatar.jpg');
    form.append('idFront', await filePart(photos.idFront), 'id-front.jpg');
    form.append('idBack', await filePart(photos.idBack), 'id-back.jpg');
    form.append(
      'licenseFront',
      await filePart(photos.licenseFront),
      'license-front.jpg',
    );
    form.append(
      'licenseBack',
      await filePart(photos.licenseBack),
      'license-back.jpg',
    );
    await appendDocument(form, 'soat', photos.soat);
    await appendDocument(form, 'technicalInspection', photos.technicalInspection);
    return http<{ message?: string }>('/user/me/become-delivery', {
      method: 'POST',
      body: form,
      auth: true,
      toastSuccess: true,
    });
  },

  /**
   * Reenvío de documentos del repartidor: corrige lo que el admin rechazó
   * (nota en `observations`) o renueva uno vencido (SOAT, tecnomecánica,
   * licencia). Todo opcional — solo manda lo que el usuario haya cambiado.
   */
  resendDocuments: async (
    payload: { vehiclePlate?: string },
    photos: Partial<{
      avatar: string;
      idFront: string;
      idBack: string;
      licenseFront: string;
      licenseBack: string;
      soat: DocumentValue;
      technicalInspection: DocumentValue;
    }>,
  ) => {
    const form = new FormData();
    if (payload.vehiclePlate) form.append('vehiclePlate', payload.vehiclePlate);
    if (photos.avatar) {
      form.append('avatar', await filePart(photos.avatar), 'avatar.jpg');
    }
    if (photos.idFront) {
      form.append('idFront', await filePart(photos.idFront), 'id-front.jpg');
    }
    if (photos.idBack) {
      form.append('idBack', await filePart(photos.idBack), 'id-back.jpg');
    }
    if (photos.licenseFront) {
      form.append(
        'licenseFront',
        await filePart(photos.licenseFront),
        'license-front.jpg',
      );
    }
    if (photos.licenseBack) {
      form.append(
        'licenseBack',
        await filePart(photos.licenseBack),
        'license-back.jpg',
      );
    }
    if (photos.soat) await appendDocument(form, 'soat', photos.soat);
    if (photos.technicalInspection) {
      await appendDocument(form, 'technicalInspection', photos.technicalInspection);
    }
    return http<{ message?: string }>('/user/me/resend-documents', {
      method: 'POST',
      body: form,
      auth: true,
      toastSuccess: true,
    });
  },
};
