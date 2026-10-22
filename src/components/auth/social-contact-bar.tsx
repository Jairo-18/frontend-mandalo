import { Linking, Pressable, View } from 'react-native';

import { AnimatedSocialIcon } from '@/components/ui/animated-social-icon';
import { useAppData } from '@/context/app-data';
import { buildSocialLinkItems } from '@/lib/social-links';

/**
 * Fila compacta de íconos (YouTube/Facebook/Instagram/WhatsApp) que el admin
 * carga desde "Aplicación" — se muestra debajo de "¿Cómo funciona Mandalo?"
 * en login y en el selector de rol del registro. Cada ícono va con su color
 * de marca y animado (`AnimatedSocialIcon`). Nada si el admin no cargó
 * ninguno todavía.
 */
export function SocialContactBar() {
  const { platformSocial } = useAppData();
  const items = buildSocialLinkItems(platformSocial);

  if (items.length === 0) return null;

  return (
    <View className="mt-5 flex-row items-center justify-center gap-4">
      {items.map((item, i) => (
        <Pressable
          key={item.key}
          onPress={() => Linking.openURL(item.url)}
          hitSlop={8}
          className="active:opacity-70"
        >
          <AnimatedSocialIcon icon={item.icon} color={item.color} size={20} index={i} bubble />
        </Pressable>
      ))}
    </View>
  );
}
