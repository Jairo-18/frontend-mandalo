import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddressManager } from '@/components/client/address-manager';
import { MenuButton } from '@/components/client/menu-button';
import { PanelHeader } from '@/components/ui/panel-header';

/**
 * "Mis direcciones" del drawer del cliente: la misma gestión de la hoja
 * "Enviar a…" del home (`AddressManager`), pero a pantalla completa.
 */
export default function AddressesScreen() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-dark">
      <StatusBar style="light" />

      <View className="flex-1 bg-surface">
        <PanelHeader title="Mis direcciones" menu={<MenuButton />} />

        <View className="flex-1 px-5 pb-4 pt-3">
          <AddressManager fullScreen />
        </View>
      </View>
    </SafeAreaView>
  );
}
