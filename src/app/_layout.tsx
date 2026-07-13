import '../../global.css';

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ToastHost } from '@/components/ui/toast';
import { AppDataProvider } from '@/context/app-data';
import { CartProvider } from '@/context/cart';
import { usePushNotifications } from '@/lib/push';
// Define la tarea de tracking en background del repartidor (import con efecto:
// TaskManager exige que la tarea exista ANTES de que el SO la dispare).
import '@/lib/delivery-tracker';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  // Push: registra el token al haber sesión y navega al tocar notificaciones.
  usePushNotifications();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AppDataProvider>
        <CartProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </CartProvider>
        <ToastHost />
      </AppDataProvider>
    </ThemeProvider>
  );
}
