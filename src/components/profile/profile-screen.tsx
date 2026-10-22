import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ReactNode, useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { GoogleButton } from '@/components/auth/google-button';
import { Avatar } from '@/components/ui/avatar';
import { PanelHeader, PanelSafeArea } from '@/components/ui/panel-header';
import { YesNoDialog } from '@/components/ui/yes-no-dialog';
import { useAppData } from '@/context/app-data';
import { useGoogleServices } from '@/hooks/use-google-services';
import { getGoogleIdToken } from '@/lib/google-auth';
import { DEFAULT_USER_AVATAR } from '@/lib/default-images';
import { WebNotifyRow } from '@/components/ui/web-notify-row';
import { getSession, setSession } from '@/lib/session';
import { signOutEverywhere } from '@/lib/sign-out';
import { formatText } from '@/lib/text-format';
import { MyProfile, profileService } from '@/services/profile';
import { buildSocialLinkItems } from '@/lib/social-links';
import { openStoreReview, STORE_LABEL, storeFor } from '@/lib/rate-app';
import { AnimatedSocialIcon } from '@/components/ui/animated-social-icon';
import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';

type Props = {
  menu?: ReactNode;
  /** Ruta de la pantalla "Cambiar contraseña" del panel correspondiente. */
  changePasswordHref: '/change-password' | '/delivery/change-password';
  /**
   * Ruta de "Reenviar documentos" (solo repartidor): corregir un documento
   * rechazado o renovar uno vencido (SOAT, tecnomecánica, licencia). Sin esto
   * no se muestra la fila (el cliente no tiene documentos que subir).
   */
  resendDocumentsHref?: '/delivery/resend-documents';
  /** Ruta de "Editar información" (el formulario vive en su propia pantalla). */
  editProfileHref: '/edit-profile' | '/delivery/edit-profile';
};

/**
 * Pantalla "Mi cuenta" COMPARTIDA entre los paneles del cliente y el
 * repartidor: MUESTRA los datos personales (solo lectura: se editan en
 * "Editar información", con el lápiz de la foto o el botón), vincula la
 * cuenta con Google, entra a cambiar la contraseña, reseñas, eliminar la
 * cuenta y ayuda/legal. Cada rol la monta desde su propia ruta.
 */
