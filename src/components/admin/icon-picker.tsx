import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { SearchBar } from '@/components/ui/search-bar';
import {
  CatalogIconRef,
  CatalogIconView,
  IoniconsName,
  MciName,
  toCatalogIconValue,
} from '@/lib/catalog-icon';
import { getAppColors } from '@/lib/app-colors';
import { useResolvedAppColors } from '@/hooks/use-resolved-app-colors';

type IconEntry = {
  ref: CatalogIconRef;
  /** Palabras clave EN ESPAÑOL para el buscador (además del nombre). */
  keywords: string;
};

function ion(name: IoniconsName, keywords: string): IconEntry {
  return { ref: { family: 'ionicons', name }, keywords };
}

function mci(name: MciName, keywords: string): IconEntry {
  return { ref: { family: 'mci', name }, keywords };
}

/**
 * Iconos que puede elegir el admin para categorías de producto y etiquetas de
 * negocio. Dos librerías (ambas ya vienen con `@expo/vector-icons`, sin
 * dependencia nueva): Ionicons para todo lo general (mismos de toda la app)
 * y MaterialCommunityIcons SOLO para comida — Ionicons apenas tiene una
 * docena de iconos de comida en total, MaterialCommunityIcons tiene cientos.
 * El valor guardado en `icon` distingue la librería con el prefijo "mci:"
 * (ver `lib/catalog-icon.ts`); sin prefijo se asume Ionicons como siempre.
 */
