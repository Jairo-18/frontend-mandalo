import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAppTheme } from '@/context/app-theme';
import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';
import { getAppColors } from '@/lib/app-colors';

type Para = string | string[] | { table: { headers: string[]; rows: string[][] } };
type Block = { chapter: string } | { heading: string; paragraphs: Para[] };

type Props = {
  title: string;
  updatedAt: string;
  meta: string[][];
  blocks: Block[];
  /** URL absoluta del PDF original ("Descargar en PDF"). */
  pdfUrl: string;
};

/**
 * Documento legal completo (Términos, Privacidad) — pantalla PÚBLICA,
 * alcanzable sin sesión (registro y navegación directa por URL en web).
 * Portado de web-mandalo (Astro) al fusionar los dos proyectos (NOTAS §62):
 * mismo contenido, mismas rutas exactas — solo cambia el renderer (HTML → RN).
 */
export function LegalDocument({ title, updatedAt, meta, blocks, pdfUrl }: Props) {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const colors = useResolvedAppColors();

  return (
    <SafeAreaView className="flex-1 bg-card">
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View className="flex-row items-center gap-3 bg-card px-5 pb-2 pt-2">
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full bg-surface active:opacity-70"
        >
          <Ionicons name="arrow-back" size={20} color={colors.inkColor} />
        </Pressable>
        <Text numberOfLines={1} className="flex-1 text-lg font-extrabold text-ink">
          {title}
        </Text>
        <ThemeToggle />
      </View>

      <ScrollView contentContainerClassName="px-5 pb-12">
        <View className="w-full max-w-[680px] self-center">
          <Text className="mb-4 text-xs text-muted">
            Versión 1.0 · Vigente desde el {updatedAt}
          </Text>

          <View className="mb-4 overflow-hidden rounded-xl border border-border">
            {meta.map(([k, v], idx) => (
              <View
                key={k}
                className={`flex-row ${idx > 0 ? 'border-t border-border' : ''}`}
              >
                <View className="w-[42%] bg-surface px-2.5 py-1.5">
                  <Text className="text-[11px] font-bold text-ink">{k}</Text>
                </View>
                <View className="flex-1 px-2.5 py-1.5">
                  <Text className="text-[11px] text-muted">{v}</Text>
                </View>
              </View>
            ))}
          </View>

          <Pressable
            onPress={() => Linking.openURL(pdfUrl)}
            className="mb-5 flex-row items-center gap-2 active:opacity-70"
          >
            <Ionicons name="document-text-outline" size={16} color={getAppColors().primaryColor} />
            <Text className="text-[13px] font-bold text-primary">
              Descargar el documento completo en PDF
            </Text>
          </Pressable>

          {blocks.map((block, i) =>
            'chapter' in block ? (
              <Text
                key={`chapter-${i}`}
                className="mb-2 mt-8 border-t border-border pt-4 text-[13px] font-extrabold uppercase tracking-wide text-primary"
              >
                {block.chapter}
              </Text>
            ) : (
              <View key={`section-${i}`} className="mb-5">
                <Text className="mb-1.5 text-[15px] font-extrabold text-ink">
                  {block.heading}
                </Text>
                {block.paragraphs.map((p, j) => (
                  <ParaBlock key={j} p={p} />
                ))}
              </View>
            ),
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ParaBlock({ p }: { p: Para }) {
  if (Array.isArray(p)) {
    return (
      <View className="mb-2">
        {p.map((item, i) => (
          <View key={i} className="mb-1 flex-row gap-1.5 pl-1">
            <Text className="text-[13px] leading-5 text-muted">•</Text>
            <Text className="flex-1 text-[13px] leading-5 text-muted">{item}</Text>
          </View>
        ))}
      </View>
    );
  }
  if (typeof p === 'object') {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator className="mb-3">
        <View className="overflow-hidden rounded-lg border border-border">
          <View className="flex-row bg-surface">
            {p.table.headers.map((h) => (
              <Text
                key={h}
                className="min-w-[110px] px-2.5 py-1.5 text-[11px] font-bold text-ink"
              >
                {h}
              </Text>
            ))}
          </View>
          {p.table.rows.map((row, ri) => (
            <View key={ri} className="flex-row border-t border-border">
              {row.map((cell, ci) => (
                <Text
                  key={ci}
                  className="min-w-[110px] px-2.5 py-1.5 text-[11px] text-muted"
                >
                  {cell}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    );
  }
  return <Text className="mb-2 text-[13px] leading-5 text-muted">{p}</Text>;
}
