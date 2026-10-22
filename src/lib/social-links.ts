import { Ionicons } from '@expo/vector-icons';

import { PlatformSocial } from '@/services/app-settings';

export type SocialLinkEntry = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  url: string;
  /** Color oficial de la marca (no del tema): el ícono se pinta siempre así. */
  color: string;
};

/**
 * Colores de marca oficiales. Instagram en realidad es un degradado; se usa
 * su rosa principal porque Ionicons pinta un solo color.
 */
export const SOCIAL_BRAND_COLORS = {
  youtube: '#FF0000',
  facebook: '#1877F2',
  instagram: '#E4405F',
  whatsapp: '#25D366',
} as const;

/**
 * Redes/contacto YA configurados por el admin (Aplicación → Redes y
 * contacto), como una lista lista para renderizar — cada consumidor
 * (`login`/`register`, `help-screen`, `profile-screen`) decide el estilo del
 * ítem (icono suelto vs. fila con label), pero todos arman la lista igual.
 * Vacío si el admin no cargó nada — quien lo consume oculta el bloque entero.
 */
export function buildSocialLinkItems(social: PlatformSocial): SocialLinkEntry[] {
  const items: SocialLinkEntry[] = [];
  if (social.youtubeUrl) {
    items.push({
      key: 'youtube',
      icon: 'logo-youtube',
      label: 'Síguenos en YouTube',
      url: social.youtubeUrl,
      color: SOCIAL_BRAND_COLORS.youtube,
    });
  }
  if (social.facebookUrl) {
    items.push({
      key: 'facebook',
      icon: 'logo-facebook',
      label: 'Síguenos en Facebook',
      url: social.facebookUrl,
      color: SOCIAL_BRAND_COLORS.facebook,
    });
  }
  if (social.instagramUrl) {
    items.push({
      key: 'instagram',
      icon: 'logo-instagram',
      label: 'Síguenos en Instagram',
      url: social.instagramUrl,
      color: SOCIAL_BRAND_COLORS.instagram,
    });
  }
  if (social.contactPhone) {
    // WhatsApp (no llamada): wa.me exige el número internacional SIN "+" ni
    // espacios ("573001234567") — se limpia todo lo que no sea dígito.
    const digits = social.contactPhone.replace(/\D/g, '');
    items.push({
      key: 'phone',
      icon: 'logo-whatsapp',
      label: 'Escríbenos por WhatsApp',
      url: `https://wa.me/${digits}`,
      color: SOCIAL_BRAND_COLORS.whatsapp,
    });
  }
  return items;
}
