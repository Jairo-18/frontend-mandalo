import { useState } from 'react';

import { HttpError, pickMessage } from '@/lib/http';
import { toast } from '@/lib/toast';

export type FormErrors = Record<string, string | undefined>;

/**
 * Errores de validación inline de los formularios: `clearError` limpia el
 * error de un campo al tocarlo y `bind` genera el onChangeText típico
 * (setear valor + limpiar error) para no repetirlo campo por campo.
 */
export function useFormErrors() {
  const [errors, setErrors] = useState<FormErrors>({});

  const clearError = (field: string) =>
    setErrors((p) => (p[field] ? { ...p, [field]: undefined } : p));

  const bind =
    (field: string, setter: (v: string) => void) => (value: string) => {
      setter(value);
      clearError(field);
    };

  /**
   * Setea los errores y devuelve si el formulario es válido. Si no lo es,
   * avisa con un toast: en los formularios largos el campo con error puede
   * quedar fuera de la pantalla y "Guardar" parecía no hacer nada.
   */
  const validate = (e: FormErrors): boolean => {
    setErrors(e);
    const messages = Object.values(e).filter(Boolean) as string[];
    if (messages.length) {
      toast.error(
        messages.length === 1
          ? messages[0]
          : `Revisa los ${messages.length} campos marcados en rojo.`,
      );
    }
    return messages.length === 0;
  };

  /**
   * Pinta debajo de cada campo los errores que devolvió el BACKEND: el
   * mapa `errors` de una validación (400) o el `field` de un dato repetido
   * (409: correo, teléfono, NIT…). `aliases` traduce el nombre del backend
   * al del formulario cuando no coinciden (p. ej. `priceSale` → `price`).
   * Devuelve si marcó algún campo. El toast del interceptor sale igual.
   */
  const applyServerErrors = (
    error: unknown,
    aliases: Record<string, string> = {},
  ): boolean => {
    if (!(error instanceof HttpError)) return false;
    const body = error.body as {
      errors?: Record<string, string>;
      field?: string;
    } | null;
    const next: FormErrors = {};
    for (const [field, message] of Object.entries(body?.errors ?? {})) {
      next[aliases[field] ?? field] = message;
    }
    if (body?.field) {
      next[aliases[body.field] ?? body.field] = pickMessage(body, 'Revisa este campo.');
    }
    if (!Object.keys(next).length) return false;
    setErrors((p) => ({ ...p, ...next }));
    return true;
  };

  return { errors, setErrors, clearError, bind, validate, applyServerErrors };
}
