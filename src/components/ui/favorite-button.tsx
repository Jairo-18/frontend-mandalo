import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable } from 'react-native';

import { useSession } from '@/hooks/use-session';
import { toggleFavorite, useFavorites } from '@/lib/favorites';
import { FavoriteKind } from '@/services/favorites';

type Props = {
  kind: FavoriteKind;
  id: number;
  /** Diámetro del botón (el icono es ~55%). */
  size?: number;
  /**
   * `overlay`: círculo blanco con sombra sobre una foto (tarjetas, detalle).
   * `plain`: solo el corazón (cabecera de la tienda, listas).
   */
  variant?: 'overlay' | 'plain';
  /** Color del corazón vacío en `plain` (default gris de la app). */
  color?: string;
};

const HEART_RED = '#E11D48';

/**
 * Corazón de favoritos (negocio o producto): marcado = rojo lleno. El
 * invitado no tiene favoritos: tocarlo lo manda a iniciar sesión, igual que
 * "elegir dirección" en el home.
 */
export function FavoriteButton({
  kind,
  id,
  size = 32,
  variant = 'overlay',
  color = '#6B7280',
}: Props) {
  const isGuest = !useSession()?.user;
  const favorites = useFavorites();
  const active = favorites[kind].has(id);

  return (
    <Pressable
      onPress={(e) => {
        // Dentro de tarjetas tocables: que no abra también el detalle.
        e.stopPropagation?.();
        if (isGuest) router.push('/auth/login');
        else void toggleFavorite(kind, id);
      }}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={active ? 'Quitar de favoritos' : 'Guardar en favoritos'}
      className={`items-center justify-center rounded-full active:opacity-70 ${
        variant === 'overlay' ? 'bg-white shadow' : ''
      }`}
      style={{ width: size, height: size }}
    >
      <Ionicons
        name={active ? 'heart' : 'heart-outline'}
        size={Math.round(size * 0.55)}
        color={active ? HEART_RED : variant === 'overlay' ? '#374151' : color}
      />
    </Pressable>
  );
}
