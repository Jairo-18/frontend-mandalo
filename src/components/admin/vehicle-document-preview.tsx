import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, Linking, Pressable, Text, View } from 'react-native';

import { PhotoPreviewModal } from '@/components/ui/photo-preview-modal';
import { toast } from '@/lib/toast';

type Props = {
  label: string;
  url?: string | null;
};

/**
 * Documento del vehículo (SOAT / tecnomecánica) solo lectura: puede ser una
 * foto (preview + visor a pantalla completa, igual que la cédula/licencia) o
 * un PDF (el backend lo guarda tal cual, sin recomprimir) — para ese caso se
 * muestra una tarjeta con un botón que lo abre en el navegador/lector del
 * sistema, porque React Native no puede renderizar un PDF inline.
 */
export function VehicleDocumentPreview({ label, url }: Props) {
  const [preview, setPreview] = useState<string | null>(null);

  if (!url) return null;

  const isPdf = url.toLowerCase().endsWith('.pdf');

  async function openPdf() {
    try {
      await Linking.openURL(url!);
    } catch {
      toast.error('No se pudo abrir el documento');
    }
  }

  return (
    <View className="mb-4 flex-1">
      <Text className="mb-2 text-sm font-bold text-gray-700">{label}</Text>

      {isPdf ? (
        <Pressable
          onPress={openPdf}
          className="h-[110px] items-center justify-center gap-1.5 rounded-xl bg-surface active:opacity-80"
        >
          <Ionicons name="document-text-outline" size={26} color="#FF5A3C" />
          <Text className="text-xs font-bold text-primary">Abrir PDF</Text>
        </Pressable>
      ) : (
        <Pressable onPress={() => setPreview(url)} className="active:opacity-80">
          <Image
            source={{ uri: url }}
            style={{ width: '100%', height: 110, borderRadius: 12 }}
            resizeMode="cover"
          />
          <View className="absolute bottom-1.5 right-1.5 h-6 w-6 items-center justify-center rounded-full bg-black/50">
            <Ionicons name="expand-outline" size={13} color="#FFFFFF" />
          </View>
        </Pressable>
      )}

      <PhotoPreviewModal uri={preview} onClose={() => setPreview(null)} />
    </View>
  );
}
