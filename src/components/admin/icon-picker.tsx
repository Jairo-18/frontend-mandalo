import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { SearchBar } from '@/components/ui/search-bar';

type IconName = keyof typeof Ionicons.glyphMap;

type IconEntry = {
  name: IconName;
  /** Palabras clave EN ESPAÑOL para el buscador (además del nombre). */
  keywords: string;
};

/**
 * Iconos que puede elegir el admin para categorías de producto y etiquetas de
 * negocio (Ionicons, los mismos de toda la app). El `name` es lo que se
 * guarda en `icon` en el backend. Cada entrada trae palabras clave en español
 * para que el buscador funcione sin saber el nombre en inglés.
 */
const ICON_ENTRIES: IconEntry[] = [
  // ---- Comida y bebida ----
  { name: 'fast-food-outline', keywords: 'hamburguesa comida rapida' },
  { name: 'restaurant-outline', keywords: 'restaurante cubiertos comida' },
  { name: 'pizza-outline', keywords: 'pizza pizzeria' },
  { name: 'cafe-outline', keywords: 'cafe tinto taza bebida caliente' },
  { name: 'ice-cream-outline', keywords: 'helado postre heladeria' },
  { name: 'fish-outline', keywords: 'pescado pescaderia mar' },
  { name: 'nutrition-outline', keywords: 'manzana fruta verdura saludable' },
  { name: 'egg-outline', keywords: 'huevo desayuno' },
  { name: 'pint-outline', keywords: 'cerveza jarra vaso' },
  { name: 'beer-outline', keywords: 'cerveza licor bar' },
  { name: 'wine-outline', keywords: 'vino copa licor licoreria' },
  { name: 'water-outline', keywords: 'agua gota bebida' },
  { name: 'flame-outline', keywords: 'fuego asado parrilla brasa' },
  { name: 'bonfire-outline', keywords: 'fogata leña hoguera' },
  // ---- Naturaleza y mascotas ----
  { name: 'leaf-outline', keywords: 'hoja natural vegano organico' },
  { name: 'rose-outline', keywords: 'rosa flor' },
  { name: 'flower-outline', keywords: 'flor floristeria jardin' },
  { name: 'paw-outline', keywords: 'mascota veterinaria perro gato huella' },
  { name: 'bug-outline', keywords: 'insecto fumigacion plaga' },
  { name: 'earth-outline', keywords: 'mundo tierra planeta' },
  { name: 'planet-outline', keywords: 'planeta espacio saturno' },
  { name: 'sunny-outline', keywords: 'sol dia clima' },
  { name: 'moon-outline', keywords: 'luna noche nocturno' },
  { name: 'rainy-outline', keywords: 'lluvia clima' },
  { name: 'snow-outline', keywords: 'nieve frio congelado' },
  { name: 'thermometer-outline', keywords: 'termometro temperatura' },
  // ---- Comercio y dinero ----
  { name: 'storefront-outline', keywords: 'tienda negocio local' },
  { name: 'cart-outline', keywords: 'carrito mercado compras' },
  { name: 'basket-outline', keywords: 'canasta mercado compras' },
  { name: 'bag-handle-outline', keywords: 'bolsa compras boutique' },
  { name: 'gift-outline', keywords: 'regalo detalle sorpresa' },
  { name: 'pricetag-outline', keywords: 'etiqueta precio oferta' },
  { name: 'pricetags-outline', keywords: 'etiquetas precios ofertas' },
  { name: 'cash-outline', keywords: 'efectivo dinero billete' },
  { name: 'card-outline', keywords: 'tarjeta pago credito' },
  { name: 'wallet-outline', keywords: 'billetera cartera' },
  { name: 'receipt-outline', keywords: 'factura recibo cuenta' },
  { name: 'cube-outline', keywords: 'paquete caja producto envio' },
  { name: 'diamond-outline', keywords: 'diamante joya joyeria lujo' },
  { name: 'watch-outline', keywords: 'reloj pulsera relojeria' },
  { name: 'glasses-outline', keywords: 'gafas lentes optica' },
  { name: 'shirt-outline', keywords: 'ropa camiseta moda boutique' },
  { name: 'briefcase-outline', keywords: 'maletin oficina trabajo' },
  { name: 'business-outline', keywords: 'edificio empresa oficina' },
  // ---- Premios y diversión ----
  { name: 'trophy-outline', keywords: 'trofeo premio campeonato' },
  { name: 'medal-outline', keywords: 'medalla premio' },
  { name: 'ribbon-outline', keywords: 'cinta premio calidad garantia' },
  { name: 'balloon-outline', keywords: 'globo fiesta cumpleaños piñateria' },
  { name: 'dice-outline', keywords: 'dados juego azar' },
  { name: 'game-controller-outline', keywords: 'videojuegos consola control' },
  { name: 'extension-puzzle-outline', keywords: 'rompecabezas jugueteria juegos' },
  { name: 'telescope-outline', keywords: 'telescopio astronomia' },
  { name: 'rocket-outline', keywords: 'cohete rapido envio express' },
  { name: 'sparkles-outline', keywords: 'brillos nuevo destacado limpio' },
  { name: 'star-outline', keywords: 'estrella favorito destacado' },
  { name: 'heart-outline', keywords: 'corazon amor favorito' },
  { name: 'happy-outline', keywords: 'feliz carita sonrisa' },
  { name: 'thumbs-up-outline', keywords: 'me gusta recomendado bueno' },
  // ---- Salud y bienestar ----
  { name: 'medkit-outline', keywords: 'botiquin drogueria farmacia salud' },
  { name: 'medical-outline', keywords: 'cruz medico salud clinica' },
  { name: 'bandage-outline', keywords: 'curita vendaje herida' },
  { name: 'fitness-outline', keywords: 'salud pulso cardio ejercicio' },
  { name: 'barbell-outline', keywords: 'pesas gimnasio gym ejercicio' },
  { name: 'pulse-outline', keywords: 'pulso ritmo cardiaco' },
  { name: 'eyedrop-outline', keywords: 'gotero laboratorio medicina' },
  { name: 'flask-outline', keywords: 'laboratorio quimica ciencia' },
  { name: 'accessibility-outline', keywords: 'accesibilidad discapacidad inclusion' },
  { name: 'body-outline', keywords: 'cuerpo persona' },
  { name: 'man-outline', keywords: 'hombre caballero' },
  { name: 'woman-outline', keywords: 'mujer dama' },
  { name: 'people-outline', keywords: 'personas grupo familia' },
  { name: 'person-outline', keywords: 'persona perfil usuario' },
  { name: 'walk-outline', keywords: 'caminar peaton paseo' },
  { name: 'footsteps-outline', keywords: 'pasos huellas caminata' },
  // ---- Deporte ----
  { name: 'basketball-outline', keywords: 'baloncesto basquet balon' },
  { name: 'football-outline', keywords: 'futbol balon deporte' },
  { name: 'american-football-outline', keywords: 'futbol americano balon' },
  { name: 'baseball-outline', keywords: 'beisbol pelota' },
  { name: 'tennisball-outline', keywords: 'tenis pelota' },
  { name: 'golf-outline', keywords: 'golf bandera' },
  { name: 'bicycle-outline', keywords: 'bicicleta ciclismo domicilio' },
  // ---- Transporte y ubicación ----
  { name: 'car-outline', keywords: 'carro auto vehiculo taller' },
  { name: 'car-sport-outline', keywords: 'carro deportivo auto' },
  { name: 'bus-outline', keywords: 'bus buseta transporte' },
  { name: 'airplane-outline', keywords: 'avion viajes vuelo agencia' },
  { name: 'boat-outline', keywords: 'barco lancha rio' },
  { name: 'train-outline', keywords: 'tren transporte' },
  { name: 'navigate-outline', keywords: 'navegacion gps flecha' },
  { name: 'compass-outline', keywords: 'brujula orientacion' },
  { name: 'map-outline', keywords: 'mapa turismo' },
  { name: 'location-outline', keywords: 'ubicacion pin lugar' },
  { name: 'trail-sign-outline', keywords: 'señal sendero letrero' },
  // ---- Hogar, construcción y servicios ----
  { name: 'home-outline', keywords: 'casa hogar inmobiliaria' },
  { name: 'bed-outline', keywords: 'cama hotel dormitorio hospedaje' },
  { name: 'key-outline', keywords: 'llave cerrajeria seguridad' },
  { name: 'construct-outline', keywords: 'herramientas construccion taller' },
  { name: 'hammer-outline', keywords: 'martillo ferreteria construccion' },
  { name: 'build-outline', keywords: 'llave inglesa reparacion mantenimiento' },
  { name: 'cut-outline', keywords: 'tijeras peluqueria barberia corte' },
  { name: 'brush-outline', keywords: 'brocha pintura pintor' },
  { name: 'color-palette-outline', keywords: 'pintura arte colores diseño' },
  { name: 'flashlight-outline', keywords: 'linterna luz' },
  { name: 'bulb-outline', keywords: 'bombillo idea electrico luz' },
  { name: 'flash-outline', keywords: 'rayo electrico energia electricista' },
  { name: 'battery-charging-outline', keywords: 'bateria carga pila' },
  { name: 'power-outline', keywords: 'encendido energia boton' },
  { name: 'magnet-outline', keywords: 'iman atraccion' },
  { name: 'umbrella-outline', keywords: 'paraguas sombrilla lluvia' },
  { name: 'trash-outline', keywords: 'basura aseo reciclaje limpieza' },
  { name: 'shield-checkmark-outline', keywords: 'escudo seguro garantia proteccion' },
  { name: 'lock-closed-outline', keywords: 'candado seguridad privado' },
  // ---- Tecnología ----
  { name: 'desktop-outline', keywords: 'computador pc escritorio' },
  { name: 'laptop-outline', keywords: 'portatil laptop computador' },
  { name: 'phone-portrait-outline', keywords: 'celular telefono movil' },
  { name: 'tablet-portrait-outline', keywords: 'tablet tableta' },
  { name: 'tv-outline', keywords: 'televisor television pantalla' },
  { name: 'camera-outline', keywords: 'camara fotografia fotos' },
  { name: 'videocam-outline', keywords: 'video camara filmacion' },
  { name: 'headset-outline', keywords: 'audifonos diadema soporte gamer' },
  { name: 'mic-outline', keywords: 'microfono karaoke sonido' },
  { name: 'musical-notes-outline', keywords: 'musica notas sonido' },
  { name: 'radio-outline', keywords: 'radio emisora' },
  { name: 'disc-outline', keywords: 'disco dj vinilo' },
  { name: 'film-outline', keywords: 'cine pelicula rollo' },
  { name: 'images-outline', keywords: 'imagenes fotos galeria' },
  { name: 'print-outline', keywords: 'impresora papeleria impresion' },
  { name: 'hardware-chip-outline', keywords: 'chip electronica tecnologia' },
  { name: 'terminal-outline', keywords: 'consola codigo sistemas' },
  { name: 'code-slash-outline', keywords: 'programacion desarrollo software' },
  { name: 'server-outline', keywords: 'servidor datos hosting' },
  { name: 'wifi-outline', keywords: 'wifi internet red' },
  { name: 'cloud-outline', keywords: 'nube clima internet' },
  { name: 'calculator-outline', keywords: 'calculadora contabilidad cuentas' },
  { name: 'call-outline', keywords: 'telefono llamada contacto' },
  { name: 'chatbubbles-outline', keywords: 'chat mensajes conversacion' },
  { name: 'mail-outline', keywords: 'correo carta sobre' },
  { name: 'send-outline', keywords: 'enviar avion papel mensajeria' },
  { name: 'megaphone-outline', keywords: 'megafono publicidad promocion anuncio' },
  { name: 'notifications-outline', keywords: 'campana notificacion aviso' },
  // ---- Educación y papelería ----
  { name: 'book-outline', keywords: 'libro libreria lectura' },
  { name: 'library-outline', keywords: 'biblioteca libros' },
  { name: 'school-outline', keywords: 'colegio educacion birrete graduacion' },
  { name: 'pencil-outline', keywords: 'lapiz papeleria escribir' },
  { name: 'newspaper-outline', keywords: 'periodico noticias prensa' },
  { name: 'document-text-outline', keywords: 'documento archivo papel' },
  { name: 'clipboard-outline', keywords: 'portapapeles lista inventario' },
  { name: 'folder-outline', keywords: 'carpeta archivo documentos' },
  // ---- Tiempo y varios ----
  { name: 'time-outline', keywords: 'reloj hora 24 horas' },
  { name: 'alarm-outline', keywords: 'alarma despertador' },
  { name: 'timer-outline', keywords: 'temporizador rapido cronometro' },
  { name: 'hourglass-outline', keywords: 'reloj de arena espera' },
  { name: 'calendar-outline', keywords: 'calendario agenda fecha citas' },
  { name: 'shapes-outline', keywords: 'figuras formas geometria' },
  { name: 'layers-outline', keywords: 'capas niveles' },
  { name: 'grid-outline', keywords: 'cuadricula general categorias' },
  { name: 'apps-outline', keywords: 'aplicaciones variado surtido' },
];

