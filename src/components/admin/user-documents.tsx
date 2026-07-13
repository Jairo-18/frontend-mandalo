import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';

import { PhotoPreviewModal } from '@/components/ui/photo-preview-modal';

type Props = {
  frontUrl?: string | null;
  backUrl?: string | null;
};

/**
 * Documento de identidad del repartidor (solo lectura): las fotos que subió
 * al registrarse, para que el admin las revise antes de activar la cuenta.
 * Tocar una foto la abre a pantalla completa (para leer bien el documento).
 */
export function UserDocuments({ frontUrl, backUrl }: Props) {
  const [preview, setPreview] = useState<string | null>(null);

  if (!frontUrl && !backUrl) return null;

  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-bold text-gray-700">
        Documento de identidad (subido en el registro)
      </Text>
      <View className="flex-row gap-3">
        {[
          { label: 'Frente', url: frontUrl },
          { label: 'Respaldo', url: backUrl },
        ].map(({ label, url }) => (
          <View key={label} className="flex-1">
            {url ? (
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
            ) : (
              <View className="h-[110px] items-center justify-center rounded-xl bg-surface">
                <Ionicons name="card-outline" size={24} color="#7A7A8A" />
              </View>
            )}
            <Text className="mt-1 text-center text-xs text-muted">{label}</Text>
          </View>
        ))}
      </View>

      {/* Visor a pantalla completa (tocar en cualquier parte cierra). */}
      <PhotoPreviewModal uri={preview} onClose={() => setPreview(null)} />
    </View>
  );
}
