import { Linking, Text } from 'react-native';

const PORTFOLIO_URL = 'https://jhonlegardaportfolio.netlify.app/home';

/**
 * Crédito del desarrollador (pie de los sidebars, login y registros). Solo el
 * nombre "Jhon Legarda" es tocable (abre el portafolio) — el texto completo
 * queda cerca de "Cerrar sesión" en los drawers y un área tocable grande
 * causaba toques accidentales que abrían el navegador en vez de cerrar sesión.
 */
export function DeveloperCredit() {
  return (
    <Text className="py-2 text-center text-[11px] text-muted">
      Desarrollado por{' '}
      <Text
        onPress={() => Linking.openURL(PORTFOLIO_URL).catch(() => {})}
        suppressHighlighting
        className="font-bold text-primary"
      >
        Jhon Legarda
      </Text>
    </Text>
  );
}