/** Sin tildes y en minúsculas, para que "cámara" encuentre "camara". */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

type Props = {
  /** Nombre del icono elegido ('' = sin icono). */
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
  const [search, setSearch] = useState('');

  const entries = useMemo(() => {
    // Icono guardado a mano en la DB que no está en la lista: se antepone.
    if (
      savedIcon &&
      savedIcon in Ionicons.glyphMap &&
      !ICON_ENTRIES.some((e) => e.name === savedIcon)
    ) {
      return [
        { name: savedIcon as IconName, keywords: '' },
        ...ICON_ENTRIES,
      ];
    }
    return ICON_ENTRIES;
  }, [savedIcon]);

  const filtered = useMemo(() => {
    const query = normalize(search.trim());
    if (!query) return entries;
    return entries.filter(
      (entry) =>
        entry.name.includes(query) ||
        normalize(entry.keywords).includes(query) ||
        // El elegido siempre visible para poder deseleccionarlo.
        entry.name === value,
    );
  }, [entries, search, value]);

  return (
    <View className="mb-6">
      <View className="mb-3 rounded-xl border border-gray-200">
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar icono (ej: comida, carro, tijeras…)"
        />
      </View>

      {filtered.length === 0 ? (
        <Text className="py-4 text-center text-xs text-muted">
          No hay iconos para esa búsqueda.
        </Text>
      ) : (
        <View className="flex-row flex-wrap gap-2">
          {filtered.map((entry) => {
            const selected = value === entry.name;
            return (
              <Pressable
                key={entry.name}
                onPress={() => onChange(selected ? '' : entry.name)}
                className={`h-12 w-12 items-center justify-center rounded-xl border ${
                  selected
                    ? 'border-primary bg-primary-tint'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <Ionicons
                  name={entry.name}
                  size={22}
                  color={selected ? '#FF5A3C' : '#7A7A8A'}
                />
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
