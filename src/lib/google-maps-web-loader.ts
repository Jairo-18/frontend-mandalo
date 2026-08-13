/**
 * Carga perezosa del script de Google Maps JavaScript API en el navegador
 * (solo se importa desde archivos `.web.tsx` — nunca se bundlea en nativo).
 * Sin librería de npm a propósito (`@react-google-maps/api` arriesga
 * conflicto de peer-deps con React 19): un loader chico a mano que inyecta
 * el `<script>` una sola vez y cachea la promesa. Sin tipos oficiales de
 * `@types/google.maps` tampoco — se usa `any` acá, contenido a este único
 * archivo (el resto de la app nunca toca la API de Google Maps).
 */
let loadPromise: Promise<any> | null = null;

export function loadGoogleMapsWeb(apiKey: string): Promise<any> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps solo carga en el navegador'));
  }
  const w = window as any;
  if (w.google?.maps) return Promise.resolve(w.google);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&loading=async`;
    script.async = true;
    script.onload = () => {
      if (w.google?.maps) resolve(w.google);
      else reject(new Error('Google Maps no terminó de cargar'));
    };
    script.onerror = () => {
      loadPromise = null; // Deja reintentar en la próxima llamada.
      reject(new Error('No se pudo cargar el script de Google Maps'));
    };
    document.head.appendChild(script);
  });
  return loadPromise;
}
