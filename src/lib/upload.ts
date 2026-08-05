import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Platform } from 'react-native';

/** Documento del vehículo (SOAT / tecnomecánica): puede ser foto o PDF. */
export type DocumentValue = { uri: string; kind: 'image' | 'pdf' };

/** Ancho/alto máximo antes de subir (documentos SIN editor de recorte). */
const MAX_UPLOAD_DIMENSION = 1280;

/**
 * Achica una foto ANTES de subirla (documentos sin editor de recorte:
 * cédula, licencia, SOAT/tecnomecánica). El backend igual la re-comprime a
 * webp, pero eso pasa DESPUÉS de que el archivo ya viajó por la red — sin
 * esto, la foto de una cámara moderna (3000-4000px de ancho) se sube entera
 * antes de que el servidor pueda achicarla, lo que pesa mucho en conexiones
 * lentas (la app opera en zona rural del Putumayo). Si falla, sube la
 * original tal cual (mejor una foto pesada que ninguna).
 *
 * 1280px/70% (antes 1600px/80%): estos documentos los revisa un admin para
 * verificar identidad, no se muestran en ningún lado a tamaño grande — el
 * texto sigue perfectamente legible y el archivo pesa bastante menos, lo que
 * se nota directo en cuánto tarda el registro en conexión lenta.
 */
export async function resizeForUpload(
  uri: string,
  width: number,
  height: number,
): Promise<string> {
  if (Math.max(width, height) <= MAX_UPLOAD_DIMENSION) return uri;
  try {
    const context =
      width >= height
        ? ImageManipulator.manipulate(uri).resize({ width: MAX_UPLOAD_DIMENSION })
        : ImageManipulator.manipulate(uri).resize({ height: MAX_UPLOAD_DIMENSION });
    const rendered = await context.renderAsync();
    const saved = await rendered.saveAsync({
      format: SaveFormat.JPEG,
      compress: 0.7,
    });
    return saved.uri;
  } catch {
    return uri;
  }
}

/**
 * Part de archivo para FormData a partir de una uri local.
 *
 * - Nativo (`file://…`): en SDK 57 el `fetch` global es el de Expo (WinterCG)
 *   y el truco clásico de React Native `form.append('file', { uri, name,
 *   type })` YA NO funciona: lanza "Unsupported FormDataPart implementation".
 *   La forma soportada es adjuntar un `File` de expo-file-system, que
 *   implementa `Blob`.
 * - Web (`data:…` / `blob:…` del picker del navegador): el File de
 *   expo-file-system no existe — se convierte la uri a Blob estándar con
 *   `fetch`. Por eso la función es async (la conversión web no puede ser
 *   síncrona); en nativo resuelve de inmediato.
 */
export async function filePart(uri: string): Promise<Blob> {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    return response.blob();
  }
  return new File(uri) as unknown as Blob;
}

/** Agrega un `DocumentValue` (foto o PDF) a un FormData con la extensión correcta. */
export async function appendDocument(
  form: FormData,
  field: string,
  value: DocumentValue,
): Promise<void> {
  const ext = value.kind === 'pdf' ? 'pdf' : 'jpg';
  form.append(field, await filePart(value.uri), `${field}.${ext}`);
}

/**
 * Parte de archivo para FormData, pero para subidas por `XMLHttpRequest`
 * (usado por `httpUpload`, que sí expone progreso real — `fetch` no). En
 * nativo, XHR corre sobre el puente CLÁSICO de RN (`RCTNetworking`), que NO
 * es el mismo runtime que el `fetch` WinterCG de Expo: entiende el objeto de
 * toda la vida `{ uri, name, type }` (así lo documenta el propio
 * `FormData.js` de RN), no el `File` de expo-file-system que exige `filePart`
 * para el `fetch` nuevo — ese `File` no expone un `.uri` plano y, pasado por
 * XHR, sube un archivo vacío o corrupto en silencio. En web no cambia nada:
 * mismo Blob real que ya arma `filePart`.
 */
export async function xhrFilePart(
  uri: string,
  filename: string,
  mimeType: string,
): Promise<Blob> {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    return response.blob();
  }
  return { uri, name: filename, type: mimeType } as unknown as Blob;
}

/** Como `appendDocument`, pero con la parte compatible con XHR (`xhrFilePart`). */
export async function xhrAppendDocument(
  form: FormData,
  field: string,
  value: DocumentValue,
): Promise<void> {
  const ext = value.kind === 'pdf' ? 'pdf' : 'jpg';
  const mimeType = value.kind === 'pdf' ? 'application/pdf' : 'image/jpeg';
  form.append(
    field,
    await xhrFilePart(value.uri, `${field}.${ext}`, mimeType),
    `${field}.${ext}`,
  );
}
