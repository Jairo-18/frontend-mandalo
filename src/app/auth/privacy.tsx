import { LegalDocumentScreen } from '@/components/ui/legal-document-screen';

/**
 * Política de Tratamiento de Datos Personales / Privacidad (texto de
 * referencia — reemplazar por el redactado definitivo antes de producción,
 * idealmente revisado bajo la Ley 1581 de 2012 / Habeas Data; ver §41 en
 * NOTAS.md).
 */
export default function PrivacyScreen() {
  return (
    <LegalDocumentScreen
      title="Política de Tratamiento de Datos"
      updatedAt="21 de julio de 2026"
      sections={[
        {
          heading: '1. Responsable del tratamiento',
          body: 'Mándalo, con domicilio en Villagarzón, Putumayo, Colombia, es responsable del tratamiento de los datos personales que recoge a través de esta app, conforme a la Ley 1581 de 2012 y sus decretos reglamentarios (régimen de protección de datos / Habeas Data).',
        },
        {
          heading: '2. Datos que recolectamos',
          body: 'Datos de identificación (nombre, número de documento, tipo de documento), contacto (correo, celular), ubicación (dirección y coordenadas GPS) y, para domiciliarios, fotos del rostro, cédula, licencia de conducción, SOAT y tecnomecánica. También datos de uso de la app (pedidos, mensajes de soporte/chat).',
        },
        {
          heading: '3. Finalidad',
          body: 'Usamos tus datos para: crear y verificar tu cuenta, procesar y hacer seguimiento a pedidos, calcular distancias y tiempos de entrega, contactarte sobre tu pedido o cuenta, y — en el caso de domiciliarios — verificar tu identidad y la vigencia de los documentos de tu vehículo antes de activarte.',
        },
        {
          heading: '4. Con quién compartimos tus datos',
          body: 'El negocio y/o el domiciliario de un pedido ven los datos necesarios para completarlo (nombre, dirección, teléfono). No vendemos tus datos a terceros. Podemos compartir información si una autoridad competente lo exige por ley.',
        },
        {
          heading: '5. Almacenamiento y seguridad',
          body: 'Tus datos se almacenan en servidores con acceso restringido; las contraseñas se guardan cifradas y nunca se comparten. Las fotos de documentos las revisa un administrador humano exclusivamente para activar cuentas de domiciliario.',
        },
        {
          heading: '6. Tus derechos (ARCO)',
          body: 'Como titular de tus datos, puedes conocer, actualizar, rectificar y solicitar la eliminación de tu información, así como revocar tu autorización, escribiendo a los canales de soporte publicados dentro de la app. Algunos datos (p. ej. historial de pedidos) pueden conservarse el tiempo que exija la ley aunque solicites eliminación de la cuenta.',
        },
        {
          heading: '7. Cambios a esta política',
          body: 'Podemos actualizar esta política; los cambios materiales se reflejan con una nueva fecha de actualización al pie de este documento.',
        },
      ]}
    />
  );
}
