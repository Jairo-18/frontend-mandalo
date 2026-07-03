import { apiUrl } from '@/constants/api';

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
  identificationNumber?: string;
  identificationTypeId?: number;
};

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(apiUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const raw = data?.message ?? 'Ocurrió un error inesperado';
    throw new Error(Array.isArray(raw) ? raw.join('\n') : String(raw));
  }
  return data as T;
}

/** Capa de acceso al API de autenticación / registro (estilo "service"). */
export const authService = {
  signIn: (email: string, password: string) =>
    postJson<{
      data: { tokens: Tokens; user: AuthUser; accessSessionId?: string };
    }>('/auth/sign-in', { email, password }),

  registerClient: (payload: RegisterPayload) =>
    postJson<{ data: { rowId: string } }>('/user/register/client', payload),

  registerDelivery: (payload: RegisterPayload) =>
    postJson<{ data: { rowId: string } }>('/user/register/delivery', payload),
};
