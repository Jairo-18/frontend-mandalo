import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { FlatList, Platform, Pressable, Text, useWindowDimensions, View } from 'react-native';

import { HomeHeroCard } from '@/components/client/home-hero-card';
import { DEFAULT_BUSINESS_LOGO } from '@/lib/default-images';
import { useWebHorizontalScroll } from '@/hooks/use-web-horizontal-scroll';
import { promosPerRow } from '@/lib/grid-style';
import { formatPrice } from '@/lib/price';
import { businessDisplayName } from '@/services/explore';
import { Promotion, promotionsService } from '@/services/promotions';

/** Cada cuánto pasa sola a la siguiente diapositiva. */
const AUTOPLAY_MS = 5000;
/** Margen lateral del home (`px-5`). */
const SIDE = 20;
/** Separación entre diapositivas cuando se ven varias a la vez. */
const GAP = 12;

type Slide = { key: string; promo: Promotion | null };

type Props = {
  /** Primer nombre para el saludo de la primera diapositiva. */
  name?: string;
  /** Ubicación del cliente: solo promos de negocios cercanos. */
  nearLat: number | null;
  nearLng: number | null;
  onOpenStore: (organizationalId: number) => void;
};

/**
 * Tarjeta de marca del home convertida en carrusel: primero el saludo de
 * siempre y después las publicidades vigentes de negocios cercanos ("Mis
 * publicidades" del panel del negocio). Pasa sola cada 5 s, se puede
 * deslizar (se pausa mientras se toca) y tocar una promo abre la tienda.
 * Sin promociones cerca queda solo el saludo, como antes.
 */
