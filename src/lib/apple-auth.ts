import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

import { HttpError } from '@/lib/http';
import { setSession } from '@/lib/session';
import { toast } from '@/lib/toast';
import { authService } from '@/services/auth';

/**
 * Sign in with Apple solo existe en iOS 13+. En Android/web el botón ni
 * siquiera se muestra (ver `useAppleAuthAvailable`), pero se verifica igual
 * antes de llamar al módulo nativo.
 */
export function isApplePlatform(): boolean {
  return Platform.OS === 'ios';
}

export type AppleSignInResult = {
  ok: boolean;
  /**
   * La cuenta se CREÓ en este sign-in: falta completar el registro (rol +
   * datos). La pantalla debe llevar a /auth/complete-registration.
   */
  isNewUser: boolean;
};

/**
 * Apple entrega el nombre DESGLOSADO y SOLO la primera vez que el usuario
 * autoriza la app; en los siguientes sign-in llega `null`. Por eso se manda
 * al backend cuando existe, y el backend conserva el que ya tenía si no viene.
 */
function joinFullName(
  fullName: AppleAuthentication.AppleAuthenticationFullName | null,
): string | undefined {
  if (!fullName) return undefined;
  const parts = [fullName.givenName, fullName.familyName].filter(Boolean);
  return parts.length ? parts.join(' ') : undefined;
}

/**
 * Paso nativo del flujo Apple: abre la hoja del sistema y devuelve el
 * identityToken + el nombre (o `null` si el usuario canceló o hubo error —
 * el toast ya salió acá). Lo usan el sign-in y el "Vincular con Apple".
 */
export async function getAppleCredential(): Promise<{
  identityToken: string;
  fullName?: string;
} | null> {
  if (!isApplePlatform()) {
    toast.error('El inicio de sesión con Apple solo está disponible en iOS.');
    return null;
  }

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      toast.error('Apple no devolvió las credenciales esperadas.');
      return null;
    }

    return {
      identityToken: credential.identityToken,
      fullName: joinFullName(credential.fullName),
    };
  } catch (e) {
    // El usuario cerró la hoja del sistema: no es un error que mostrar.
    if ((e as { code?: string })?.code === 'ERR_REQUEST_CANCELED') {
      return null;
    }
    console.error('[apple-auth] signInAsync falló:', e);
    toast.error('No se pudo conectar con Apple. Intenta de nuevo.');
    return null;
  }
}

/**
 * Flujo completo de autenticación con Apple: abre el Sign in with Apple
 * nativo, manda el identityToken al backend (`POST /auth/apple`) y guarda la
 * sesión. Si la cuenta es NUEVA queda marcada con `needsOnboarding`.
 *
 * `role` solo aplica cuando la cuenta NO existe todavía: define con qué rol
 * se crea (cliente por defecto, repartidor desde su pantalla de registro).
 */
export async function signInWithApple(
  role?: 'client' | 'delivery',
): Promise<AppleSignInResult> {
  const credential = await getAppleCredential();
  if (!credential) return { ok: false, isNewUser: false };

  try {
    const res = await authService.signInWithApple(
      credential.identityToken,
      credential.fullName,
      role,
    );
    const { tokens, user, accessSessionId } = res.data;
    const isNewUser = !!user.isNewUser;
    await setSession({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      accessSessionId,
      user,
      ...(isNewUser ? { needsOnboarding: true } : {}),
    });
    return { ok: true, isNewUser };
  } catch (e) {
    if (!(e instanceof HttpError)) {
      toast.error('No se pudo iniciar sesión con Apple.');
    }
    // Si es HttpError, el interceptor ya mostró el mensaje del backend.
    return { ok: false, isNewUser: false };
  }
}
