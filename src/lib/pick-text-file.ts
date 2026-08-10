import { File } from 'expo-file-system';
import { Platform } from 'react-native';

/**
 * Elige un archivo .csv/.txt local y devuelve su contenido como texto plano
 * (para parsear correos separados por coma o salto de línea en el cliente,
 * sin mandar el archivo crudo al backend). Mismo patrón dual mobile/web que
 * `pickPdf()` en `vehicle-document-field.tsx`: nativo usa `File.pickFileAsync`
 * (expo-file-system, sin dependencia nueva); web no lo soporta, así que usa
 * un `<input type=file>` del DOM + `FileReader`.
 */
export async function pickTextFile(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.csv,.txt,text/csv,text/plain';
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ''));
        reader.onerror = () => resolve(null);
        reader.readAsText(file);
      };
      input.click();
    });
  }
  const picked = await File.pickFileAsync({
    mimeTypes: [
      'text/csv',
      'text/plain',
      'text/comma-separated-values',
      'application/vnd.ms-excel',
    ],
  });
  if (picked.canceled || !picked.result) return null;
  return await new File(picked.result.uri).text();
}