const ICON_ENTRIES: IconEntry[] = [
  // ---- Comida y bebida (Ionicons) ----
  ion('fast-food-outline', 'hamburguesa comida rapida'),
  ion('restaurant-outline', 'restaurante cubiertos comida'),
  ion('pizza-outline', 'pizza pizzeria'),
  ion('cafe-outline', 'cafe tinto taza bebida caliente'),
  ion('ice-cream-outline', 'helado postre heladeria'),
  ion('fish-outline', 'pescado pescaderia mar'),
  ion('nutrition-outline', 'manzana fruta verdura saludable'),
  ion('egg-outline', 'huevo desayuno'),
  ion('pint-outline', 'cerveza jarra vaso'),
  ion('beer-outline', 'cerveza licor bar'),
  ion('wine-outline', 'vino copa licor licoreria'),
  ion('water-outline', 'agua gota bebida'),
  ion('flame-outline', 'fuego asado parrilla brasa'),
  ion('bonfire-outline', 'fogata leña hoguera'),
  // ---- Comida y bebida (MaterialCommunityIcons — mucho más específicos) ----
  mci('hamburger', 'hamburguesa burger comida rapida'),
  mci('taco', 'taco comida mexicana'),
  mci('food-hot-dog', 'perro caliente hotdog salchipapa'),
  mci('noodles', 'fideos pasta asiatica ramen sopa'),
  mci('pasta', 'pasta espagueti italiana macarrones'),
  mci('rice', 'arroz'),
  mci('popcorn', 'crispetas palomitas cine'),
  mci('pretzel', 'pretzel'),
  mci('sausage', 'salchicha embutido chorizo carniceria'),
  mci('bread-slice', 'pan panaderia tostada'),
  mci('bread-slice-outline', 'pan panaderia tostada'),
  mci('cheese', 'queso lacteo'),
  mci('cheese-off', 'sin queso sin lacteos'),
  mci('cake', 'torta pastel cumpleaños ponque'),
  mci('cake-variant', 'torta decorada pasteleria repostería'),
  mci('cake-variant-outline', 'torta decorada pasteleria reposteria'),
  mci('cupcake', 'cupcake ponque magdalena'),
  mci('cookie', 'galleta'),
  mci('cookie-outline', 'galleta'),
  mci('candy', 'dulce caramelo dulceria'),
  mci('candy-outline', 'dulce caramelo dulceria'),
  mci('candycane', 'baston de dulce navidad'),
  mci('muffin', 'mecato panecillo ponquesito'),
  mci('french-fries', 'papas fritas'),
  mci('egg-fried', 'huevo frito desayuno'),
  mci('egg-easter', 'huevo de pascua decorado'),
  mci('corn', 'maiz mazorca choclo'),
  mci('corn-off', 'sin maiz'),
  mci('carrot', 'zanahoria verdura'),
  mci('mushroom', 'champiñon hongo seta'),
  mci('mushroom-outline', 'champiñon hongo seta'),
  mci('peanut', 'mani cacahuate'),
  mci('peanut-outline', 'mani cacahuate'),
  mci('fruit-cherries', 'cerezas fruta'),
  mci('fruit-citrus', 'citricos naranja limon mandarina'),
  mci('fruit-grapes', 'uvas fruta vino'),
  mci('fruit-grapes-outline', 'uvas fruta vino'),
  mci('fruit-pear', 'pera fruta'),
  mci('fruit-pineapple', 'piña fruta'),
  mci('fruit-watermelon', 'sandia patilla fruta'),
  mci('food-apple-outline', 'manzana fruta'),
  mci('food-croissant', 'croissant cachito panaderia'),
  mci('food-drumstick-outline', 'pierna muslo pollo asado'),
  mci('food-steak', 'carne filete res asado'),
  mci('food-takeout-box-outline', 'comida para llevar domicilio caja'),
  mci('food-turkey', 'pavo navidad'),
  mci('food-variant', 'plato de comida general'),
  mci('food-fork-drink', 'comer y beber restaurante'),
  mci('barley', 'cebada malta cerveceria artesanal'),
  mci('coffee-to-go', 'cafe para llevar vaso desechable'),
  mci('coffee-to-go-outline', 'cafe para llevar vaso desechable'),
  mci('coffee-maker', 'cafetera electrodomestico'),
  mci('kettle', 'tetera pava agua caliente'),
  mci('kettle-outline', 'tetera pava agua caliente'),
  mci('tea', 'te aromatica infusion'),
  mci('tea-outline', 'te aromatica infusion'),
  mci('glass-cocktail', 'coctel coctelería bar'),
  mci('glass-mug-variant', 'jarra de cerveza chop'),
  mci('bottle-soda-classic-outline', 'gaseosa refresco soda'),
  mci('bottle-wine-outline', 'botella de vino vinoteca'),
  mci('chef-hat', 'gorro de chef cocina cocinero'),
  mci('food-halal', 'comida halal'),
  mci('food-kosher', 'comida kosher'),
  // ---- Naturaleza y mascotas ----
  ion('leaf-outline', 'hoja natural vegano organico'),
  ion('rose-outline', 'rosa flor'),
  ion('flower-outline', 'flor floristeria jardin'),
  ion('paw-outline', 'mascota veterinaria perro gato huella'),
  ion('bug-outline', 'insecto fumigacion plaga'),
  ion('earth-outline', 'mundo tierra planeta'),
  ion('planet-outline', 'planeta espacio saturno'),
  ion('sunny-outline', 'sol dia clima'),
  ion('moon-outline', 'luna noche nocturno'),
  ion('rainy-outline', 'lluvia clima'),
  ion('snow-outline', 'nieve frio congelado'),
  ion('thermometer-outline', 'termometro temperatura'),
  // ---- Comercio y dinero ----
  ion('storefront-outline', 'tienda negocio local'),
  ion('cart-outline', 'carrito mercado compras'),
  ion('basket-outline', 'canasta mercado compras'),
  ion('bag-handle-outline', 'bolsa compras boutique'),
  ion('gift-outline', 'regalo detalle sorpresa'),
  ion('pricetag-outline', 'etiqueta precio oferta'),
  ion('pricetags-outline', 'etiquetas precios ofertas'),
  ion('cash-outline', 'efectivo dinero billete'),
  ion('card-outline', 'tarjeta pago credito'),
  ion('wallet-outline', 'billetera cartera'),
  ion('receipt-outline', 'factura recibo cuenta'),
  ion('cube-outline', 'paquete caja producto envio'),
  ion('diamond-outline', 'diamante joya joyeria lujo'),
  ion('watch-outline', 'reloj pulsera relojeria'),
  ion('glasses-outline', 'gafas lentes optica'),
  ion('shirt-outline', 'ropa camiseta moda boutique'),
  ion('briefcase-outline', 'maletin oficina trabajo'),
  ion('business-outline', 'edificio empresa oficina'),
  // ---- Premios y diversión ----
  ion('trophy-outline', 'trofeo premio campeonato'),
  ion('medal-outline', 'medalla premio'),
  ion('ribbon-outline', 'cinta premio calidad garantia'),
  ion('balloon-outline', 'globo fiesta cumpleaños piñateria'),
  ion('dice-outline', 'dados juego azar'),
  ion('game-controller-outline', 'videojuegos consola control'),
  ion('extension-puzzle-outline', 'rompecabezas jugueteria juegos'),
  ion('telescope-outline', 'telescopio astronomia'),
  ion('rocket-outline', 'cohete rapido envio express'),
  ion('sparkles-outline', 'brillos nuevo destacado limpio'),
  ion('star-outline', 'estrella favorito destacado'),
  ion('heart-outline', 'corazon amor favorito'),
  ion('happy-outline', 'feliz carita sonrisa'),
  ion('thumbs-up-outline', 'me gusta recomendado bueno'),
  // ---- Salud y bienestar ----
  ion('medkit-outline', 'botiquin drogueria farmacia salud'),
  ion('medical-outline', 'cruz medico salud clinica'),
  ion('bandage-outline', 'curita vendaje herida'),
  ion('fitness-outline', 'salud pulso cardio ejercicio'),
  ion('barbell-outline', 'pesas gimnasio gym ejercicio'),
  ion('pulse-outline', 'pulso ritmo cardiaco'),
  ion('eyedrop-outline', 'gotero laboratorio medicina'),
  ion('flask-outline', 'laboratorio quimica ciencia'),
  ion('accessibility-outline', 'accesibilidad discapacidad inclusion'),
  ion('body-outline', 'cuerpo persona'),
  ion('man-outline', 'hombre caballero'),
  ion('woman-outline', 'mujer dama'),
  ion('people-outline', 'personas grupo familia'),
  ion('person-outline', 'persona perfil usuario'),
  ion('walk-outline', 'caminar peaton paseo'),
  ion('footsteps-outline', 'pasos huellas caminata'),
  // ---- Deporte ----
  ion('basketball-outline', 'baloncesto basquet balon'),
  ion('football-outline', 'futbol balon deporte'),
  ion('american-football-outline', 'futbol americano balon'),
  ion('baseball-outline', 'beisbol pelota'),
  ion('tennisball-outline', 'tenis pelota'),
  ion('golf-outline', 'golf bandera'),
  ion('bicycle-outline', 'bicicleta ciclismo domicilio'),
  // ---- Transporte y ubicación ----
  ion('car-outline', 'carro auto vehiculo taller'),
  ion('car-sport-outline', 'carro deportivo auto'),
  ion('bus-outline', 'bus buseta transporte'),
  ion('airplane-outline', 'avion viajes vuelo agencia'),
  ion('boat-outline', 'barco lancha rio'),
  ion('train-outline', 'tren transporte'),
  ion('navigate-outline', 'navegacion gps flecha'),
  ion('compass-outline', 'brujula orientacion'),
  ion('map-outline', 'mapa turismo'),
  ion('location-outline', 'ubicacion pin lugar'),
  ion('trail-sign-outline', 'señal sendero letrero'),
  // ---- Hogar, construcción y servicios ----
  ion('home-outline', 'casa hogar inmobiliaria'),
  ion('bed-outline', 'cama hotel dormitorio hospedaje'),
  ion('key-outline', 'llave cerrajeria seguridad'),
  ion('construct-outline', 'herramientas construccion taller'),
  ion('hammer-outline', 'martillo ferreteria construccion'),
  ion('build-outline', 'llave inglesa reparacion mantenimiento'),
  ion('cut-outline', 'tijeras peluqueria barberia corte'),
  ion('brush-outline', 'brocha pintura pintor'),
  ion('color-palette-outline', 'pintura arte colores diseño'),
  ion('flashlight-outline', 'linterna luz'),
  ion('bulb-outline', 'bombillo idea electrico luz'),
  ion('flash-outline', 'rayo electrico energia electricista'),
  ion('battery-charging-outline', 'bateria carga pila'),
  ion('power-outline', 'encendido energia boton'),
  ion('magnet-outline', 'iman atraccion'),
  ion('umbrella-outline', 'paraguas sombrilla lluvia'),
  ion('trash-outline', 'basura aseo reciclaje limpieza'),
  ion('shield-checkmark-outline', 'escudo seguro garantia proteccion'),
  ion('lock-closed-outline', 'candado seguridad privado'),
  // ---- Tecnología ----
  ion('desktop-outline', 'computador pc escritorio'),
  ion('laptop-outline', 'portatil laptop computador'),
  ion('phone-portrait-outline', 'celular telefono movil'),
  ion('tablet-portrait-outline', 'tablet tableta'),
  ion('tv-outline', 'televisor television pantalla'),
  ion('camera-outline', 'camara fotografia fotos'),
  ion('videocam-outline', 'video camara filmacion'),
  ion('headset-outline', 'audifonos diadema soporte gamer'),
  ion('mic-outline', 'microfono karaoke sonido'),
  ion('musical-notes-outline', 'musica notas sonido'),
  ion('radio-outline', 'radio emisora'),
  ion('disc-outline', 'disco dj vinilo'),
  ion('film-outline', 'cine pelicula rollo'),
  ion('images-outline', 'imagenes fotos galeria'),
  ion('print-outline', 'impresora papeleria impresion'),
  ion('hardware-chip-outline', 'chip electronica tecnologia'),
  ion('terminal-outline', 'consola codigo sistemas'),
  ion('code-slash-outline', 'programacion desarrollo software'),
  ion('server-outline', 'servidor datos hosting'),
  ion('wifi-outline', 'wifi internet red'),
  ion('cloud-outline', 'nube clima internet'),
  ion('calculator-outline', 'calculadora contabilidad cuentas'),
  ion('call-outline', 'telefono llamada contacto'),
  ion('chatbubbles-outline', 'chat mensajes conversacion'),
  ion('mail-outline', 'correo carta sobre'),
  ion('send-outline', 'enviar avion papel mensajeria'),
  ion('megaphone-outline', 'megafono publicidad promocion anuncio'),
  ion('notifications-outline', 'campana notificacion aviso'),
  // ---- Educación y papelería ----
  ion('book-outline', 'libro libreria lectura'),
  ion('library-outline', 'biblioteca libros'),
  ion('school-outline', 'colegio educacion birrete graduacion'),
  ion('pencil-outline', 'lapiz papeleria escribir'),
  ion('newspaper-outline', 'periodico noticias prensa'),
  ion('document-text-outline', 'documento archivo papel'),
  ion('clipboard-outline', 'portapapeles lista inventario'),
  ion('folder-outline', 'carpeta archivo documentos'),
  // ---- Tiempo y varios ----
  ion('time-outline', 'reloj hora 24 horas'),
  ion('alarm-outline', 'alarma despertador'),
  ion('timer-outline', 'temporizador rapido cronometro'),
  ion('hourglass-outline', 'reloj de arena espera'),
  ion('calendar-outline', 'calendario agenda fecha citas'),
  ion('shapes-outline', 'figuras formas geometria'),
  ion('layers-outline', 'capas niveles'),
  ion('grid-outline', 'cuadricula general categorias'),
  ion('apps-outline', 'aplicaciones variado surtido'),
  // ---- Ampliación 2026-07-11 ----
  ion('ticket-outline', 'boleta entrada eventos rifa'),
  ion('barcode-outline', 'codigo de barras producto'),
  ion('qr-code-outline', 'codigo qr escanear'),
  ion('scale-outline', 'balanza peso carniceria granero'),
  ion('speedometer-outline', 'velocimetro rapido taller motos'),
  ion('id-card-outline', 'identificacion carnet documento'),
  ion('globe-outline', 'mundo internet idiomas'),
  ion('flag-outline', 'bandera meta pais'),
  ion('bookmark-outline', 'marcador guardado favorito'),
  ion('eye-outline', 'ojo optica vision mirar'),
  ion('paper-plane-outline', 'avion de papel mensajeria envio'),
  ion('stats-chart-outline', 'estadisticas grafica finanzas'),
  ion('trending-up-outline', 'crecimiento subida inversion'),
  ion('list-outline', 'lista items menu'),
  ion('options-outline', 'opciones ajustes controles'),
  ion('checkmark-circle-outline', 'chulo aprobado verificado'),
  ion('warning-outline', 'advertencia peligro precaucion'),
  ion('female-outline', 'mujer femenino genero'),
  ion('male-outline', 'hombre masculino genero'),
  ion('finger-print-outline', 'huella identidad biometria'),
  ion('ear-outline', 'oreja audicion audifonos medicos'),
  ion('easel-outline', 'caballete arte pintura tablero'),
  ion('bowling-ball-outline', 'bolos boliche bola'),
  ion('help-buoy-outline', 'salvavidas ayuda piscina rescate'),
  ion('save-outline', 'guardar diskette respaldo'),
  ion('scan-outline', 'escanear lector'),
  ion('share-social-outline', 'compartir redes sociales'),
  ion('link-outline', 'enlace cadena conexion'),
  ion('pin-outline', 'chinche tachuela fijar'),
  ion('journal-outline', 'diario cuaderno agenda'),
  ion('reader-outline', 'lector documento lectura'),
  ion('archive-outline', 'archivo caja almacenamiento bodega'),
  ion('file-tray-outline', 'bandeja documentos oficina'),
  ion('albums-outline', 'albumes coleccion fotos'),
  ion('copy-outline', 'copiar duplicar fotocopias'),
];

