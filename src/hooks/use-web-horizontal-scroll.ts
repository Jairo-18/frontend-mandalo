import { useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';

/** Lo mínimo que exponen ScrollView/FlatList para llegar al nodo del DOM en web. */
type Scrollable = { getScrollableNode?: () => unknown } | null;

/** Píxeles de arrastre a partir de los cuales ya no cuenta como un toque. */
const DRAG_THRESHOLD = 6;

/**
 * Scroll horizontal usable con MOUSE en web (escritorio): en un navegador una
 * fila horizontal (Negocios, Categorías, carrusel) solo se movía con trackpad
 * o Shift + rueda. Esto agrega:
 *  - rueda vertical → scroll horizontal (solo mientras la fila pueda moverse
 *    en esa dirección; en los extremos la rueda vuelve a mover la página);
 *  - arrastrar con el mouse, sin disparar el "toque" de la tarjeta al soltar.
 * En nativo no hace nada. Uso: `const ref = useWebHorizontalScroll();` y
 * `<ScrollView ref={ref} horizontal …>`.
 */
export function useWebHorizontalScroll<T extends Scrollable>() {
  const nodeRef = useRef<HTMLElement | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const ref = useCallback((instance: T) => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    if (Platform.OS !== 'web' || !instance) return;
    const node = (instance.getScrollableNode?.() ?? instance) as HTMLElement | null;
    if (!node || typeof node.addEventListener !== 'function') return;
    nodeRef.current = node;

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return; // ya es horizontal
      const max = node.scrollWidth - node.clientWidth;
      if (max <= 0) return;
      const atStart = node.scrollLeft <= 0 && e.deltaY < 0;
      const atEnd = node.scrollLeft >= max - 1 && e.deltaY > 0;
      if (atStart || atEnd) return; // deja que la página siga bajando/subiendo
      e.preventDefault();
      node.scrollLeft += e.deltaY;
    };

    let startX = 0;
    let startLeft = 0;
    let dragging = false;
    let moved = false;
    const onDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      dragging = true;
      moved = false;
      startX = e.clientX;
      startLeft = node.scrollLeft;
    };
    const onMove = (e: MouseEvent) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) < DRAG_THRESHOLD) return;
      moved = true;
      node.style.cursor = 'grabbing';
      node.style.userSelect = 'none';
      node.scrollLeft = startLeft - dx;
    };
    const onUp = () => {
      dragging = false;
      node.style.cursor = '';
      node.style.userSelect = '';
    };
    // Si fue un arrastre, el click de soltar no debe abrir la tarjeta.
    const onClick = (e: MouseEvent) => {
      if (!moved) return;
      e.preventDefault();
      e.stopPropagation();
      moved = false;
    };

    node.addEventListener('wheel', onWheel, { passive: false });
    node.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    node.addEventListener('click', onClick, true);
    cleanupRef.current = () => {
      node.removeEventListener('wheel', onWheel);
      node.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      node.removeEventListener('click', onClick, true);
    };
  }, []);

  useEffect(() => () => cleanupRef.current?.(), []);

  return ref;
}
