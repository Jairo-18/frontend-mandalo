import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { PanelHeader, PanelSafeArea } from '@/components/ui/panel-header';
import { getAppColors } from '@/lib/app-colors';

type Props = {
  title: string;
  menu?: ReactNode;
};

/**
 * Aviso compartido para las rutas del repartidor que no tienen sentido
 * mientras la cuenta sigue en revisión (Mis cobros, Mis chats — no puede
 * haber pedidos ni conversaciones todavía). El detalle completo (nota del
 * admin, botón "Consultar estado", reenviar documentos) vive solo en el
 * home (`delivery/index.tsx`) — acá basta con explicar por qué está vacío,
 * para no dejarlo pensando que es un error o que simplemente no tiene datos.
 */
export function InactiveAccountNotice({ title, menu }: Props) {
  return (
    <PanelSafeArea>
      <StatusBar style="light" />
      <View className="flex-1 bg-surface">
        <PanelHeader title={title} menu={menu} />
        <View className="flex-1 items-center justify-center px-8">
          <View className="mb-5 h-16 w-16 items-center justify-center">
            <Ionicons
              name="hourglass-outline"
              size={38}
              color={getAppColors().primaryColor}
            />
          </View>
          <Text className="text-center text-lg font-extrabold text-ink">
            Cuenta en proceso de habilitación
          </Text>
          <Text className="mt-2 text-center text-sm leading-5 text-muted">
            Todavía no puedes usar esta sección: un administrador está
            verificando tus datos. Consulta el estado desde "Pedidos".
          </Text>
        </View>
      </View>
    </PanelSafeArea>
  );
}
