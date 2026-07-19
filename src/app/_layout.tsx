import '../../global.css';

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { SigningOutOverlay } from '@/components/ui/signing-out-overlay';
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
      {/* Manejo del teclado (edge-to-edge de Android anula adjustResize; sin
          esto el contenido no sube y el teclado tapa los inputs). */}
      <KeyboardProvider>
        <AnimatedSplashOverlay />
        <AppDataProvider>
          <CartProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </CartProvider>
          <SigningOutOverlay />
          <ToastHost />
        </AppDataProvider>
      </KeyboardProvider>
    </ThemeProvider>
  );
}
