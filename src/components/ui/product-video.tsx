import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

/**
 * `expo-video` es código NATIVO: un build instalado antes de agregarlo no
 * lo trae y el `import` normal tumbaría la pantalla. Se carga opcional: sin
 * el módulo se muestra la miniatura con un aviso (el resto sigue igual).
 */
type ExpoVideoModule = typeof import('expo-video');
let expoVideo: ExpoVideoModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  expoVideo = require('expo-video') as ExpoVideoModule;
} catch {
  expoVideo = null;
}

type Props = {
  url: string;
  thumbnailUrl?: string | null;
  /**
   * Caja donde se pinta. El video se ve COMPLETO (contain): si su proporción
   * no coincide quedan franjas negras finas, nunca se recorta la imagen.
   */
  width: number;
  height: number;
  /** Solo se reproduce mientras está visible (diapositiva activa). */
  active: boolean;
};

/** Video corto del producto: en silencio y en bucle, con botón de sonido. */
export function ProductVideo(props: Props) {
  return expoVideo ? <NativeProductVideo {...props} /> : <VideoFallback {...props} />;
}

function NativeProductVideo({ url, width, height, active }: Props) {
  const { useVideoPlayer, VideoView } = expoVideo!;
  const [muted, setMuted] = useState(true);
  const player = useVideoPlayer(url, (p) => {
    p.loop = true;
    p.muted = true;
  });

  useEffect(() => {
    if (active) player.play();
    else player.pause();
  }, [active, player]);

  useEffect(() => {
    player.muted = muted;
  }, [muted, player]);

  return (
    <View style={{ width, height }} className="overflow-hidden bg-black">
      <VideoView
        player={player}
        style={{ width, height }}
        contentFit="contain"
        nativeControls={false}
      />
      <Pressable
        onPress={() => setMuted((m) => !m)}
        hitSlop={10}
        className="absolute bottom-3 right-3 h-9 w-9 items-center justify-center rounded-full bg-black/50 active:opacity-70"
      >
        <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={18} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

function VideoFallback({ thumbnailUrl, width, height }: Props) {
  return (
    <View style={{ width, height }} className="items-center justify-center bg-black">
      {!!thumbnailUrl && (
        <Image
          source={{ uri: thumbnailUrl }}
          style={{ position: 'absolute', width, height, opacity: 0.6 }}
          contentFit="contain"
        />
      )}
      <Ionicons name="play-circle" size={48} color="#FFFFFF" />
      <Text className="mt-1 px-6 text-center text-xs font-semibold text-white">
        Actualiza la app para ver el video
      </Text>
    </View>
  );
}
