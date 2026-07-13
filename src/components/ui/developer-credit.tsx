import { Linking, Pressable, Text } from 'react-native';

const PORTFOLIO_URL = 'https://jhonlegardaportfolio.netlify.app/home';

/**
 * Crédito del desarrollador (pie de los sidebars, login y registros):
 * tocar abre el portafolio en el navegador.
 */
export function DeveloperCredit() {
  return (
    <Pressable
      onPress={() => Linking.openURL(PORTFOLIO_URL).catch(() => {})}
      hitSlop={8}
      className="items-center py-2 active:opacity-70"
    >
      <Text className="text-[11px] text-muted">
        Desarrollado por{' '}
        <Text className="font-bold text-primary">Jhon Legarda</Text>
      </Text>
    </Pressable>
  );
}
