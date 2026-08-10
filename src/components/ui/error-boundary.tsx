import { Ionicons } from '@expo/vector-icons';
import { Component, ReactNode } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { getAppColors } from '@/lib/app-colors';

type Props = { children: ReactNode };
type State = { error: Error | null };

/**
 * Red de seguridad ante errores de render no capturados: sin esto, cualquier
 * excepción durante un render (en cualquier pantalla) deja la app con una
 * pantalla en blanco y congelada, sin ningún mensaje ni forma de
 * recuperarse — así se ve en un APK de producción, sin el redbox de Metro
 * (bug real reportado: direcciones en Android quedaba "bugueado" tras
 * editar). Con este boundary, en vez de eso se ve un aviso con botón de
 * reintentar, que vuelve a montar el árbol hijo desde cero.
 *
 * Los Error Boundaries de React SOLO pueden ser clases (no hay hook
 * equivalente todavía) — por eso no es un componente de función como el
 * resto del código.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    if (__DEV__) console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <View className="flex-1 items-center justify-center bg-surface px-8">
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={getAppColors().mutedColor}
          />
          <Text className="mt-4 text-center text-base font-bold text-ink">
            Algo salió mal
          </Text>
          <Text className="mt-1 text-center text-sm text-muted">
            Ocurrió un error inesperado. Intenta de nuevo.
          </Text>
          <View className="mt-5 w-full max-w-[280px]">
            <Button
              label="Reintentar"
              onPress={() => this.setState({ error: null })}
            />
          </View>
        </View>
      );
    }
    return this.props.children;
  }
}
