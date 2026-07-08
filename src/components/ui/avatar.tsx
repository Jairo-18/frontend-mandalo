import { Ionicons } from '@expo/vector-icons';
import { Image, Text, View } from 'react-native';

type Props = {
  /** Foto; si falta se muestra la inicial de `label` o el `icon`. */
  uri?: string | null;
  /** Texto del que sale la inicial de respaldo (p. ej. el nombre). */
  label?: string;
  /** Icono de respaldo (gana sobre la inicial si se pasa). */
  icon?: keyof typeof Ionicons.glyphMap;
  size?: number;
  shape?: 'circle' | 'rounded';
  /** tint = fondo suave con texto primario (listados) · solid = fondo primario (drawers). */
  tone?: 'tint' | 'solid';
};

/** Avatar/logo con respaldo de inicial o icono (listados y cabeceras). */
export function Avatar({
  uri,
  label,
  icon,
  size = 44,
  shape = 'circle',
  tone = 'tint',
}: Props) {
  const radiusClass = shape === 'circle' ? 'rounded-full' : 'rounded-xl';
  const bgClass = tone === 'solid' ? 'bg-primary' : 'bg-primary-tint';
  const color = tone === 'solid' ? '#FFFFFF' : '#FF5A3C';
  const initial = label?.trim().charAt(0).toUpperCase() || '?';

  return (
    <View
      className={`items-center justify-center overflow-hidden ${radiusClass} ${bgClass}`}
      style={{ width: size, height: size }}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size }}
          resizeMode="cover"
        />
      ) : icon ? (
        <Ionicons name={icon} size={size * 0.5} color={color} />
      ) : (
        <Text
          className="font-extrabold"
          style={{ color, fontSize: size * 0.36 }}
        >
          {initial}
        </Text>
      )}
    </View>
  );
}
