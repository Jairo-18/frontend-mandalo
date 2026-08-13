import { Ionicons } from '@expo/vector-icons';

import { PlatformSocial } from '@/services/app-settings';

export type SocialLinkEntry = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  url: string;
};

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
    });
  }
  if (social.facebookUrl) {
    items.push({
      key: 'facebook',
      icon: 'logo-facebook',
      label: 'Síguenos en Facebook',
      url: social.facebookUrl,
    });
  }
  if (social.instagramUrl) {
    items.push({
      key: 'instagram',
      icon: 'logo-instagram',
      label: 'Síguenos en Instagram',
      url: social.instagramUrl,
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
    });
  }
  return items;
}
