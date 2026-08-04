import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { ThemeToggle } from '@/components/ui/theme-toggle';
import { getAppColors } from '@/lib/app-colors';

type Props = {
  title: string;
  /** Línea pequeña bajo el título (p. ej. "Panel del repartidor"). */
  subtitle?: string;
  /** Botón de la izquierda (opcional: back de un drill-down, etc). */
  menu?: ReactNode;
};

/**
 * Navbar de marca de las pantallas de los paneles con tabs abajo (Mis
 * pedidos, Mis direcciones, Mi perfil…): degradado horizontal primary→dark
 * (pedido del cliente, antes bg-dark sólido), título en blanco, con el
 * cierre redondeado sobre el fondo surface — espejo del bloque de marca del
 * home. `menu` es opcional: solo lo usan los drill-down con botón de volver
 * (p. ej. Mis cobros). Usarla junto con `PanelSafeArea` (mismo degradado
 * detrás de la barra de estado, para que no se note la costura).
 */
export function PanelHeader({ title, subtitle, menu }: Props) {
  const { primaryColor, darkColor } = getAppColors();

  return (
    <LinearGradient
      colors={[primaryColor, darkColor]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{ borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}
    >
      <View className="flex-row items-center gap-3 px-5 pb-4 pt-2">
        {menu}
        <View className="flex-1">
          <Text className="text-lg font-extrabold text-white">{title}</Text>
          {!!subtitle && (
            <Text className="text-[11px] font-bold uppercase tracking-widest text-white/60">
              {subtitle}
            </Text>
          )}
        </View>
        <ThemeToggle
          className="h-10 w-10 items-center justify-center rounded-full bg-white/15 active:opacity-70"
          iconColor="#FFFFFF"
        />
      </View>
    </LinearGradient>
  );
}

/**
 * Reemplazo de `<SafeAreaView edges={['top']} className="flex-1 bg-dark">`:
 * mismo degradado primary→dark de `PanelHeader` detrás de la barra de
 * estado/notch, para que el corte redondeado del header no se vea pegado a
 * un color plano distinto. `edges` por defecto `['top']` (el caso de casi
 * todas las pantallas que la usan); se puede pasar otro set si hace falta.
 */
export function PanelSafeArea({
  children,
  edges = ['top'],
}: {
  children: ReactNode;
  edges?: Edge[];
}) {
  const { primaryColor, darkColor } = getAppColors();

  return (
    <LinearGradient
      colors={[primaryColor, darkColor]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView edges={edges} style={{ flex: 1 }}>
        {children}
      </SafeAreaView>
    </LinearGradient>
  );
}
