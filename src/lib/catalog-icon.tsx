import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export type IoniconsName = keyof typeof Ionicons.glyphMap;
export type MciName = keyof typeof MaterialCommunityIcons.glyphMap;

/** Icono de categoría/etiqueta ya resuelto contra su librería real. */
export type CatalogIconRef =
  | { family: 'ionicons'; name: IoniconsName }
  | { family: 'mci'; name: MciName };

/**
 * Prefijo que distingue un icono de MaterialCommunityIcons guardado en la DB
 * ("mci:hamburger") de uno de Ionicons (sin prefijo, "pizza-outline" —
 * formato usado desde siempre, así que los datos viejos siguen andando tal
 * cual sin migración).
 */
const MCI_PREFIX = 'mci:';

/** Arma el string que se guarda en `icon` a partir de lo elegido en el picker. */
export function toCatalogIconValue(icon: CatalogIconRef): string {
  return icon.family === 'mci' ? `${MCI_PREFIX}${icon.name}` : icon.name;
}

/**
 * Valida un icono guardado (de cualquiera de las 2 librerías) contra su
 * respaldo si no existe o el string no correspondía a ningún glyph real.
 */
export function catalogIcon(
  icon: string | null | undefined,
  fallback: IoniconsName,
): CatalogIconRef {
  if (icon?.startsWith(MCI_PREFIX)) {
    const name = icon.slice(MCI_PREFIX.length);
    if (name in MaterialCommunityIcons.glyphMap) {
      return { family: 'mci', name: name as MciName };
    }
  } else if (icon && icon in Ionicons.glyphMap) {
    return { family: 'ionicons', name: icon as IoniconsName };
  }
  return { family: 'ionicons', name: fallback };
}

type Props = {
  icon: CatalogIconRef;
  size: number;
  color: string;
};

/** Pinta un `CatalogIconRef` con el componente de la librería que le toca. */
export function CatalogIconView({ icon, size, color }: Props) {
  if (icon.family === 'mci') {
    return <MaterialCommunityIcons name={icon.name} size={size} color={color} />;
  }
  return <Ionicons name={icon.name} size={size} color={color} />;
}
