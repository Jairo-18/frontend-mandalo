import { File } from 'expo-file-system';

/**
 * Part de archivo para FormData a partir de una uri local (file://…).
 *
 * En SDK 57 el `fetch` global es el de Expo (WinterCG) y el truco clásico de
 * React Native `form.append('file', { uri, name, type })` YA NO funciona:
 * lanza "Unsupported FormDataPart implementation". La forma soportada es
 * adjuntar un `File` de expo-file-system, que implementa `Blob`.
 */
export function filePart(uri: string): Blob {
  return new File(uri) as unknown as Blob;
}
