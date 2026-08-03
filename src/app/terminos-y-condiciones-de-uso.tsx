import { LegalDocument } from '@/components/legal/legal-document';
import { blocks, meta } from '@/content/terminos-content';

/**
 * Términos y Condiciones de Uso (TYC-001) — ruta pública, alcanzable sin
 * sesión y por URL directa (registrada en Cámara de Comercio del Putumayo).
 * Fusionado desde web-mandalo (Astro) a frontend-mandalo (NOTAS §62): misma
 * ruta exacta `/terminos-y-condiciones-de-uso`, mismo contenido.
 */
export default function TerminosYCondicionesScreen() {
  return (
    <LegalDocument
      title="Términos y Condiciones de Uso"
      updatedAt="1 de agosto de 2026"
      meta={meta}
      blocks={blocks}
      pdfUrl="https://somosmandalo.com/terminos-y-condiciones-mandalo.pdf"
    />
  );
}
