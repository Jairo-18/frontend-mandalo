import { ReactNode } from 'react';
import { Text, View } from 'react-native';

type Props = {
  title: string;
  /** Línea pequeña bajo el título (p. ej. "Panel del repartidor"). */
  subtitle?: string;
  /** Botón de la izquierda (hamburguesa del drawer del rol correspondiente). */
  menu: ReactNode;
};

/**
 * Navbar oscura de marca de las pantallas con drawer (Mis pedidos, Mis
 * direcciones, Mi perfil…): hamburguesa + título en blanco, con el cierre
 * redondeado sobre el fondo surface — espejo del bloque oscuro del home.
 * Usarla con `SafeAreaView edges={['top']} className="bg-dark"` y
 * `StatusBar style="light"`.
 */
export function PanelHeader({ title, subtitle, menu }: Props) {
  return (
    <View className="flex-row items-center gap-3 rounded-b-[28px] bg-dark px-5 pb-4 pt-2">
      {menu}
      <View className="flex-1">
        <Text className="text-lg font-extrabold text-white">{title}</Text>
        {!!subtitle && (
          <Text className="text-[11px] font-bold uppercase tracking-widest text-white/60">
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
}
