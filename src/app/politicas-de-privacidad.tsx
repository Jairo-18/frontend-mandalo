import { LegalDocument } from '@/components/legal/legal-document';
import { blocks, meta } from '@/content/privacidad-content';

/**
 * Política de Privacidad y Tratamiento de Datos Personales (PPDP-001) — ruta
 * pública, alcanzable sin sesión y por URL directa (registrada en Cámara de
 * Comercio del Putumayo). Fusionado desde web-mandalo (Astro) a
 * frontend-mandalo (NOTAS §62): misma ruta exacta
 * `/politicas-de-privacidad`, mismo contenido.
 */
export default function PoliticasDePrivacidadScreen() {
  return (
    <LegalDocument
      title="Política de Privacidad"
      updatedAt="1 de agosto de 2026"
      meta={meta}
      blocks={blocks}
      pdfUrl="https://somosmandalo.com/politica-de-privacidad-mandalo.pdf"
    />
  );
}
