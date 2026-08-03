import '../../global.css';

import {
  Roboto_400Regular,
  Roboto_400Regular_Italic,
  Roboto_500Medium,
  Roboto_700Bold,
  Roboto_900Black,
} from '@expo-google-fonts/roboto';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'nativewind';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { LocationConsentHost } from '@/components/ui/location-consent-host';
import { SigningOutOverlay } from '@/components/ui/signing-out-overlay';
import { ToastHost } from '@/components/ui/toast';
import { AppDataProvider } from '@/context/app-data';
import { AppThemeProvider } from '@/context/app-theme';
import { CartProvider } from '@/context/cart';
import { usePushNotifications } from '@/lib/push';
// Define la tarea de tracking en background del repartidor (import con efecto:
// TaskManager exige que la tarea exista ANTES de que el SO la dispare).
import '@/lib/delivery-tracker';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  // Push: registra el token al haber sesión y navega al tocar notificaciones.
  usePushNotifications();
  // Tipografía de marca (Roboto, Google Fonts). Las claves quedan con el
  // mismo nombre de familia que usa el <link> de Google Fonts en +html.tsx
  // (fontFamily.sans en tailwind.config.js) para que "font-sans" resuelva
  // igual en nativo y en web sin Platform.select.
  const [fontsLoaded, fontsError] = useFonts({
    Roboto: Roboto_400Regular,
    'Roboto-Italic': Roboto_400Regular_Italic,
    'Roboto-Medium': Roboto_500Medium,
    'Roboto-Bold': Roboto_700Bold,
    'Roboto-Black': Roboto_900Black,
  });
  // El splash nativo sigue visible (SplashScreen.preventAutoHideAsync arriba)
  // hasta que las fuentes cargan — AnimatedSplashOverlay recién ahí monta y
  // dispara su propio hideAsync().
  if (!fontsLoaded && !fontsError) return null;
  return (
    <AppThemeProvider>
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
            <LocationConsentHost />
          </AppDataProvider>
        </KeyboardProvider>
      </ThemeProvider>
    </AppThemeProvider>
  );
}
