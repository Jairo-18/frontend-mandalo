import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Section = { heading: string; body: string };

type Props = {
  title: string;
  /** "Última actualización" que se muestra al pie (misma noción de versión que `termsVersion` del backend). */
  updatedAt: string;
  sections: Section[];
};

/**
 * Pantalla de lectura para un documento legal (Términos, Privacidad):
 * cabecera con volver + texto en secciones. La usan `auth/terms.tsx` y
 * `auth/privacy.tsx`, enlazadas desde el checkbox del registro.
 */
export function LegalDocumentScreen({ title, updatedAt, sections }: Props) {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      <View className="flex-row items-center gap-3 bg-white px-5 pb-2 pt-2">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full bg-surface active:opacity-70"
        >
          <Ionicons name="arrow-back" size={20} color="#1E1E2D" />
        </Pressable>
        <Text className="flex-1 text-lg font-extrabold text-dark">{title}</Text>
      </View>

      <ScrollView contentContainerClassName="px-5 pb-10">
        {sections.map((section) => (
          <View key={section.heading} className="mb-5">
            <Text className="mb-1.5 text-[15px] font-extrabold text-dark">
              {section.heading}
            </Text>
            <Text className="text-[13px] leading-5 text-muted">
              {section.body}
            </Text>
          </View>
        ))}

        <Text className="mt-2 text-center text-[11px] text-muted">
          Última actualización: {updatedAt}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
