import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';

import { GOOGLE_WEB_CLIENT_ID } from '@/constants/api';
import { HttpError } from '@/lib/http';
import { setSession } from '@/lib/session';
import { toast } from '@/lib/toast';
import { authService } from '@/services/auth';

let configured = false;

function ensureConfigured() {
  if (!configured) {
    GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
    configured = true;
  }
}

/**
 * Paso nativo del flujo Google: abre el selector de cuenta y devuelve el
 * idToken (o `null` si el usuario canceló o hubo error — el toast ya salió
 * acá). Lo usan el sign-in (`signInWithGoogle`) y el "Vincular con Google"
 * del perfil (`linkGoogleAccount`).
 */
export async function getGoogleIdToken(): Promise<string | null> {
  if (!GOOGLE_WEB_CLIENT_ID) {
    toast.error('El inicio de sesión con Google no está configurado.');
    return null;
  }

  try {
    ensureConfigured();
    await GoogleSignin.hasPlayServices({
      showPlayServicesUpdateDialog: true,
    });
    // Cierra la sesión previa de Google para que siempre salga el selector
    // de cuenta (no afecta la sesión de Mándalo).
    await GoogleSignin.signOut().catch(() => {});

    const response = await GoogleSignin.signIn();
    if (response.type !== 'success') {
      return null; // el usuario canceló
    }
    if (!response.data.idToken) {
      toast.error('Google no devolvió las credenciales esperadas.');
      return null;
    }
    return response.data.idToken;
  } catch (e) {
    if (isErrorWithCode(e) && e.code === statusCodes.IN_PROGRESS) {
      return null;
    }
    if (
      isErrorWithCode(e) &&
      e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE
    ) {
      toast.error('Tu dispositivo no tiene Google Play Services disponible.');
      return null;
    }
    const code = isErrorWithCode(e) ? String(e.code) : '';
    console.error('[google-auth] GoogleSignin.signIn falló:', code, e);
    if (code === 'DEVELOPER_ERROR' || code === '10') {
      // El SHA-1 + package del APK no coincide con ningún client Android de
      // Google Cloud (o el client aún no propaga). Ver NOTAS.md §10.
      toast.error(
        'Google rechazó la configuración de la app (DEVELOPER_ERROR: SHA-1/package).',
      );
      return null;
    }
    toast.error(
      `No se pudo conectar con Google. Intenta de nuevo.${code ? ` (código ${code})` : ''}`,
    );
    return null;
  }
}

export type GoogleSignInResult = {
  ok: boolean;
  /**
   * La cuenta se CREÓ en este sign-in: falta completar el registro (rol +
   * datos). La pantalla debe llevar a /auth/complete-registration.
   */
  isNewUser: boolean;
};

/**
 * Flujo completo de autenticación con Google: abre el Google Sign-In nativo,
 * manda el idToken al backend (`POST /auth/google`) y guarda la sesión.
 * Si la cuenta es NUEVA queda marcada con `needsOnboarding` en la sesión
 * (el auto-login del index también la manda a completar el registro).
 *
 * `role` solo aplica cuando la cuenta NO existe todavía: define con qué rol
 * se crea (cliente por defecto, repartidor desde su pantalla de registro).
 */
export async function signInWithGoogle(
  role?: 'client' | 'delivery',
): Promise<GoogleSignInResult> {
  const idToken = await getGoogleIdToken();
  if (!idToken) return { ok: false, isNewUser: false };

  try {
    const res = await authService.signInWithGoogle(idToken, role);
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
      toast.error('No se pudo iniciar sesión con Google.');
    }
    // Si es HttpError, el interceptor ya mostró el mensaje del backend.
    return { ok: false, isNewUser: false };
  }
}