/** Sin tildes y en minúsculas, para que "cámara" encuentre "camara". */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

type Props = {
  /** Nombre del icono elegido (string vacío = sin icono). */
  value: string;
  onChange: (icon: string) => void;
  /** Icono ya guardado que podría no estar en la lista (se antepone). */
  savedIcon?: string | null;
};

/**
 * Grilla de iconos con buscador (nombre del icono o palabras clave en
 * español). Tocar selecciona; tocar de nuevo deselecciona. Va dentro del
 * scroll del FormModal.
 */
export function IconPicker({ value, onChange, savedIcon }: Props) {
  const colors = useResolvedAppColors();
  const [search, setSearch] = useState('');

  const entries = useMemo(() => {
    // Icono guardado a mano en la DB que no está en la lista: se antepone.
    if (!savedIcon) return ICON_ENTRIES;
    const alreadyListed = ICON_ENTRIES.some(
      (e) => toCatalogIconValue(e.ref) === savedIcon,
    );
    if (alreadyListed) return ICON_ENTRIES;

    const isMci = savedIcon.startsWith('mci:');
    const rawName = isMci ? savedIcon.slice(4) : savedIcon;
    const ref: CatalogIconRef = isMci
      ? { family: 'mci', name: rawName as MciName }
      : { family: 'ionicons', name: rawName as IoniconsName };
    return [{ ref, keywords: '' }, ...ICON_ENTRIES];
  }, [savedIcon]);

  const filtered = useMemo(() => {
    const query = normalize(search.trim());
    if (!query) return entries;
    return entries.filter(
      (entry) =>
        entry.ref.name.includes(query) ||
        normalize(entry.keywords).includes(query) ||
        // El elegido siempre visible para poder deseleccionarlo.
        toCatalogIconValue(entry.ref) === value,
    );
  }, [entries, search, value]);

  return (
    <View className="mb-6">
      <View className="mb-3 rounded-xl border border-border">
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar icono (ej: taco, hamburguesa, tijeras…)"
        />
      </View>

      {filtered.length === 0 ? (
        <Text className="py-4 text-center text-xs text-muted">
          No hay iconos para esa búsqueda.
        </Text>
      ) : (
        // Altura acotada con scroll propio (la lista creció) — nested para
        // que funcione dentro del scroll del FormModal en Android.
        <ScrollView
          style={{ maxHeight: 272 }}
          nestedScrollEnabled
          contentContainerStyle={{ paddingVertical: 4 }}
          className="rounded-xl border border-border bg-card"
        >
          <View className="flex-row flex-wrap justify-center gap-2 px-2">
            {filtered.map((entry) => {
              const entryValue = toCatalogIconValue(entry.ref);
              const selected = value === entryValue;
              return (
                <Pressable
                  key={entryValue}
                  onPress={() => onChange(selected ? '' : entryValue)}
                  className={`h-12 w-12 items-center justify-center rounded-xl border ${
                    selected
                      ? 'border-primary bg-primary-tint'
                      : 'border-border bg-card'
                  }`}
                >
                  <CatalogIconView
                    icon={entry.ref}
                    size={22}
                    color={selected ? colors.primaryColor : colors.mutedColor}
                  />
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
