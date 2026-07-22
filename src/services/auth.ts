import { http } from '@/lib/http';
import { appendDocument, DocumentValue, filePart } from '@/lib/upload';

export type Tokens = { accessToken: string; refreshToken: string };
export type AuthRole = { id: string; code: string; name: string };
export type AuthUser = {
  id: string;
  fullName: string;
  roleTypeId?: string;
  /** Rol plano que devuelve el backend; `code` decide la navegación (ADMIN → panel). */
  role?: AuthRole | null;
  avatarUrl?: string | null;
  /** false en un DELI recién registrado: cuenta en proceso de habilitación. */
  isActive?: boolean;
  /** Nota del admin para el usuario (p. ej. por qué no se activa su cuenta). */
  observations?: string | null;
  /** Cuándo aceptó Términos/Tratamiento de Datos (ISO) o null si nunca. */
  termsAcceptedAt?: string | null;
};

/**
 * Fotos/documentos de verificación obligatorios del registro de repartidor.
 * `soat`/`technicalInspection` pueden ser foto o PDF (certificado de una sola
 * página); el resto son siempre fotos (rostro, cédula, licencia).
 */
export type DeliveryPhotos = {
  avatar: string;
  idFront: string;
  idBack: string;
  licenseFront: string;
  licenseBack: string;
  soat: DocumentValue;
  technicalInspection: DocumentValue;
};

export type RegisterPayload = {
  fullName: string;
  email: string;
  password: string;
  username?: string;
  phone?: string;
  departmentId?: number;
  municipalityId?: number;
  address?: string;
  /** Referencia específica (apto/torre/portón) — solo cliente. */
  details?: string;
  latitude?: number;
  longitude?: number;
  identificationNumber?: string;
  identificationTypeId?: number;
  vehiclePlate?: string;
  acceptedTerms: boolean;
};

/** Capa de acceso al API de autenticación / registro. */
export const authService = {
  signIn: (email: string, password: string) =>
    http<{
      data: { tokens: Tokens; user: AuthUser; accessSessionId?: string };
    }>('/auth/sign-in', {
      method: 'POST',
      body: { email, password },
      toastSuccess: true,
    }),

  /**
   * Registra la aceptación de Términos/Tratamiento de Datos del usuario
   * autenticado (gate de inicio de sesión). Si es dueño de un negocio, el
   * backend marca también la aceptación del negocio.
   */
  acceptTerms: () =>
    http<{ message?: string }>('/user/me/accept-terms', {
      method: 'POST',
      auth: true,
      toastSuccess: true,
    }),

  registerClient: (payload: RegisterPayload) =>
    http<{ data: { rowId: string } }>('/user/register/client', {
      method: 'POST',
      body: payload,
      toastSuccess: true,
    }),

  /**
   * Registro de repartidor: multipart con los datos + los documentos de
   * verificación (rostro, cédula, licencia, SOAT y tecnomecánica). La cuenta
   * nace inactiva hasta que un admin revise los documentos.
   */
  registerDelivery: async (payload: RegisterPayload, photos: DeliveryPhotos) => {
    const form = new FormData();
    for (const [key, value] of Object.entries(payload)) {
      if (value !== undefined && value !== null) form.append(key, String(value));
    }
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

    return http<{ data: { rowId: string } }>('/user/register/delivery', {
      method: 'POST',
      body: form,
      toastSuccess: true,
    });
  },

  /**
   * Autenticación con Google: manda el idToken del Google Sign-In nativo.
   * `role` define el rol si la cuenta se crea en ese momento (default client).
   */
  signInWithGoogle: (idToken: string, role?: 'client' | 'delivery') =>
    http<{
      data: {
        tokens: Tokens;
        user: AuthUser & { isNewUser?: boolean };
        accessSessionId?: string;
      };
    }>('/auth/google', {
      method: 'POST',
      body: { idToken, ...(role ? { role } : {}) },
      toastSuccess: true,
    }),

  /**
   * Renueva los tokens con el refresh token guardado (restauración de sesión
   * al abrir la app). Sin toast de error: el arranque decide qué hacer si falla.
   */
  refreshToken: (refreshToken: string) =>
    http<{ data: { tokens: Tokens; user: AuthUser } }>('/auth/refresh-token', {
      method: 'POST',
      body: { refreshToken },
      toastError: false,
    }),

  /** Paso 1 de recuperar contraseña: envía el código de 6 dígitos al correo. */
  forgotPassword: (email: string) =>
    http<{ message?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: { email },
      toastSuccess: true,
    }),

  /** Reenvía el correo de verificación (botón del login tras el 401). */
  resendVerification: (email: string) =>
    http<{ message?: string }>('/user/resend-verification', {
      method: 'POST',
      body: { email },
      toastSuccess: true,
    }),

  /** Paso 2: valida el código y cambia la contraseña. */
  resetPassword: (email: string, code: string, newPassword: string) =>
    http<{ message?: string }>('/auth/reset-password', {
      method: 'POST',
      body: { email, code, newPassword },
      toastSuccess: true,
    }),

  signOut: (body: {
    userId: string;
    accessToken: string;
    accessSessionId: string;
  }) =>
    http<{ message?: string }>('/auth/sign-out', {
      method: 'POST',
      body,
      token: body.accessToken,
      toastSuccess: true,
    }),
};
