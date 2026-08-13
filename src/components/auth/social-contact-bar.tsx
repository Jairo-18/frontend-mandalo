import { Ionicons } from '@expo/vector-icons';
import { Linking, Pressable, View } from 'react-native';

import { useAppData } from '@/context/app-data';
import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';
import { buildSocialLinkItems } from '@/lib/social-links';

/**
 * Fila compacta de íconos (YouTube/Facebook/Instagram/teléfono) que el admin
 * carga desde "Aplicación" — se muestra debajo de "¿Cómo funciona Mandalo?"
 * en login y en el selector de rol del registro. Nada si el admin no cargó
 * ninguno todavía.
 */
export function SocialContactBar() {
  const { platformSocial } = useAppData();
  const colors = useResolvedAppColors();
  const items = buildSocialLinkItems(platformSocial);

  if (items.length === 0) return null;

  return (
    <View className="mt-5 flex-row items-center justify-center gap-4">
      {items.map((item) => (
        <Pressable
          key={item.key}
          onPress={() => Linking.openURL(item.url)}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full bg-surface active:opacity-70"
        >
          <Ionicons name={item.icon} size={18} color={colors.mutedColor} />
        </Pressable>
      ))}
    </View>
  );
}