export function HomePromoCarousel({ name, nearLat, nearLng, onOpenStore }: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const available = screenWidth - SIDE * 2;
  // Celular: una diapositiva a lo ancho. Tablet/web: 2–3 a la vez (si no,
  // el banner 16:9 a todo el ancho salía enorme).
  const perView = promosPerRow(available);
  const width = Math.floor((available - GAP * (perView - 1)) / perView);
  const height = Math.round((width * 9) / 16); // banner 16:9
  const step = width + GAP;

  const [promos, setPromos] = useState<Promotion[]>([]);
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  const listRef = useRef<FlatList<Slide>>(null);
  const draggingRef = useRef(false);
  // Web: rueda del mouse y arrastre mueven el carrusel (ver el hook).
  const webScrollRef = useWebHorizontalScroll();

  // Promos cercanas (cambia la dirección → se vuelven a pedir).
  useEffect(() => {
    let alive = true;
    const coords =
      nearLat != null && nearLng != null ? { latitude: nearLat, longitude: nearLng } : null;
    promotionsService
      .feed(coords)
      .then((res) => {
        if (alive) setPromos(res.data);
      })
      .catch(() => {
        // Silencioso: sin promos queda el saludo.
      });
    return () => {
      alive = false;
    };
  }, [nearLat, nearLng]);

  const slides: Slide[] = [
    { key: 'hero', promo: null },
    ...promos.map((promo) => ({ key: `promo-${promo.id}`, promo })),
  ];

  // Posiciones posibles (con varias a la vez, la última "página" muestra las
  // últimas `perView`).
  const positions = Math.max(1, slides.length - perView + 1);

  // Autoplay: avanza cada 5 s (vuelve al inicio al final). No corre si todo
  // cabe en pantalla ni mientras el usuario la está arrastrando.
  // Al usar las flechas se reinicia la cuenta de los 5 s (si no, podía
  // avanzar solo justo después de un toque).
  const [manualTick, setManualTick] = useState(0);
  useEffect(() => {
    if (positions < 2) return;
    const timer = setInterval(() => {
      if (draggingRef.current) return;
      const next = (indexRef.current + 1) % positions;
      indexRef.current = next;
      setIndex(next);
      listRef.current?.scrollToOffset({ offset: next * step, animated: true });
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [positions, step, manualTick]);

  // Flechas ‹ › (web y tablet): en escritorio no hay gesto de deslizar a
  // mano. Dan la vuelta en los extremos, igual que el autoplay.
  const showArrows = positions > 1 && (perView > 1 || Platform.OS === 'web');
  function go(delta: number) {
    const next = (indexRef.current + delta + positions) % positions;
    indexRef.current = next;
    setIndex(next);
    setManualTick((t) => t + 1);
    listRef.current?.scrollToOffset({ offset: next * step, animated: true });
  }

  return (
    <View className="px-5 pt-4">
      <View style={{ width: available, height }}>
        <FlatList
          ref={(r) => {
            listRef.current = r;
            webScrollRef(r);
          }}
          data={slides}
          keyExtractor={(s) => s.key}
          horizontal
          // Encaja diapositiva por diapositiva (sirve igual con 1 o varias a
          // la vista; `pagingEnabled` pagina por el ancho de la vista entera).
          snapToInterval={step}
          decelerationRate="fast"
          disableIntervalMomentum
          showsHorizontalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
          getItemLayout={(_, i) => ({ length: step, offset: step * i, index: i })}
          onScrollBeginDrag={() => {
            draggingRef.current = true;
          }}
          onMomentumScrollEnd={(e) => {
            draggingRef.current = false;
            const current = Math.min(
              positions - 1,
              Math.round(e.nativeEvent.contentOffset.x / step),
            );
            indexRef.current = current;
            setIndex(current);
          }}
          renderItem={({ item }) => (
            <View style={{ width, height, borderRadius: 20, overflow: 'hidden' }}>
              {item.promo ? (
                <PromoSlide
                  promo={item.promo}
                  width={width}
                  height={height}
                  onPress={() =>
                    item.promo?.organizational && onOpenStore(item.promo.organizational.id)
                  }
                />
              ) : (
                <HomeHeroCard name={name} embedded={{ width, height }} />
              )}
            </View>
          )}
        />

        {showArrows && (
          <>
            <CarouselArrow side="left" height={height} onPress={() => go(-1)} />
            <CarouselArrow side="right" height={height} onPress={() => go(1)} />
          </>
        )}

        {/* Puntos: en cuál va (solo si hay promos). */}
        {positions > 1 && (
          <View className="absolute bottom-2.5 right-3 flex-row gap-1">
            {slides.slice(0, positions).map((s, i) => (
              <View
                key={s.key}
                className={`h-1.5 rounded-full ${i === index ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

/** Flecha ‹ / › a un lado del carrusel, centrada en vertical. */
function CarouselArrow({
  side,
  height,
  onPress,
}: {
  side: 'left' | 'right';
  height: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={side === 'left' ? 'Anterior' : 'Siguiente'}
      className="absolute h-10 w-10 items-center justify-center rounded-full bg-white shadow active:opacity-70"
      style={{ top: height / 2 - 20, [side]: -8 }}
    >
      <Ionicons
        name={side === 'left' ? 'chevron-back' : 'chevron-forward'}
        size={22}
        color="#222222"
      />
    </Pressable>
  );
}

function PromoSlide({
  promo,
  width,
  height,
  onPress,
}: {
  promo: Promotion;
  width: number;
  height: number;
  onPress: () => void;
}) {
  const org = promo.organizational;
  return (
    <Pressable onPress={onPress} style={{ width, height }} className="bg-dark active:opacity-90">
      <Image
        source={promo.imageUrl ? { uri: promo.imageUrl } : DEFAULT_BUSINESS_LOGO}
        style={{ position: 'absolute', width, height }}
        contentFit="contain"
        cachePolicy="memory-disk"
        transition={200}
      />
      {/* Degradado abajo: el texto se lee sobre cualquier foto. */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.8)']}
        locations={[0.3, 0.55, 1]}
        style={{ position: 'absolute', width, height }}
      />

      {/* Negocio arriba a la izquierda */}
      {!!org && (
        <View className="absolute left-3 top-3 flex-row items-center gap-1.5 rounded-full bg-black/50 py-1 pl-1 pr-2.5">
          <Image
            source={org.logoUrl ? { uri: org.logoUrl } : DEFAULT_BUSINESS_LOGO}
            style={{ width: 20, height: 20, borderRadius: 10 }}
            contentFit="cover"
          />
          <Text numberOfLines={1} className="max-w-[180px] text-[11px] font-bold text-white">
            {businessDisplayName(org)}
          </Text>
        </View>
      )}

      {/* Título + precio abajo */}
      <View className="absolute bottom-3 left-4 right-16">
        <Text numberOfLines={2} className="text-[17px] font-extrabold leading-5 text-white">
          {promo.title}
        </Text>
        <View className="mt-1 flex-row items-baseline gap-2">
          <Text className="text-[16px] font-extrabold text-white">
            {formatPrice(promo.price)}
          </Text>
          {promo.regularPrice > promo.price && (
            <Text className="text-[12px] text-white/70 line-through">
              {formatPrice(promo.regularPrice)}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}
