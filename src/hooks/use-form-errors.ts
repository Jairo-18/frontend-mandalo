import { useState } from 'react';

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

  /** Setea los errores y devuelve si el formulario es válido. */
  const validate = (e: FormErrors): boolean => {
    setErrors(e);
    return !Object.values(e).some(Boolean);
  };

  return { errors, setErrors, clearError, bind, validate };
}
