import { http } from '@/lib/http';

export type Tokens = { accessToken: string; refreshToken: string };
export type AuthUser = { id: string; fullName: string; roleTypeId?: string };

export type RegisterPayload = {
  fullName: string;
  email: string;
  password: string;
  username?: string;
  phone?: string;
  departmentId?: number;
  municipalityId?: number;
  address?: string;
  latitude?: number;
  longitude?: number;
  identificationNumber?: string;
  identificationTypeId?: number;
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

  registerClient: (payload: RegisterPayload) =>
    http<{ data: { rowId: string } }>('/user/register/client', {
      method: 'POST',
      body: payload,
      toastSuccess: true,
    }),

  registerDelivery: (payload: RegisterPayload) =>
    http<{ data: { rowId: string } }>('/user/register/delivery', {
      method: 'POST',
      body: payload,
      toastSuccess: true,
    }),

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

  /** Paso 1 de recuperar contraseña: envía el código de 6 dígitos al correo. */
  forgotPassword: (email: string) =>
    http<{ message?: string }>('/auth/forgot-password', {
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
