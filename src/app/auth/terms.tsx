import { LegalDocumentScreen } from '@/components/ui/legal-document-screen';

/**
 * Términos y Condiciones (texto de referencia — reemplazar por el
 * redactado definitivo antes de producción; ver §41 en NOTAS.md).
 */
export default function TermsScreen() {
  return (
    <LegalDocumentScreen
      title="Términos y Condiciones"
      updatedAt="21 de julio de 2026"
      sections={[
        {
          heading: '1. Aceptación',
          body: 'Al crear una cuenta en Mándalo ("la app", operada por Mándalo, con domicilio en Villagarzón, Putumayo, Colombia) aceptas estos Términos y Condiciones. Si no estás de acuerdo, no debes registrarte ni usar la app.',
        },
        {
          heading: '2. Qué es Mándalo',
          body: 'Mándalo es una plataforma que conecta usuarios que hacen pedidos, negocios que los preparan y domiciliarios que los entregan. Mándalo actúa como intermediario tecnológico: no es propietaria de los negocios registrados ni empleadora de los domiciliarios independientes que usan la app.',
        },
        {
          heading: '3. Cuentas y roles',
          body: 'Existen cuentas de Usuario, Domiciliario, Negocio y Administrador. Cada una tiene su propio flujo de registro y, en el caso de Domiciliario, la verificación de identidad y documentos del vehículo (cédula, licencia, SOAT, tecnomecánica) antes de poder operar. Eres responsable de la veracidad de los datos que registras y de mantener tu contraseña segura.',
        },
        {
          heading: '4. Pedidos, pagos y entregas',
          body: 'Los precios, tiempos de entrega y disponibilidad los define cada negocio; Mándalo los muestra tal cual los publica el negocio. Un pedido puede cancelarse, rechazarse o demorarse por causas ajenas a Mándalo (clima, tráfico, disponibilidad del negocio, etc.). Los métodos de pago disponibles se muestran en el checkout.',
        },
        {
          heading: '5. Conducta de domiciliarios',
          body: 'Los domiciliarios deben portar los documentos de su vehículo vigentes (SOAT, tecnomecánica, licencia) y conducir de forma segura y responsable. Mándalo puede desactivar o banear una cuenta que incumpla estas condiciones, incluya documentos vencidos o presente información falsa.',
        },
        {
          heading: '6. Cuentas suspendidas o baneadas',
          body: 'Mándalo puede suspender temporalmente (mientras revisa documentos) o banear definitivamente una cuenta que incumpla estos términos, presente actividad fraudulenta o ponga en riesgo a otros usuarios.',
        },
        {
          heading: '7. Cambios a estos términos',
          body: 'Podemos actualizar estos Términos y Condiciones. Los cambios materiales se reflejan con una nueva fecha de actualización al pie de este documento.',
        },
        {
          heading: '8. Contacto',
          body: 'Para preguntas sobre estos términos, escríbenos a los canales de soporte publicados dentro de la app.',
        },
      ]}
    />
  );
}
