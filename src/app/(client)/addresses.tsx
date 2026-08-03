import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddressManager } from '@/components/client/address-manager';
import { PanelHeader } from '@/components/ui/panel-header';

/**
 * "Mis direcciones" del drawer del cliente: la misma gestión de la hoja
 * "Enviar a…" del home (`AddressManager`), pero a pantalla completa.
 */
export default function AddressesScreen() {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-dark">
      <StatusBar style="light" />

      <View className="flex-1 bg-surface">
        <PanelHeader title="Mis direcciones" />

        {/* pb dinámico: el botón "Agregar dirección" de `AddressManager` va
            pegado al fondo (no dentro de un scroll) — sin sumar el inset de
            la barra de navegación de Android quedaba tapado por ella (a
            diferencia de la hoja "Enviar a…", que sí lo suma). */}
        <View
          className="flex-1 px-5 pt-3"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          <AddressManager fullScreen />
        </View>
      </View>
    </SafeAreaView>
  );
}
