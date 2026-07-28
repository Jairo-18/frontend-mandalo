import { useEffect, useState } from 'react';

import { YesNoDialog } from '@/components/ui/yes-no-dialog';
import {
  resolveLocationConsent,
  setLocationConsentListener,
} from '@/lib/location-consent';

/**
 * Aviso propio de ubicación en primer plano (una vez por dispositivo, ver
 * `lib/location-consent.ts`). Montado en el layout raíz junto al `ToastHost`:
 * cualquier pantalla dispara `ensureLocationConsent()` sin tener que renderizar
 * su propio diálogo.
 */
export function LocationConsentHost() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setLocationConsentListener(setVisible);
    return () => setLocationConsentListener(null);
  }, []);

  return (
    <YesNoDialog
      visible={visible}
      title="Necesitamos tu ubicación"
      message="La usamos para mostrarte los negocios cerca de la dirección que elijas, calcular la ruta y el costo del domicilio. A continuación Android te va a pedir el permiso — puedes aceptarlo o rechazarlo ahí."
      confirmLabel="Entendido"
      cancelLabel="Ahora no"
      icon="location-outline"
      onConfirm={() => resolveLocationConsent(true)}
      onCancel={() => resolveLocationConsent(false)}
    />
  );
}