export function ProfileScreen({
  menu,
  changePasswordHref,
  resendDocumentsHref,
  editProfileHref,
}: Props) {
  const colors = useResolvedAppColors();
  const router = useRouter();
  // "Mis direcciones" es un concepto solo del cliente (a dónde le llegan los
  // pedidos); el repartidor no lo tiene, así que la nota de más abajo no
  // aplica para él.
  const isClient = changePasswordHref === '/change-password';
  const { departments, platformSocial, getMunicipalities } = useAppData();
  const socialItems = buildSocialLinkItems(platformSocial);

  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [municipalityName, setMunicipalityName] = useState<string | null>(null);

  // Cuenta: vínculo con Google (el botón de VINCULAR necesita el sign-in
  // nativo, así que no aparece en un Android sin GMS — desvincular sí sigue,
  // es una llamada normal al API. Ver `lib/google-services.ts`).
  const googleServices = useGoogleServices();
  // Tienda donde se califica la app (App Store / Google Play / AppGallery).
  const store = storeFor(googleServices);
  const [linkingGoogle, setLinkingGoogle] = useState(false);
  const [confirmUnlink, setConfirmUnlink] = useState(false);

  // Cuenta: eliminar cuenta (self-service, exigido por las tiendas). Pide
  // confirmación y manda un correo con el enlace que la elimina de verdad.
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletionEmailSent, setDeletionEmailSent] = useState(false);

  // Cuenta: cerrar sesión (antes vivía en el pie del drawer, ver NOTAS).
  const [signingOut, setSigningOut] = useState(false);

  // Se recarga cada vez que se vuelve a esta pantalla (p. ej. después de
  // "Editar información"), no solo al montarla.
  const loadProfile = useCallback(async () => {
    try {
      const res = await profileService.getMe();
      setProfile(res.data);
    } catch {
      // El interceptor HTTP ya mostró el toast.
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

  // Nombre del municipio (el perfil trae solo el id; se resuelve del catálogo).
  useEffect(() => {
    const deptId = profile?.departmentId;
    const munId = profile?.municipalityId;
    if (!deptId || !munId) {
      setMunicipalityName(null);
      return;
    }
    let alive = true;
    getMunicipalities(deptId)
      .then((muns) => {
        if (alive) setMunicipalityName(muns.find((m) => m.id === munId)?.name ?? null);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [profile?.departmentId, profile?.municipalityId, getMunicipalities]);

  /** Refresca la foto en la sesión persistida (cabecera del drawer). */
  async function refreshSessionUser(changes: { avatarUrl?: string | null }) {
    const session = getSession();
    if (!session) return;
    await setSession({
      ...session,
      user: { ...session.user, ...changes },
    });
  }

  async function handleLinkGoogle() {
    try {
      setLinkingGoogle(true);
      const idToken = await getGoogleIdToken();
      if (!idToken) return;
      await profileService.linkGoogle(idToken);
      // Recarga el perfil para reflejar el vínculo (y el avatar de Google si entró).
      const res = await profileService.getMe();
      setProfile(res.data);
      await refreshSessionUser({ avatarUrl: res.data.avatarUrl });
    } catch {
      // El interceptor HTTP ya mostró el toast (p. ej. 409 vinculada a otro).
    } finally {
      setLinkingGoogle(false);
    }
  }

  async function handleUnlinkGoogle() {
    try {
      await profileService.unlinkGoogle();
      const res = await profileService.getMe();
      setProfile(res.data);
    } catch {
      // El interceptor HTTP ya mostró el toast.
    } finally {
      setConfirmUnlink(false);
    }
  }

  /**
   * Paso 1 de "Eliminar mi cuenta": el backend manda al correo de la cuenta
   * un enlace (30 min, un solo uso) que es el que la elimina de verdad. La
   * sesión sigue abierta hasta entonces; al confirmarse, el siguiente
   * request da 401 y la app cierra sesión sola.
   */
  async function handleDeleteAccount() {
    try {
      await profileService.requestAccountDeletion();
      setConfirmDelete(false);
      setDeletionEmailSent(true);
    } catch {
      // El interceptor HTTP ya mostró el toast.
      setConfirmDelete(false);
    }
  }

  async function handleLogout() {
    setSigningOut(true);
    // Navega al login por dentro, con el overlay "Cerrando sesión…".
    await signOutEverywhere();
    setSigningOut(false);
  }

  if (loading) {
    return (
      <PanelSafeArea>
        <StatusBar style="light" />
        <View className="flex-1 bg-surface">
          <PanelHeader title="Mi cuenta" menu={menu} />
          <ActivityIndicator
            size="large"
            color={colors.primaryColor}
            style={{ paddingTop: 48 }}
          />
        </View>
      </PanelSafeArea>
    );
  }

  return (
    <PanelSafeArea>
      <StatusBar style="light" />

      <View className="flex-1 bg-surface">
      <PanelHeader title="Mi cuenta" menu={menu} />

      {/* Sin sumar insets.bottom: esta pantalla vive dentro del menú inferior
          de Tabs (cliente/repartidor), que ya reserva el inset real. */}
      <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
        <View className="px-5 pb-4">
          {/* ---- Datos personales (solo lectura) ---- */}
          <View className="mt-5 rounded-2xl border border-border bg-card p-4">
            <View className="items-center">
              <View>
                <Avatar
                  uri={profile?.avatarUrl}
                  fallbackSource={DEFAULT_USER_AVATAR}
                  size={88}
                  shape="circle"
                />
                {/* Lápiz junto a la foto: entra a "Editar información". */}
                <Pressable
                  onPress={() => router.push(editProfileHref)}
                  hitSlop={8}
                  accessibilityLabel="Editar información"
                  className="absolute -bottom-1 -right-1 h-9 w-9 items-center justify-center rounded-full border-2 border-card bg-primary active:opacity-80"
                >
                  <Ionicons name="pencil" size={16} color="#FFFFFF" />
                </Pressable>
              </View>
              <Text className="mt-3 text-center text-lg font-extrabold text-ink">
                {profile?.fullName}
              </Text>
              {!!profile?.username && (
                <Text className="text-[13px] text-muted">@{profile.username}</Text>
              )}
              {/* Rol visible para el repartidor (la pantalla es compartida). */}
              {!isClient && (
                <View className="mt-2 flex-row items-center gap-1.5 rounded-full bg-primary-tint px-3 py-1">
                  <Ionicons name="bicycle" size={14} color={colors.primaryColor} />
                  <Text className="text-[12px] font-bold text-primary">Repartidor</Text>
                </View>
              )}
            </View>

            <View className="mt-4">
              <InfoRow
                icon="call-outline"
                label="Celular"
                value={profile?.phone ? formatText('phone', profile.phone) : null}
              />
              <InfoRow
                icon="card-outline"
                label="Identificación"
                value={
                  profile?.identificationNumber
                    ? `${profile.identificationType?.name ?? ''} ${profile.identificationNumber}`.trim()
                    : null
                }
              />
              <InfoRow
                icon="map-outline"
                label="Municipio"
                value={
                  [
                    municipalityName,
                    departments.find((d) => d.id === profile?.departmentId)?.name,
                  ]
                    .filter(Boolean)
                    .join(', ') || null
                }
              />
              <InfoRow
                icon="home-outline"
                label={isClient ? 'Dirección de mi perfil' : 'Dirección'}
                value={profile?.address ?? null}
              />
            </View>

            <Pressable
              onPress={() => router.push(editProfileHref)}
              className="mt-1 h-12 flex-row items-center justify-center gap-2 rounded-2xl border border-primary active:opacity-70"
            >
              <Ionicons name="create-outline" size={18} color={colors.primaryColor} />
              <Text className="text-[15px] font-bold text-primary">Editar información</Text>
            </Pressable>
          </View>

          {/* ---- Cuenta ---- */}
          <Text className="mb-2 mt-6 text-base font-extrabold text-ink">
            Cuenta
          </Text>
          <View className="gap-2 rounded-2xl border border-border bg-card p-4">
            {/* Correo (solo lectura: cambiarlo requeriría re-verificación) */}
            <View className="flex-row items-center gap-3 px-3.5 pb-1">
              <Ionicons name="mail-outline" size={20} color={colors.mutedColor} />
              <View className="flex-1">
                <Text className="text-[11px] font-bold uppercase tracking-wide text-muted">
                  Correo
                </Text>
                <Text className="text-[14px] font-medium text-ink">
                  {profile?.email}
                </Text>
              </View>
            </View>

            {/* Google */}
            {profile?.googleId ? (
              <View className="flex-row items-center gap-3 rounded-xl bg-surface px-3.5 py-3">
                <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                <Text className="flex-1 text-[14px] font-medium text-ink">
                  Cuenta vinculada con Google
                </Text>
                <Pressable
                  onPress={() => setConfirmUnlink(true)}
                  hitSlop={6}
                  className="rounded-lg border border-red-200 px-2.5 py-1.5 active:opacity-70"
                >
                  <Text className="text-xs font-bold text-red-600">
                    Desvincular
                  </Text>
                </Pressable>
              </View>
            ) : Platform.OS !== 'web' && googleServices ? (
              // Vincular usa el sign-in NATIVO de Google → solo en la app y
              // solo con GMS. (Desvincular sí queda en web: es una llamada
              // normal al API.)
              <View>
                <GoogleButton
                  label="Vincular con Google"
                  onPress={handleLinkGoogle}
                  loading={linkingGoogle}
                />
              </View>
            ) : null}

            {/* Reenviar documentos (solo repartidor): corregir un rechazo del
                admin. Una vez la cuenta está VERIFICADA (activa), los
                documentos quedan congelados y la fila desaparece — para
                cambiar alguno hay que pedírselo al administrador. */}
            {resendDocumentsHref && profile && !profile.isActive && (
              <Pressable
                onPress={() => router.push(resendDocumentsHref)}
                className="flex-row items-center gap-3 rounded-xl bg-surface px-3.5 py-3 active:opacity-70"
              >
                <Ionicons name="document-attach-outline" size={20} color={colors.primaryColor} />
                <Text className="flex-1 text-[14px] font-bold text-ink">
                  Reenviar documentos
                </Text>
                <Ionicons name="chevron-forward" size={18} color={colors.mutedColor} />
              </Pressable>
            )}
            {resendDocumentsHref && profile?.isActive && (
              <Pressable
                onPress={() => router.push(resendDocumentsHref)}
                className="flex-row items-center gap-3 rounded-xl bg-surface px-3.5 py-3 active:opacity-70"
              >
                <Ionicons name="shield-checkmark-outline" size={20} color="#22C55E" />
                <Text className="flex-1 text-[14px] font-bold text-ink">
                  Ver mis documentos
                </Text>
                <Ionicons name="chevron-forward" size={18} color={colors.mutedColor} />
              </Pressable>
            )}

            {/* Solo web: en nativo devuelve null (el push ya pide su permiso). */}
            <WebNotifyRow />

            {/* Mis favoritos (solo cliente): negocios y productos guardados. */}
            {isClient && (
              <Pressable
                onPress={() => router.push('/favorites')}
                className="flex-row items-center gap-3 rounded-xl bg-surface px-3.5 py-3 active:opacity-70"
              >
                <Ionicons name="heart-outline" size={20} color={colors.primaryColor} />
                <Text className="flex-1 text-[14px] font-bold text-ink">Mis favoritos</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.mutedColor} />
              </Pressable>
            )}

            {/* Mis datos de pago (solo repartidor): su Nequi para los mandados. */}
            {!!resendDocumentsHref && (
              <Pressable
                onPress={() => router.push('/delivery/payment-info')}
                className="flex-row items-center gap-3 rounded-xl bg-surface px-3.5 py-3 active:opacity-70"
              >
                <Ionicons name="wallet-outline" size={20} color={colors.primaryColor} />
                <Text className="flex-1 text-[14px] font-bold text-ink">Mis datos de pago</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.mutedColor} />
              </Pressable>
            )}

            {/* Mis reseñas: lo que opinan de mí (promedio + reseñas recibidas). */}
            <Pressable
              onPress={() => router.push(isClient ? '/reviews' : '/delivery/reviews')}
              className="flex-row items-center gap-3 rounded-xl bg-surface px-3.5 py-3 active:opacity-70"
            >
              <Ionicons name="star-outline" size={20} color={colors.primaryColor} />
              <Text className="flex-1 text-[14px] font-bold text-ink">Mis reseñas</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedColor} />
            </Pressable>

            {/* Cambiar contraseña: pantalla propia */}
            <Pressable
              onPress={() => router.push(changePasswordHref)}
              className="flex-row items-center gap-3 rounded-xl bg-surface px-3.5 py-3 active:opacity-70"
            >
              <Ionicons name="key-outline" size={20} color={colors.primaryColor} />
              <Text className="flex-1 text-[14px] font-bold text-ink">
                Cambiar contraseña
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedColor} />
            </Pressable>

            {/* Cerrar sesión: antes vivía en el pie del drawer — al pasar a
                menú inferior (NOTAS) quedó sin lugar, así que va acá. */}
            <Pressable
              onPress={handleLogout}
              disabled={signingOut}
              className="flex-row items-center gap-3 rounded-xl bg-surface px-3.5 py-3 active:opacity-70"
            >
              {signingOut ? (
                <ActivityIndicator size="small" color={colors.primaryColor} />
              ) : (
                <Ionicons name="log-out-outline" size={20} color={colors.primaryColor} />
              )}
              <Text className="flex-1 text-[14px] font-bold text-primary">
                Cerrar sesión
              </Text>
            </Pressable>

            {/* Eliminar cuenta: self-service exigido por Google Play. Separada
                con más espacio (y una línea divisoria) del resto de rutas: es
                la única acción destructiva de la lista. */}
            <View className="mt-1 border-t border-border pt-3">
              <Pressable
                onPress={() => setConfirmDelete(true)}
                className="flex-row items-center gap-3 rounded-xl border border-red-200 px-3.5 py-3 active:opacity-70"
              >
                <Ionicons name="trash-outline" size={20} color="#DC2626" />
                <Text className="flex-1 text-[14px] font-bold text-red-600">
                  Eliminar mi cuenta
                </Text>
              </Pressable>
            </View>
          </View>

          {/* ---- Ayuda y legal ---- (separada de "Cuenta": guía de uso +
              documentos legales, nada que ver con la sesión/los datos). */}
          <Text className="mb-2 mt-6 text-base font-extrabold text-ink">
            Ayuda y legal
          </Text>
          <View className="gap-2 rounded-2xl border border-border bg-card p-4">
            {/* Reseña de la APP en su tienda (App Store / Google Play /
                AppGallery según el teléfono; en web, según el equipo). */}
            <Pressable
              onPress={() => void openStoreReview()}
              className="flex-row items-center gap-3 rounded-xl bg-amber-50 px-3.5 py-3 active:opacity-70"
            >
              <Ionicons name="star" size={20} color="#F5A623" />
              <View className="flex-1">
                <Text className="text-[14px] font-bold text-amber-900">
                  Califica Mandalo en {STORE_LABEL[store]}
                </Text>
                <Text className="text-[12px] text-amber-800">
                  Tu opinión nos ayuda a crecer
                </Text>
              </View>
              <Ionicons name="open-outline" size={16} color="#92400E" />
            </Pressable>

            {/* Guía de uso: mismo contenido de la página que se comparte por
                fuera, pero adaptada como pantalla nativa (pedido del cliente). */}
            <Pressable
              onPress={() => router.push('/how-it-works')}
              className="flex-row items-center gap-3 rounded-xl bg-surface px-3.5 py-3 active:opacity-70"
            >
              <Ionicons name="help-circle-outline" size={20} color={colors.mutedColor} />
              <Text className="flex-1 text-[14px] font-bold text-ink">
                ¿Cómo funciona Mandalo?
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedColor} />
            </Pressable>

            {/* Términos y Condiciones de Uso (TYC-001). */}
            <Pressable
              onPress={() => router.push('/terminos-y-condiciones-de-uso')}
              className="flex-row items-center gap-3 rounded-xl bg-surface px-3.5 py-3 active:opacity-70"
            >
              <Ionicons name="document-text-outline" size={20} color={colors.mutedColor} />
              <Text className="flex-1 text-[14px] font-bold text-ink">
                Políticas de uso
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedColor} />
            </Pressable>

            {/* Política de privacidad: antes solo se veía en el registro; se
                referencia desde el aviso de ubicación en segundo plano del
                repartidor, así que debe poder leerse también ya logueado.
                Fusionada dentro de esta misma app (NOTAS §62). */}
            <Pressable
              onPress={() => router.push('/politicas-de-privacidad')}
              className="flex-row items-center gap-3 rounded-xl bg-surface px-3.5 py-3 active:opacity-70"
            >
              <Ionicons name="shield-outline" size={20} color={colors.mutedColor} />
              <Text className="flex-1 text-[14px] font-bold text-ink">
                Política de privacidad
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedColor} />
            </Pressable>

            {/* Redes/contacto que el admin carga en "Aplicación" — vacío si
                todavía no cargó nada. */}
            {socialItems.map((item, i) => (
              <Pressable
                key={item.key}
                onPress={() => Linking.openURL(item.url)}
                className="flex-row items-center gap-3 rounded-xl bg-surface px-3.5 py-3 active:opacity-70"
              >
                <AnimatedSocialIcon icon={item.icon} color={item.color} size={20} index={i} />
                <Text className="flex-1 text-[14px] font-bold text-ink">
                  {item.label}
                </Text>
                <Ionicons name="open-outline" size={16} color={colors.mutedColor} />
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
      </View>

      <YesNoDialog
        visible={confirmUnlink}
        destructive
        icon="unlink-outline"
        title="¿Desvincular Google?"
        message="Tu cuenta quedará solo con el acceso por correo y contraseña. Si no la recuerdas, usa '¿Olvidaste tu contraseña?' desde el login."
        confirmLabel="Sí, desvincular"
        cancelLabel="No"
        onConfirm={handleUnlinkGoogle}
        onCancel={() => setConfirmUnlink(false)}
      />

      <YesNoDialog
        visible={confirmDelete}
        destructive
        icon="trash-outline"
        title="¿Seguro que deseas eliminar tu cuenta?"
        message={`Te enviaremos un correo a ${profile?.email ?? 'tu correo'} con un enlace para confirmar (vence en 30 minutos). Al confirmarlo se borran tu nombre, correo, teléfono, dirección, foto y documentos, y no se puede deshacer. Si tienes pedidos, su registro se conserva de forma anónima por razones contables.`}
        confirmLabel="Sí, enviar el correo"
        cancelLabel="No"
        stacked
        onConfirm={handleDeleteAccount}
        onCancel={() => setConfirmDelete(false)}
      />

      <YesNoDialog
        visible={deletionEmailSent}
        icon="mail-outline"
        title="Revisa tu correo"
        message={`Te enviamos un enlace a ${profile?.email ?? 'tu correo'}. Ábrelo en los próximos 30 minutos para eliminar tu cuenta. Si no lo ves, revisa la carpeta de spam. Mientras no lo abras, tu cuenta sigue igual.`}
        confirmLabel="Entendido"
        onConfirm={() => setDeletionEmailSent(false)}
      />
    </PanelSafeArea>
  );
}

/** Fila de solo lectura "ícono · etiqueta / valor" de los datos personales. */
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | null;
}) {
  const colors = useResolvedAppColors();
  return (
    <View className="mb-3 flex-row items-start gap-3">
      <Ionicons name={icon} size={18} color={colors.mutedColor} style={{ marginTop: 2 }} />
      <View className="flex-1">
        <Text className="text-[11px] font-bold uppercase tracking-wide text-muted">
          {label}
        </Text>
        <Text className={`text-[14px] ${value ? 'font-medium text-ink' : 'italic text-muted'}`}>
          {value ?? 'Sin completar'}
        </Text>
      </View>
    </View>
  );
}
