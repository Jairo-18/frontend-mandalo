import { File } from 'expo-file-system';
import { Platform } from 'react-native';

/** Documento del vehículo (SOAT / tecnomecánica): puede ser foto o PDF. */
export type DocumentValue = { uri: string; kind: 'image' | 'pdf' };

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
