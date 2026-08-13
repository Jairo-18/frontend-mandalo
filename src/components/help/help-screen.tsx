import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAppData } from '@/context/app-data';
import { useAppTheme } from '@/context/app-theme';
import { useSession } from '@/hooks/use-session';
import { buildSocialLinkItems } from '@/lib/social-links';
import { homePathFor } from '@/lib/session';
import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';

type LinkItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  href: '/how-it-works' | '/terminos-y-condiciones-de-uso' | '/politicas-de-privacidad';
};

const LINKS: LinkItem[] = [
  { icon: 'help-circle-outline', label: '¿Cómo funciona Mandalo?', href: '/how-it-works' },
  {
    icon: 'document-text-outline',
    label: 'Políticas de uso',
    href: '/terminos-y-condiciones-de-uso',
  },
  {
    icon: 'shield-outline',
    label: 'Política de privacidad',
    href: '/politicas-de-privacidad',
  },
];

/**
 * "¿Necesitas ayuda?": punto de entrada único a la guía de uso y los
 * documentos legales. Antes eran 3 botones sueltos apretados en el sidebar de
 * admin/negocio (junto a "Cerrar sesión" y el resto de la navegación) — se
 * agrupan acá para descongestionar esos sidebars. Cliente/repartidor NO usan
 * esta pantalla: ya tienen los 3 en su propia sección "Ayuda y legal" dentro
 * de "Mi cuenta" (`profile-screen.tsx`), que no cambia.
 */
export function HelpScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const session = useSession();
  const colors = useResolvedAppColors();
  const { platformSocial } = useAppData();
  const socialItems = buildSocialLinkItems(platformSocial);

  return (
    <SafeAreaView className="flex-1 bg-card">
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View className="flex-row items-center gap-3 bg-card px-5 pb-2 pt-2">
        <Pressable
          onPress={() =>
            router.canGoBack()
              ? router.back()
              : router.replace(homePathFor(session?.user))
          }
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full bg-surface active:opacity-70"
        >
          <Ionicons name="arrow-back" size={20} color={colors.inkColor} />
        </Pressable>
        <Text className="flex-1 text-lg font-extrabold text-ink">
          ¿Necesitas ayuda?
        </Text>
        <ThemeToggle />
      </View>

      <ScrollView contentContainerClassName="px-5 pb-12">
        <View className="w-full max-w-[560px] self-center">
          <Text className="mb-5 mt-2 text-[13px] leading-5 text-muted">
            Guía de uso y documentos legales de Mandalo.
          </Text>

          <View className="rounded-2xl border border-border bg-surface p-2">
            {LINKS.map((link, i) => (
              <Pressable
                key={link.href}
                onPress={() => router.push(link.href)}
                className={`flex-row items-center gap-3 rounded-xl px-3.5 py-3.5 active:opacity-70 ${
                  i > 0 ? 'mt-1' : ''
                }`}
              >
                <Ionicons name={link.icon} size={20} color={colors.mutedColor} />
                <Text className="flex-1 text-[14px] font-bold text-ink">
                  {link.label}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={colors.mutedColor} />
              </Pressable>
            ))}
          </View>

          {socialItems.length > 0 && (
            <>
              <Text className="mb-2 mt-6 text-sm font-bold text-ink">
                Síguenos y contacto
              </Text>
              <View className="rounded-2xl border border-border bg-surface p-2">
                {socialItems.map((item, i) => (
                  <Pressable
                    key={item.key}
                    onPress={() => Linking.openURL(item.url)}
                    className={`flex-row items-center gap-3 rounded-xl px-3.5 py-3.5 active:opacity-70 ${
                      i > 0 ? 'mt-1' : ''
                    }`}
                  >
                    <Ionicons name={item.icon} size={20} color={colors.mutedColor} />
                    <Text className="flex-1 text-[14px] font-bold text-ink">
                      {item.label}
                    </Text>
                    <Ionicons name="open-outline" size={16} color={colors.mutedColor} />
                  </Pressable>
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
