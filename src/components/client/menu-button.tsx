import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { Pressable } from 'react-native';

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
  return (
    <Pressable
      onPress={() => navigation.openDrawer()}
      hitSlop={8}
      className="h-10 w-10 items-center justify-center rounded-full bg-white active:opacity-70"
    >
      <Ionicons name="menu" size={20} color="#1E1E2D" />
    </Pressable>
  );
}
