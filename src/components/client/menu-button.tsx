import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { Pressable } from 'react-native';

import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';

/**
 * Botón hamburguesa de las navbars de los paneles con drawer: abre el drawer
 * del layout indicado en `parent` (cliente por defecto; el panel DELI pasa
 * '/delivery'). Pedir el navigation del layout hace que funcione igual desde
 * pantallas anidadas en stacks (como /orders).
 * OJO SDK 57: expo-router ya no permite importar `@react-navigation/*` —
 * el `openDrawer()` viene del propio useNavigation de expo-router.
 */
export function MenuButton({ parent = '/(client)' }: { parent?: string }) {
  const navigation = useNavigation<{ openDrawer(): void }>(parent);
  // `getAppColors()` (singleton no reactivo) se queda pegado al primer color
  // que pinta — el compilador de React lo cachea para siempre porque no
  // depende de nada rastreable (mismo bug de NOTAS §51-quater). Este botón
  // vive en TODAS las navbars y casi nunca se re-renderiza por otro motivo,
  // así que hace falta el hook reactivo para que el icono siga el tema.
  const colors = useResolvedAppColors();
  return (
    <Pressable
      onPress={() => navigation.openDrawer()}
      hitSlop={8}
      className="h-10 w-10 items-center justify-center rounded-full bg-card active:opacity-70"
    >
      <Ionicons name="menu" size={20} color={colors.inkColor} />
    </Pressable>
  );
}
