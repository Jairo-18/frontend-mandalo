import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { AddressManager } from '@/components/client/address-manager';
import { PanelHeader, PanelSafeArea } from '@/components/ui/panel-header';

/**
 * "Mis direcciones" del menú inferior del cliente: la misma gestión de la
 * hoja "Enviar a…" del home (`AddressManager`), pero a pantalla completa.
 */
export default function AddressesScreen() {
  return (
    <PanelSafeArea>
      <StatusBar style="light" />

      <View className="flex-1 bg-surface">
        <PanelHeader title="Mis direcciones" />

        {/* pb FIJO, sin sumar insets.bottom: esta pantalla vive dentro del
            menú inferior de Tabs (client/_layout.tsx), que ya reserva el
            inset real de la barra de navegación del sistema en su propia
            altura — sumarlo acá también (como antes, de cuando esta pantalla
            era parte de un drawer sin barra inferior) dejaba un espacio
            vacío de más entre "Agregar dirección" y el menú. */}
        <View className="flex-1 px-5 pt-3" style={{ paddingBottom: 16 }}>
          <AddressManager fullScreen />
        </View>
      </View>
    </PanelSafeArea>
  );
}
