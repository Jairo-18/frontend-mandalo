// Contenido integro de la Politica de Privacidad (PPDP-001) -- portado tal
// cual desde web-mandalo/src/pages/politicas-de-privacidad.astro al fusionar
// el sitio Astro dentro de frontend-mandalo (NOTAS S62). No cambiar el texto
// aca sin actualizar primero el documento legal registrado en Camara de Comercio.

type Para = string | string[] | { table: { headers: string[]; rows: string[][] } };
type Block = { chapter: string } | { heading: string; paragraphs: Para[] };

const meta = [
  ['Documento', 'Política de Privacidad y Tratamiento de Datos Personales'],
  ['Código', 'PPDP-001'],
  ['Versión', '1.0'],
  ['Estado', 'Vigente'],
  ['Fecha de entrada en vigencia', '01 de agosto de 2026'],
  ['Responsable del Tratamiento', 'Luis Carlos Erazo Burbano — NIT 1127077851-4'],
  ['Domicilio', 'Cll 10 Cr 3-14 B/ 29 de mayo, Villagarzón, Putumayo, Colombia'],
  ['Correo para el ejercicio de derechos', 'mandaloputumayo@gmail.com'],
];

const blocks: Block[] = [
  {
    heading: 'Presentación',
    paragraphs: [
      'La presente Política de Privacidad y Tratamiento de Datos Personales tiene por finalidad establecer las condiciones bajo las cuales Mandalo realiza el tratamiento de los datos personales de los titulares que interactúan con la plataforma tecnológica, garantizando el respeto por los derechos fundamentales a la intimidad, al buen nombre, al Habeas Data y a la protección de la información personal.',
      'Mandalo es una plataforma tecnológica desarrollada para facilitar la intermediación entre usuarios, comercios aliados y domiciliarios mediante la gestión de pedidos, compras personalizadas y servicios de entrega a domicilio. Para el adecuado funcionamiento de estos servicios resulta necesario recopilar, almacenar, consultar, utilizar, transmitir, conservar y, cuando corresponda, eliminar determinados datos personales de quienes utilizan la aplicación.',
      'El tratamiento de datos personales se realiza conforme a los principios de legalidad, finalidad, libertad, transparencia, acceso y circulación restringida, seguridad, confidencialidad y responsabilidad demostrada, procurando en todo momento que la información sea utilizada únicamente para los fines autorizados por los titulares y permitidos por la legislación vigente.',
      'La presente Política incorpora igualmente las mejores prácticas internacionales en materia de privacidad, incluyendo los principios de Privacy by Design y Privacy by Default.',
      'Asimismo, esta Política describe con detalle la infraestructura tecnológica utilizada por Mandalo y los proveedores externos que intervienen en el tratamiento, entre ellos el proveedor de infraestructura de servidores y los servicios de Google LLC empleados para autenticación, notificaciones, correo electrónico y mapas, conforme al Capítulo III.',
      'Mandalo no vende datos personales, no muestra publicidad de terceros dentro de la aplicación y no utiliza los datos de los titulares con fines de perfilamiento comercial.',
      'El presente documento será aplicable a todas las personas que interactúen con Mandalo, incluyendo usuarios, comercios aliados, domiciliarios, representantes legales, proveedores y cualquier otro titular cuyos datos personales sean objeto de tratamiento.',
    ],
  },
  {
    heading: '1. Objeto',
    paragraphs: [
      'La presente Política tiene por objeto establecer las condiciones jurídicas, técnicas y administrativas bajo las cuales Mandalo realiza el tratamiento de los datos personales obtenidos mediante la aplicación móvil, los servicios asociados y los diferentes canales de atención habilitados. De manera específica, esta Política tiene como finalidad:',
      [
        'Informar a los titulares acerca de los datos personales que son objeto de tratamiento.',
        'Definir las finalidades para las cuales dicha información es utilizada.',
        'Establecer los derechos que asisten a los titulares y los procedimientos para ejercerlos.',
        'Definir las responsabilidades asumidas por Mandalo como Responsable del Tratamiento.',
        'Garantizar el cumplimiento de la Constitución Política de Colombia, la Ley 1581 de 2012, el Decreto 1377 de 2013, el Decreto 1074 de 2015 y las demás disposiciones aplicables.',
        'Informar sobre la utilización de proveedores tecnológicos nacionales e internacionales que participan en la prestación del servicio.',
        'Establecer las medidas de seguridad implementadas para proteger la información personal.',
        'Informar los plazos de conservación de la información y el procedimiento de eliminación de la cuenta.',
      ],
    ],
  },
  {
    heading: '2. Alcance',
    paragraphs: [
      'La presente Política será aplicable a todas las actividades de tratamiento realizadas por Mandalo, independientemente del medio físico o electrónico mediante el cual la información sea recopilada, almacenada, utilizada, consultada, transmitida, transferida, actualizada, conservada o eliminada.',
      'La presente Política será aplicable a las siguientes categorías de titulares:',
      [
        'Los usuarios registrados en la aplicación Mandalo.',
        'Los comercios aliados registrados en la plataforma, sus representantes legales y personal autorizado.',
        'Los domiciliarios registrados o en proceso de vinculación, y los aspirantes a domiciliarios.',
        'Los proveedores y contratistas cuando el tratamiento resulte necesario para el desarrollo de la operación.',
        'Las personas que presenten consultas, solicitudes, peticiones, quejas o reclamos a través de los canales oficiales.',
        'Los visitantes de los sitios web oficiales de Mandalo.',
        'Terceros cuyos datos sean suministrados por los titulares cuando ello resulte necesario para la prestación del servicio, como los destinatarios de pedidos autorizados por el usuario.',
      ],
      'La presente Política regula el tratamiento de los datos personales obtenidos mediante la aplicación móvil, los formularios de registro, los procesos de autenticación, los canales oficiales de atención, los sistemas de mensajería y notificaciones, los servicios de geolocalización, las comunicaciones por correo electrónico y los servicios tecnológicos utilizados para la operación de la plataforma.',
      'Igualmente será aplicable cuando el tratamiento se realice mediante proveedores tecnológicos ubicados fuera del territorio colombiano, conforme al Artículo 48.',
    ],
  },
  {
    heading: '3. Marco Normativo',
    paragraphs: [
      'El tratamiento de datos personales realizado por Mandalo se regirá, entre otras, por las siguientes disposiciones:',
      [
        'Constitución Política de Colombia. Especialmente los artículos 15 (intimidad, buen nombre y Habeas Data), 20 (acceso y circulación de la información) y 74 (acceso a documentos públicos).',
        'Ley 1581 de 2012. Disposiciones generales para la protección de datos personales.',
        'Decreto 1377 de 2013. Reglamenta parcialmente la Ley 1581 de 2012 respecto de las autorizaciones, avisos de privacidad y procedimientos para el ejercicio de los derechos de los titulares.',
        'Decreto Único Reglamentario 1074 de 2015. Compila la reglamentación vigente en materia de protección de datos personales.',
        'Ley 527 de 1999. Comercio electrónico, mensajes de datos, firmas digitales y validez jurídica de las actuaciones electrónicas.',
        'Ley 1480 de 2011. Estatuto del Consumidor, aplicable a las relaciones de consumo derivadas de la utilización de la plataforma.',
        'Código de Comercio Colombiano. En lo relacionado con las obligaciones mercantiles y la conservación de documentos comerciales.',
        'Criterios de la Superintendencia de Industria y Comercio, incluidas las circulares externas que establecen los estándares aplicables a las transferencias internacionales de datos personales.',
        'Requisitos de las tiendas de aplicaciones. La presente Política atiende igualmente los requisitos de la Política de Datos del Usuario de Google Play y de las Directrices de Revisión de la App Store de Apple.',
      ],
      'Adicionalmente, Mandalo adopta como referencia las mejores prácticas internacionales en materia de privacidad, incluyendo los principios de Privacy by Design, Privacy by Default, Accountability y minimización de datos.',
    ],
  },
  {
    heading: '4. Definiciones',
    paragraphs: [
      'Para efectos de la interpretación y aplicación de la presente Política, los términos que se indican a continuación tendrán el significado que en cada caso se señala, sin perjuicio de las definiciones establecidas en la Ley 1581 de 2012.',
      [
        'Autorización: Consentimiento previo, expreso e informado otorgado por el titular para el tratamiento de sus datos personales.',
        'Base de Datos: Conjunto organizado de datos personales objeto de tratamiento por parte de Mandalo.',
        'Comercio Aliado: Persona natural o jurídica registrada en la plataforma para ofrecer productos o servicios a los usuarios.',
        'Dato Personal: Cualquier información vinculada o que pueda asociarse a una persona natural identificada o identificable.',
        'Dato Público: Información que no tiene naturaleza reservada y cuyo acceso puede realizarse conforme a la ley.',
        'Dato Sensible: Información cuyo uso indebido puede afectar la intimidad del titular o generar discriminación, conforme a la legislación colombiana.',
        'Domiciliario: Persona natural registrada en la plataforma para realizar la entrega de pedidos solicitados por los usuarios. En los Términos y Condiciones se denomina indistintamente "repartidor".',
        'Encargado del Tratamiento: Persona natural o jurídica que realiza el tratamiento de datos personales por cuenta del Responsable del Tratamiento.',
        'Firebase Cloud Messaging (FCM): Servicio de Google LLC utilizado por Mandalo exclusivamente para el envío de notificaciones push a los dispositivos de los titulares.',
        'Geolocalización: Obtención de la ubicación geográfica de un dispositivo mediante tecnologías GPS, redes móviles o redes inalámbricas con el fin de facilitar la prestación del servicio.',
        'Google Maps Platform: Servicio de Google LLC utilizado para la visualización de mapas, cálculo de rutas, geocodificación de direcciones y estimación de tiempos de desplazamiento.',
        'Google Sign-In: Servicio de autenticación de Google LLC que permite a los titulares iniciar sesión mediante su cuenta de Google.',
        'Habeas Data: Derecho fundamental que permite al titular conocer, actualizar, rectificar y solicitar la supresión de sus datos personales en los términos previstos por la ley.',
        'Hostinger: Proveedor de infraestructura de servidores contratado por Mandalo, que actúa como Encargado del Tratamiento respecto de la custodia técnica de la información.',
        'PostgreSQL: Sistema de gestión de bases de datos relacional instalado y administrado directamente por Mandalo en su propia infraestructura. No constituye un proveedor externo.',
        'Redis: Sistema de almacenamiento temporal en memoria instalado y administrado directamente por Mandalo. No constituye un proveedor externo.',
        'Responsable del Tratamiento: Persona natural o jurídica que decide sobre la finalidad y el tratamiento de los datos personales. Para efectos de la presente Política, el Responsable del Tratamiento es Luis Carlos Erazo Burbano, persona natural comerciante identificado con NIT 1127077851-4, quien opera bajo el nombre comercial Mandalo.',
        'Titular: Persona natural cuyos datos personales son objeto de tratamiento.',
        'Tratamiento: Cualquier operación realizada sobre datos personales, tales como recolección, almacenamiento, uso, circulación, transmisión, transferencia, actualización, conservación, bloqueo o eliminación.',
        'Usuario: Persona natural mayor de dieciocho (18) años que utiliza la plataforma para solicitar productos o servicios ofrecidos por los comercios aliados.',
      ],
    ],
  },
  {
    heading: '5. Principios del Tratamiento de Datos Personales',
    paragraphs: [
      'En todas las etapas del tratamiento de la información, Mandalo garantizará el respeto de los siguientes principios:',
      [
        '5.1 Legalidad. El tratamiento constituye una actividad reglada que se sujeta en todo momento a la Constitución Política, a la legislación vigente sobre protección de datos personales y a las demás disposiciones aplicables.',
        '5.2 Finalidad. Los datos personales serán recopilados y tratados únicamente para finalidades legítimas, específicas, explícitas e informadas previamente al titular. Mandalo no utilizará la información para fines incompatibles con aquellos que motivaron su recolección.',
        '5.3 Libertad. El tratamiento solo podrá realizarse con la autorización previa, expresa e informada del titular, salvo las excepciones previstas por la legislación colombiana. Ningún dato será obtenido mediante engaño, coerción o mecanismos que impidan al titular conocer el alcance de la autorización otorgada.',
        '5.4 Transparencia. Los titulares tendrán derecho a conocer, en cualquier momento y sin restricciones injustificadas, la existencia de datos personales que les conciernan y las condiciones bajo las cuales son tratados.',
        '5.5 Acceso y Circulación Restringida. El tratamiento estará limitado exclusivamente a las personas autorizadas y a quienes deban conocer la información en razón de sus funciones. Los datos personales no estarán disponibles en medios de acceso público.',
        '5.6 Seguridad. Mandalo implementará medidas técnicas, administrativas, organizacionales y procedimentales razonables para proteger los datos personales contra pérdida, alteración, destrucción, acceso no autorizado, uso indebido o divulgación accidental.',
        '5.7 Confidencialidad. Todas las personas que intervengan en el tratamiento estarán obligadas a garantizar la reserva de la información, incluso después de finalizar la relación que dio origen al acceso a dichos datos.',
        '5.8 Calidad o Veracidad. La información objeto de tratamiento deberá ser veraz, completa, exacta, actualizada, comprobable y comprensible.',
        '5.9 Minimización de Datos. Mandalo recopilará únicamente los datos personales estrictamente necesarios para cumplir las finalidades informadas. No se solicitará información excesiva, irrelevante o desproporcionada respecto del servicio prestado.',
        '5.10 Responsabilidad Demostrada (Accountability). Mandalo adoptará políticas, procedimientos, controles internos y medidas documentales que permitan demostrar el cumplimiento efectivo de sus obligaciones legales.',
        '5.11 Privacidad desde el Diseño (Privacy by Design). La protección de los datos personales será considerada desde las etapas iniciales de diseño, desarrollo, implementación y actualización de la plataforma.',
        '5.12 Privacidad por Defecto (Privacy by Default). Las configuraciones predeterminadas de la plataforma estarán orientadas a garantizar el mayor nivel posible de protección de la información personal.',
        '5.13 Necesidad y Proporcionalidad. Toda actividad de tratamiento deberá responder a una finalidad legítima y ser proporcional a los fines perseguidos. Cuando existan varias alternativas, Mandalo utilizará aquella que implique un menor impacto sobre la privacidad.',
      ],
    ],
  },
  { chapter: 'Capítulo I — Disposiciones Generales y Marco Jurídico' },
  {
    heading: 'Artículo 1. Objeto del Capítulo',
    paragraphs: [
      'El presente capítulo establece las disposiciones generales que regulan el tratamiento de los datos personales realizado por Mandalo y desarrolla el marco jurídico específico bajo el cual se efectúan las actividades de recolección, almacenamiento, uso, consulta, circulación, transmisión, transferencia, conservación y supresión de información personal.',
      'Las disposiciones aquí contenidas serán de obligatorio cumplimiento para todas las personas que intervengan en el tratamiento de datos personales dentro de la operación de la plataforma, independientemente del vínculo jurídico que mantengan con Mandalo.',
    ],
  },
  {
    heading: 'Artículo 2. Responsable del Tratamiento',
    paragraphs: [
      'El Responsable del Tratamiento de los datos personales recopilados a través de la plataforma Mandalo es Luis Carlos Erazo Burbano, persona natural comerciante, identificado con cédula de ciudadanía No. 1127077851 y NIT 1127077851-4, nombre comercial Mandalo, con domicilio en Cll 10 Cr 3-14 B/ 29 de mayo, Villagarzón, Putumayo, Colombia. Correo para derechos de habeas data: mandaloputumayo@gmail.com.',
      'Responsable de la atención de peticiones, consultas y reclamos relacionados con datos personales: Luis Carlos Erazo Burbano, en su condición de titular de la plataforma, quien asume directamente las funciones previstas en el artículo 23 del Decreto 1377 de 2013 y atiende las solicitudes a través del correo mandaloputumayo@gmail.com.',
      'El Responsable del Tratamiento determinará las finalidades para las cuales se recopilan los datos personales, adoptará las medidas necesarias para garantizar su protección y velará por el cumplimiento de la legislación aplicable.',
    ],
  },
  {
    heading: 'Artículo 3. Ámbito de Aplicación',
    paragraphs: [
      'La presente Política será aplicable al tratamiento de datos personales realizado mediante la aplicación móvil Mandalo, los servicios web asociados, los procesos de autenticación, los canales oficiales de atención, las plataformas tecnológicas utilizadas para la operación del servicio, los sistemas de almacenamiento de información, los servicios de geolocalización y cálculo de rutas, y los procesos administrativos derivados de la prestación del servicio.',
    ],
  },
  {
    heading: 'Artículo 4. Titulares de la Información',
    paragraphs: [
      'Serán titulares de los datos personales objeto de tratamiento todas las personas naturales cuyos datos sean recopilados, almacenados, utilizados, consultados, transmitidos o conservados como consecuencia de la utilización de la plataforma Mandalo o de la relación jurídica que mantengan con el Responsable del Tratamiento, conforme a las categorías señaladas en la sección 2 del presente documento.',
      'Cada categoría de titular estará sujeta al tratamiento de los datos personales estrictamente necesarios para el cumplimiento de las finalidades previstas.',
    ],
  },
  {
    heading: 'Artículo 5. Alcance Territorial del Tratamiento',
    paragraphs: [
      'La presente Política será aplicable al tratamiento de datos personales realizado dentro del territorio de la República de Colombia.',
      'No obstante, debido a la utilización de infraestructura tecnológica ubicada en el exterior, determinados tratamientos se efectúan mediante proveedores ubicados fuera del territorio nacional, conforme al detalle previsto en el Artículo 48 de la presente Política.',
    ],
  },
  {
    heading: 'Artículo 6. Finalidad General del Tratamiento',
    paragraphs: [
      'Mandalo tratará los datos personales con el propósito de permitir el funcionamiento integral de la plataforma tecnológica y garantizar la adecuada prestación de los servicios ofrecidos a usuarios, comercios aliados y domiciliarios.',
      'En desarrollo de dicha finalidad general, el tratamiento podrá comprender, entre otras, las siguientes actividades: registrar y administrar cuentas de usuario; verificar la identidad y la mayoría de edad de los titulares cuando resulte necesario; gestionar solicitudes de pedidos y compras personalizadas; facilitar la comunicación entre usuarios, comercios y domiciliarios; asignar pedidos a los domiciliarios disponibles; calcular rutas, distancias y tiempos estimados de entrega; permitir el seguimiento del pedido en tiempo real; gestionar pagos y comprobantes cuando corresponda; enviar notificaciones relacionadas con la operación del servicio; atender solicitudes, consultas, peticiones, quejas y reclamos; prevenir actividades fraudulentas; y cumplir obligaciones legales, regulatorias, tributarias, contractuales y administrativas.',
    ],
  },
  {
    heading: 'Artículo 7. Categorías de Titulares',
    paragraphs: [
      'Usuarios. Personas naturales mayores de dieciocho (18) años que utilizan la aplicación para solicitar productos, bienes o servicios ofrecidos por los comercios aliados o para realizar compras personalizadas mediante la plataforma.',
      'Comercios Aliados. Personas naturales o jurídicas registradas en la plataforma para ofrecer productos o servicios a los usuarios y gestionar los pedidos recibidos a través de Mandalo.',
      'Domiciliarios. Personas naturales mayores de dieciocho (18) años registradas en la plataforma, encargadas de aceptar, transportar y entregar los pedidos solicitados por los usuarios.',
      'Cada categoría de titular estará sujeta al tratamiento de información estrictamente necesaria para el desarrollo de la relación jurídica correspondiente.',
    ],
  },
  {
    heading: 'Artículo 8. Autorización del Titular',
    paragraphs: [
      'El tratamiento de los datos personales requiere la autorización previa, expresa e informada del titular, la cual se solicita durante el proceso de registro mediante una casilla de aceptación específica, presentada sin marcación previa y de manera independiente de la aceptación de los Términos y Condiciones.',
      'El proceso de registro presentará al titular, como mínimo, las siguientes autorizaciones independientes:',
      [
        'Aceptación de los Términos y Condiciones de Uso.',
        'Autorización para el tratamiento de datos personales conforme a la presente Política, incluida la transferencia internacional descrita en el Artículo 48.',
        'Autorización, de carácter opcional y no condicionante del servicio, para recibir comunicaciones comerciales y promocionales.',
      ],
      'Mandalo conservará prueba de la autorización otorgada, registrando el identificador del titular, la fecha y hora, la dirección IP desde la cual se otorgó y la versión de la Política aceptada.',
      'El titular podrá solicitar en cualquier momento copia de la autorización otorgada a través del correo mandaloputumayo@gmail.com.',
      'La negativa a otorgar la autorización opcional para comunicaciones comerciales no afectará en modo alguno la prestación del servicio.',
    ],
  },
  {
    heading: 'Artículo 9. Deber de Actualización de la Información',
    paragraphs: [
      'Los titulares deberán suministrar información veraz, completa, exacta y actualizada, y será su responsabilidad mantenerla actualizada dentro de la plataforma, informando oportunamente cualquier modificación que pueda afectar la correcta prestación del servicio.',
      'Mandalo podrá solicitar la actualización de la información cuando existan razones objetivas para considerar que los datos registrados han perdido vigencia o presentan inconsistencias.',
    ],
  },
  {
    heading: 'Artículo 10. Interpretación',
    paragraphs: [
      'Las disposiciones contenidas en la presente Política deberán interpretarse de conformidad con la Constitución Política de Colombia, la legislación vigente sobre protección de datos personales y los principios generales que inspiran el derecho a la privacidad.',
      'En caso de conflicto entre diferentes interpretaciones, prevalecerá aquella que otorgue una mayor protección a los derechos fundamentales de los titulares.',
    ],
  },
  {
    heading: 'Artículo 11. Vigencia de la Política',
    paragraphs: [
      'La presente Política entrará en vigor a partir de la fecha indicada en la portada y permanecerá vigente mientras Mandalo realice actividades de tratamiento de datos personales o hasta que sea sustituida por una versión posterior debidamente aprobada y publicada.',
      'Las versiones anteriores permanecerán archivadas para efectos de control documental y consulta histórica.',
      'Los datos personales serán conservados únicamente durante el tiempo necesario para cumplir las finalidades que motivaron su tratamiento, conforme a los plazos detallados en el Artículo 51.',
    ],
  },
  { chapter: 'Capítulo II — Datos Personales Recopilados y Finalidades del Tratamiento' },
  {
    heading: 'Artículo 12. Generalidades',
    paragraphs: [
      'Mandalo recopilará únicamente los datos personales necesarios para permitir el funcionamiento de la plataforma, garantizar la adecuada prestación de los servicios ofrecidos y cumplir las obligaciones legales aplicables.',
      'La información tratada variará de acuerdo con la categoría del titular, las funcionalidades utilizadas y los permisos otorgados dentro de la aplicación.',
      'El tratamiento se realizará conforme a los principios de necesidad, proporcionalidad y minimización de datos, evitando la recopilación de información que no resulte pertinente para la prestación del servicio.',
    ],
  },
  {
    heading: 'Artículo 13. Categorías de Datos Personales Tratados',
    paragraphs: [
      'Dependiendo del tipo de titular y de los servicios utilizados, Mandalo podrá tratar las siguientes categorías de información:',
      'a) Datos de identificación',
      [
        'Nombre completo.',
        'Fotografía de perfil.',
        'Documento de identidad, cuando sea necesario para procesos de verificación.',
        'Nombre comercial, razón social y NIT, cuando aplique.',
      ],
      'b) Datos de contacto',
      [
        'Número de teléfono móvil.',
        'Dirección de correo electrónico.',
        'Dirección de entrega y direcciones adicionales registradas por el usuario.',
        'Información de contacto de comercios y domiciliarios.',
      ],
      'c) Datos de ubicación',
      [
        'Coordenadas GPS.',
        'Dirección de origen y de destino.',
        'Ubicación en tiempo real durante la ejecución del pedido.',
        'Distancias recorridas y tiempos estimados de desplazamiento.',
      ],
      'd) Datos técnicos',
      [
        'Dirección IP.',
        'Identificador único del dispositivo.',
        'Token de registro para el servicio de notificaciones push.',
        'Sistema operativo, marca y modelo del dispositivo.',
        'Versión de la aplicación, idioma y zona horaria.',
        'Registros técnicos de funcionamiento y eventos de seguridad.',
      ],
      'e) Datos derivados del uso de la plataforma',
      [
        'Historial y estado de los pedidos.',
        'Comercios consultados y favoritos.',
        'Historial de cancelaciones.',
        'Calificaciones y comentarios.',
        'Registros de soporte al cliente.',
        'Historial de autenticaciones y de actividad dentro de la plataforma.',
      ],
    ],
  },
  {
    heading: 'Artículo 14. Datos Personales Tratados por Tipo de Titular',
    paragraphs: [
      'Con el fin de garantizar un tratamiento adecuado y proporcional, Mandalo recopilará únicamente la información necesaria según la categoría de titular.',
      '14.1 Usuarios. Identificación: nombre completo, fotografía de perfil e identificador único de usuario (UID). Contacto: número de teléfono móvil, dirección de correo electrónico y direcciones de entrega registradas. Ubicación: ubicación GPS durante la utilización del servicio, dirección de origen y destino, y coordenadas geográficas asociadas al pedido. Operacionales: historial y estado de los pedidos, comercios consultados, favoritos, calificaciones otorgadas, comentarios relacionados con los pedidos y reportes realizados al servicio de atención. Técnicos: dirección IP, sistema operativo, modelo del dispositivo, idioma, zona horaria, token de notificaciones e identificadores técnicos necesarios para el funcionamiento de la aplicación.',
      '14.2 Comercios Aliados. Nombre del establecimiento, razón social, NIT cuando corresponda, nombre y documento de identidad del representante legal cuando sea necesario, dirección del establecimiento, número telefónico, correo electrónico, horarios de atención, coordenadas del establecimiento, catálogo de productos, información bancaria para la dispersión de pagos e información comercial necesaria para la operación de la plataforma.',
      '14.3 Domiciliarios. Nombre completo, documento de identidad, número telefónico, correo electrónico, fotografía de perfil, fotografía del documento de identidad cuando sea requerida para procesos de validación, fotografía de la licencia de conducción cuando aplique, información y placa del vehículo utilizado, documentación vigente exigida por las autoridades de tránsito, información bancaria para recibir pagos, ubicación GPS en tiempo real durante la prestación del servicio, historial de entregas, calificaciones recibidas e historial de conexión a la plataforma.',
    ],
  },
  {
    heading: 'Artículo 15. Datos Obtenidos Automáticamente',
    paragraphs: [
      'Como consecuencia del uso normal de la aplicación, determinados datos podrán recopilarse automáticamente: fecha y hora de acceso, dirección IP, eventos de autenticación, tipo de dispositivo, sistema operativo, versión de la aplicación, información sobre fallos técnicos, registros de seguridad, eventos relacionados con el rendimiento de la aplicación e información necesaria para prevenir accesos no autorizados.',
      'Estos datos son procesados en la infraestructura propia de Mandalo y serán utilizados exclusivamente para fines de seguridad, mantenimiento, análisis estadístico y mejora continua del servicio. No se utilizan servicios de analítica de comportamiento de terceros.',
    ],
  },
  {
    heading: 'Artículo 16. Permisos del Dispositivo',
    paragraphs: [
      'Para garantizar el correcto funcionamiento de la plataforma, Mandalo podrá solicitar autorización para acceder a determinadas funcionalidades del dispositivo móvil. El detalle de los permisos, su finalidad y las categorías de titulares a los que aplican se encuentra en el Artículo 30 de la presente Política.',
      'Mandalo no solicita acceso al micrófono, a la lista de contactos, al calendario, a los mensajes de texto ni al registro de llamadas del dispositivo.',
      'La negativa a conceder determinados permisos podrá impedir el funcionamiento parcial o total de algunas funcionalidades de la aplicación, sin que ello afecte los derechos reconocidos por la legislación vigente.',
    ],
  },
  {
    heading: 'Artículo 17. Finalidades Específicas del Tratamiento',
    paragraphs: [
      'Finalidades operativas:',
      [
        'Crear y administrar cuentas de usuario.',
        'Verificar la identidad y la mayoría de edad de los titulares.',
        'Permitir el inicio de sesión mediante cuenta de Google o correo electrónico verificado.',
        'Gestionar pedidos y compras personalizadas.',
        'Asignar domiciliarios y coordinar entregas.',
        'Mostrar el estado del pedido en tiempo real.',
        'Calcular rutas, distancias y el valor del servicio de entrega.',
        'Administrar perfiles de comercios.',
      ],
      'Finalidades de comunicación:',
      [
        'Enviar notificaciones relacionadas con los pedidos y con la operación del servicio.',
        'Enviar correos electrónicos de verificación, recuperación de acceso y avisos de seguridad.',
        'Atender solicitudes, consultas, peticiones, quejas y reclamos.',
        'Contactar a los titulares cuando resulte necesario para la prestación del servicio.',
      ],
      'Finalidades de seguridad:',
      [
        'Detectar actividades fraudulentas y validar autenticaciones.',
        'Prevenir accesos no autorizados e investigar incidentes de seguridad.',
        'Proteger la integridad de la plataforma.',
      ],
      'Finalidades administrativas y legales:',
      [
        'Cumplir obligaciones legales, contables y tributarias.',
        'Atender requerimientos de autoridades competentes.',
        'Conservar información cuando exista obligación legal.',
      ],
      'Finalidades de mejora del servicio:',
      [
        'Elaborar estadísticas y analizar el funcionamiento de la plataforma.',
        'Identificar oportunidades de mejora y optimizar la experiencia del usuario.',
        'Desarrollar nuevas funcionalidades utilizando, cuando sea posible, información anonimizada o agregada.',
      ],
      'Finalidades comerciales — sujetas a autorización opcional:',
      [
        'Enviar promociones, campañas comerciales y novedades del servicio, únicamente cuando el titular haya otorgado la autorización específica prevista en el Artículo 8, la cual podrá revocarse en cualquier momento.',
      ],
    ],
  },
  {
    heading: 'Artículo 18. Información que Mandalo No Recopila',
    paragraphs: [
      'Mandalo no recopila ni solicita las siguientes categorías de información:',
      [
        'Datos biométricos para identificación.',
        'Información genética.',
        'Información sobre el estado de salud.',
        'Información relativa a convicciones religiosas o filosóficas.',
        'Información sobre afiliación política o sindical.',
        'Información sobre origen racial o étnico.',
        'Información sobre orientación sexual.',
        'Contraseñas de cuentas externas.',
        'Números de tarjetas de crédito o débito.',
        'Contenido privado almacenado en el dispositivo del usuario.',
        'Conversaciones privadas ajenas a la prestación del servicio.',
        'Identificadores publicitarios del dispositivo (Advertising ID).',
      ],
      'Precisión sobre información financiera. Mandalo trata la información de cuentas bancarias suministrada voluntariamente por los comercios aliados y los domiciliarios, con la finalidad exclusiva de efectuar la dispersión de los pagos que les corresponden. Mandalo no recopila ni almacena datos de tarjetas de crédito o débito de los usuarios.',
      'En caso de que futuras funcionalidades requieran el tratamiento de alguna categoría adicional de datos personales, Mandalo actualizará la presente Política e informará previamente a los titulares, solicitando las autorizaciones que resulten legalmente exigibles.',
    ],
  },
  {
    heading: 'Artículo 19. Exactitud de la Información',
    paragraphs: [
      'Los titulares deberán suministrar información veraz, completa, actualizada y verificable.',
      'Mandalo podrá suspender temporalmente determinadas funcionalidades o solicitar procesos adicionales de validación cuando existan indicios razonables de inconsistencias, suplantación de identidad, fraude o utilización indebida de la plataforma.',
      'La actualización de los datos personales podrá realizarse mediante los mecanismos dispuestos dentro de la aplicación o a través de los canales oficiales de atención.',
    ],
  },
  {
    heading: 'Artículo 20. Tratamiento de Datos Personales de Menores de Edad',
    paragraphs: [
      'La plataforma Mandalo está dirigida exclusivamente a personas mayores de dieciocho (18) años. La aplicación no recopila intencionalmente datos personales de menores de edad ni permite el registro de cuentas por parte de quienes no cuenten con la capacidad legal para contratar.',
      'Esta restricción es coherente con el público objetivo declarado en las tiendas de aplicaciones y con lo dispuesto en el Artículo 5 de los Términos y Condiciones de Uso.',
      'En caso de que el Responsable del Tratamiento advierta que se han recopilado datos personales de un menor de edad, procederá de manera inmediata a cancelar la cuenta y a eliminar dicha información, salvo que exista un deber legal de conservación.',
      'Cualquier persona que tenga conocimiento de que un menor de edad ha suministrado datos personales a la plataforma podrá notificarlo a mandaloputumayo@gmail.com para que se adopten las medidas correspondientes.',
    ],
  },
  { chapter: 'Capítulo III — Infraestructura Tecnológica, Autenticación, Notificaciones y Geolocalización' },
  {
    heading: 'Artículo 21. Infraestructura Tecnológica de la Plataforma',
    paragraphs: [
      'Mandalo opera mediante una aplicación móvil desarrollada en tecnología multiplataforma y una infraestructura de servidores propia, administrada directamente por el Responsable del Tratamiento.',
      'Infraestructura administrada por Mandalo:',
      [
        'Servidor de aplicaciones propio, sobre el cual se ejecuta la interfaz de programación (API) de la plataforma.',
        'Sistema de gestión de bases de datos relacional PostgreSQL, instalado y administrado por Mandalo.',
        'Sistema de almacenamiento temporal en memoria Redis, utilizado para el manejo de sesiones, colas de procesamiento y datos de uso transitorio.',
        'Sistema de archivos del propio servidor, destinado al almacenamiento de imágenes y documentos cargados por los titulares.',
      ],
      'Proveedores externos:',
      [
        'Hostinger International Ltd., proveedor de infraestructura de servidores (hosting), que actúa como Encargado del Tratamiento respecto de la custodia técnica de la información.',
        'Google LLC, respecto de los servicios de autenticación mediante cuenta de Google, envío de notificaciones push, envío de correo electrónico transaccional y servicios de mapas y geolocalización, en los términos descritos en los artículos siguientes.',
      ],
      'PostgreSQL y Redis constituyen tecnologías de software instaladas y operadas directamente por Mandalo, y no corresponden a servicios prestados por terceros ni implican la comunicación de datos personales a proveedores externos distintos del proveedor de infraestructura señalado.',
      'La utilización de los servicios anteriores no implica la venta de datos personales por parte de Mandalo, ni autoriza a los proveedores a utilizar la información para finalidades distintas de la prestación de los servicios contratados.',
    ],
  },
  {
    heading: 'Artículo 22. Alojamiento e Infraestructura de Servidores',
    paragraphs: [
      'La totalidad de la información necesaria para el funcionamiento de la plataforma se aloja en servidores contratados por Mandalo con el proveedor de infraestructura Hostinger International Ltd., sociedad constituida en la República de Lituania, en un centro de datos ubicado en Boston, Estados Unidos de América.',
      'La administración, el despliegue y la orquestación de los servicios se realizan mediante herramientas de gestión de contenedores operadas directamente por Mandalo.',
      'El proveedor de infraestructura actúa exclusivamente como Encargado del Tratamiento y su intervención se limita a la custodia técnica, la disponibilidad y la seguridad física y lógica de los servidores. Dicho proveedor no accede al contenido de la información con fines propios ni la utiliza para finalidades distintas de las instruidas por Mandalo.',
      'La relación con el proveedor se encuentra regulada mediante un acuerdo de tratamiento de datos que incorpora obligaciones de confidencialidad y seguridad compatibles con la legislación colombiana.',
      'Mandalo conserva en todo momento la calidad de Responsable del Tratamiento y determina de manera exclusiva las finalidades y los medios del tratamiento.',
    ],
  },
  {
    heading: 'Artículo 23. Bases de Datos y Almacenamiento Temporal',
    paragraphs: [
      'La información estructurada de la plataforma se almacena en una base de datos relacional PostgreSQL administrada por Mandalo. Entre otros, podrán almacenarse: datos de identificación y contacto de usuarios, comercios aliados y domiciliarios; direcciones registradas y coordenadas geográficas asociadas; pedidos, estados de los pedidos e historial de operaciones; registros de entregas y confirmaciones; calificaciones y comentarios; registros de autenticación y eventos de seguridad; y configuración operativa de la aplicación.',
      'Adicionalmente, Mandalo utiliza un sistema de almacenamiento en memoria (Redis) para la gestión de sesiones activas, tokens de acceso, colas de procesamiento, notificaciones pendientes y datos operativos de carácter transitorio.',
      'La información contenida en dicho sistema tiene naturaleza temporal y se elimina automáticamente una vez cumplida su finalidad técnica o vencido su período de vigencia, sin perjuicio de su registro definitivo en la base de datos relacional cuando resulte necesario.',
      'El acceso a ambos sistemas se encuentra restringido al personal autorizado y a los servicios internos de la plataforma, mediante credenciales de acceso, control por roles y restricciones de red.',
    ],
  },
  {
    heading: 'Artículo 24. Almacenamiento de Archivos e Imágenes',
    paragraphs: [
      'Los archivos e imágenes cargados por los titulares se almacenan directamente en la infraestructura de servidores administrada por Mandalo, sin recurrir a servicios de almacenamiento en la nube de terceros distintos del proveedor de infraestructura señalado en el Artículo 22.',
      'Entre los archivos que podrán almacenarse se encuentran: fotografías de perfil; imágenes de comercios aliados y de productos; comprobantes y evidencias fotográficas de entrega; y documentos requeridos para los procesos de validación de comercios aliados y domiciliarios, incluida la fotografía del documento de identidad y de la licencia de conducción cuando resulte aplicable.',
      'Los documentos de identificación y demás archivos de carácter reservado se almacenan mediante identificadores no secuenciales y no se publican ni se indexan en medios de acceso público.',
      'El acceso a esta categoría de archivos se encuentra limitado al personal estrictamente necesario para los procesos de verificación, atención de reclamaciones y cumplimiento de obligaciones legales, conforme al principio de mínimo privilegio.',
      'Mandalo revisa y refuerza periódicamente los controles aplicables a esta categoría de información, conforme a lo previsto en el Artículo 45.',
    ],
  },
  {
    heading: 'Artículo 25. Autenticación de Usuarios',
    paragraphs: [
      'Mandalo administra directamente el proceso de autenticación mediante servicios desarrollados sobre su propia infraestructura, utilizando mecanismos de identificación basados en tokens de sesión.',
      'a) Inicio de sesión con cuenta de Google. Mandalo utiliza el servicio de identidad Google Sign-In, provisto por Google LLC, que permite al titular autenticarse utilizando su cuenta de Google. Mediante este mecanismo, Mandalo podrá recibir de Google, previa autorización del titular, el nombre asociado a la cuenta, la dirección de correo electrónico, la fotografía de perfil cuando esté disponible y el identificador único de la cuenta. Mandalo no tiene acceso a la contraseña de la cuenta de Google del titular ni la almacena en ningún momento.',
      'b) Registro y verificación mediante correo electrónico. El titular podrá registrarse utilizando una dirección de correo electrónico. En este caso, Mandalo enviará a dicha dirección un código o enlace de verificación, cuya validación se realiza íntegramente en la infraestructura propia de Mandalo mediante tokens de un solo uso y vigencia limitada. Para el envío de estos correos, Mandalo utiliza el servicio de correo electrónico de Google conforme al Artículo 26. Una vez validada la identidad, la sesión del titular se administra mediante tokens generados y custodiados por la infraestructura de Mandalo.',
      'La aplicación no utiliza mensajes de texto (SMS) para la verificación de usuarios y no solicita acceso a los mensajes del dispositivo.',
    ],
  },
  {
    heading: 'Artículo 26. Correo Electrónico Transaccional',
    paragraphs: [
      'Mandalo utiliza el servicio de correo electrónico de Google LLC para el envío de comunicaciones transaccionales relacionadas con la operación del servicio, tales como: correos de verificación de la dirección electrónica, restablecimiento de acceso, confirmación de pedidos, avisos de seguridad y respuestas a peticiones, quejas y reclamos.',
      'Para el funcionamiento de este servicio, la dirección de correo electrónico del titular y el contenido del mensaje son transmitidos a la infraestructura de Google para su entrega.',
      'El contenido de estas comunicaciones se limita a la información estrictamente necesaria para la finalidad correspondiente.',
    ],
  },
  {
    heading: 'Artículo 27. Notificaciones Push (Firebase Cloud Messaging)',
    paragraphs: [
      'Mandalo utiliza el servicio Firebase Cloud Messaging (FCM), provisto por Google LLC, con el único propósito de entregar notificaciones push a los dispositivos de los titulares.',
      'Para el funcionamiento de este servicio, la aplicación genera y transmite a Google un identificador técnico del dispositivo (token de registro), necesario para el enrutamiento de las notificaciones.',
      'Las notificaciones podrán incluir: confirmación y cambios de estado de los pedidos, asignación de domiciliario, inicio del recorrido, llegada al destino, cancelaciones, alertas de seguridad relacionadas con la cuenta, mensajes operativos y actualizaciones de la aplicación.',
      'Mandalo utiliza exclusivamente el componente de mensajería de Firebase. No utiliza los servicios de Firebase Authentication, Cloud Firestore, Realtime Database, Firebase Storage, Firebase Analytics ni Firebase Crashlytics.',
    ],
  },
  {
    heading: 'Artículo 28. Google Maps Platform',
    paragraphs: [
      'Con el propósito de facilitar la prestación de los servicios, Mandalo utiliza los servicios de Google Maps Platform, provistos por Google LLC.',
      'Este servicio permite visualizar mapas dentro de la aplicación, buscar y geocodificar direcciones, calcular rutas y distancias, estimar tiempos de desplazamiento y mostrar la ubicación aproximada del pedido durante su ejecución.',
      'Para su funcionamiento, este servicio requiere la transmisión a Google de coordenadas geográficas y direcciones, limitada a la información necesaria para la funcionalidad solicitada.',
      'El uso de Google Maps Platform se encuentra sujeto a las condiciones de servicio y a la política de privacidad establecidas por Google para dicho servicio.',
    ],
  },
  {
    heading: 'Artículo 29. Geolocalización',
    paragraphs: [
      'La geolocalización constituye una funcionalidad esencial para la operación de Mandalo.',
      'Cuando el titular otorgue la autorización correspondiente en su dispositivo, la aplicación podrá acceder a la ubicación con las siguientes finalidades:',
      [
        'Determinar la ubicación del usuario al momento de solicitar un pedido.',
        'Identificar la ubicación del comercio aliado.',
        'Asignar el pedido a un domiciliario disponible conforme a criterios operativos.',
        'Calcular rutas, distancias y el valor del servicio de entrega.',
        'Estimar tiempos de entrega.',
        'Permitir al usuario el seguimiento del pedido durante su ejecución.',
        'Atender reclamaciones e incidentes relacionados con entregas.',
      ],
      'El acceso a la ubicación se limitará a las finalidades descritas y a los permisos efectivamente concedidos por el titular, quien podrá revocarlos en cualquier momento desde la configuración de su dispositivo.',
    ],
  },
  {
    heading: 'Artículo 30. Geolocalización en Segundo Plano',
    paragraphs: [
      'El acceso a la ubicación del dispositivo mientras la aplicación se ejecuta en segundo plano está restringido exclusivamente a los domiciliarios y únicamente durante la ejecución de un pedido previamente aceptado.',
      'Esta funcionalidad tiene como finalidad exclusiva: mantener actualizado el recorrido del pedido en curso; permitir al usuario y al comercio conocer el avance de la entrega; mejorar la precisión del seguimiento y la estimación del tiempo de llegada; y garantizar la seguridad de la operación y atender incidentes durante el trayecto.',
      'La recolección de ubicación en segundo plano se activa al momento de aceptar un pedido y cesa automáticamente al finalizar, cancelar o cerrar dicho pedido. Fuera de estos períodos, la aplicación no accede a la ubicación en segundo plano.',
      'Mientras esta funcionalidad se encuentre activa, la aplicación mostrará una notificación permanente y visible en el dispositivo del domiciliario, indicando que su ubicación está siendo compartida.',
      'Mandalo no accede a la ubicación en segundo plano de los usuarios ni de los comercios aliados.',
      'El domiciliario será informado de manera destacada sobre esta funcionalidad, su finalidad y su alcance, con anterioridad a la solicitud del permiso correspondiente, y podrá revocarlo en cualquier momento desde la configuración de su dispositivo.',
      'La recolección de geolocalización en segundo plano cumple estrictamente con las directrices de privacidad de las tiendas de aplicaciones, limitándose exclusivamente a la trazabilidad del mapa de despacho activo para seguridad del ecosistema y control operativo del flete comercial de la Ley 2466 de 2025.',
    ],
  },
  {
    heading: 'Artículo 31. Permisos del Dispositivo',
    paragraphs: [
      'El funcionamiento de determinadas funcionalidades requiere autorización expresa del titular para acceder a ciertos recursos del dispositivo:',
      {
        table: {
          headers: ['Permiso', 'Finalidad', 'Aplica a'],
          rows: [
            ['Ubicación aproximada y precisa', 'Determinar direcciones, calcular rutas, asignar pedidos y permitir el seguimiento de la entrega', 'Usuarios, comercios y domiciliarios'],
            ['Ubicación en segundo plano', 'Seguimiento del recorrido durante un pedido activo', 'Únicamente domiciliarios'],
            ['Cámara', 'Capturar fotografías de perfil, evidencias de entrega y documentos de validación', 'Todas las categorías'],
            ['Galería o almacenamiento', 'Seleccionar imágenes previamente almacenadas para su carga en la aplicación', 'Todas las categorías'],
            ['Notificaciones push', 'Informar sobre el estado de los pedidos y alertas de seguridad', 'Todas las categorías'],
            ['Estado de la red e Internet', 'Establecer la conexión con los servidores de la plataforma', 'Todas las categorías'],
          ],
        },
      },
      'La negativa del titular a conceder alguno de estos permisos podrá limitar o impedir el funcionamiento de determinadas funcionalidades, sin que ello afecte los derechos reconocidos por la legislación vigente ni condicione la prestación de aquellos servicios que no dependan del permiso correspondiente.',
    ],
  },
  {
    heading: 'Artículo 32. Exactitud de la Información de Ubicación',
    paragraphs: [
      'La precisión de la información geográfica dependerá del dispositivo utilizado, de la disponibilidad de señal GPS, de las redes móviles, de la conexión a Internet y de otros factores técnicos ajenos al control de Mandalo.',
      'En consecuencia, la plataforma no garantiza que la ubicación mostrada sea exacta en todo momento, aunque adoptará las medidas razonables para ofrecer la mayor precisión posible mediante las tecnologías disponibles.',
    ],
  },
  {
    heading: 'Artículo 33. Servicios y Tecnologías No Utilizados. Identificadores Técnicos',
    paragraphs: [
      'Con el fin de garantizar la transparencia del tratamiento, Mandalo declara expresamente que, a la fecha de vigencia de la presente Política, la aplicación no:',
      [
        'Muestra publicidad de terceros ni integra redes o intermediarios publicitarios.',
        'Utiliza el identificador de publicidad del dispositivo (Advertising ID).',
        'Realiza seguimiento del comportamiento del titular con fines publicitarios o de perfilamiento comercial.',
        'Comparte datos personales con terceros con fines de mercadeo.',
        'Utiliza servicios de analítica de comportamiento ni de reporte automático de errores de terceros.',
        'Accede al micrófono, a la lista de contactos, al calendario, a los mensajes de texto ni al registro de llamadas del dispositivo.',
        'Recopila datos biométricos ni ninguna otra categoría de dato sensible.',
        'Recopila números de tarjetas de crédito o débito.',
      ],
      'Identificadores técnicos. Mandalo utiliza tokens de autenticación, identificadores de instalación, el identificador de dispositivo asociado al servicio de notificaciones y registros técnicos de funcionamiento, con la finalidad exclusiva de mantener sesiones activas, entregar notificaciones, prevenir accesos no autorizados y garantizar la seguridad de la plataforma.',
      'Actualización de los servicios. Mandalo podrá incorporar nuevos servicios tecnológicos, sustituir proveedores o actualizar las herramientas utilizadas. Cuando dichas modificaciones impliquen la incorporación de nuevos Encargados del Tratamiento, nuevas categorías de datos personales, nuevas finalidades o transferencias internacionales adicionales, la presente Política será actualizada y los cambios serán comunicados a los titulares antes de su entrada en vigor.',
    ],
  },
  { chapter: 'Capítulo IV — Tratamiento de Datos de Usuarios, Comercios y Domiciliarios' },
  {
    heading: 'Artículo 34. Generalidades',
    paragraphs: [
      'El tratamiento de los datos personales realizado por Mandalo variará según la categoría del titular y la naturaleza de la relación que mantenga con la plataforma.',
      'En todos los casos, únicamente serán tratados los datos personales necesarios para la prestación del servicio, el cumplimiento de obligaciones legales y la ejecución de las finalidades descritas, respetando los principios de necesidad, proporcionalidad, confidencialidad, seguridad y responsabilidad demostrada.',
    ],
  },
  {
    heading: 'Artículo 35. Tratamiento de Datos Personales de los Usuarios',
    paragraphs: [
      'Mandalo tratará los datos personales de los usuarios con el propósito de permitir el acceso a la plataforma, gestionar solicitudes de pedidos, coordinar la prestación de los servicios y garantizar una experiencia segura y eficiente. Para tal efecto, los datos podrán ser utilizados para:',
      [
        'Crear y administrar la cuenta del usuario.',
        'Verificar la autenticidad de la identidad y la mayoría de edad cuando resulte necesario.',
        'Permitir el inicio de sesión mediante cuenta de Google o correo electrónico verificado.',
        'Registrar direcciones de entrega.',
        'Gestionar pedidos y compras personalizadas.',
        'Calcular el costo del servicio conforme a la distancia recorrida y demás parámetros establecidos en el Anexo I de los Términos y Condiciones.',
        'Compartir con el comercio y el domiciliario únicamente la información indispensable para la correcta ejecución del pedido.',
        'Permitir el seguimiento del estado del pedido en tiempo real.',
        'Enviar notificaciones relacionadas con la prestación del servicio.',
        'Atender solicitudes, consultas, peticiones, quejas y reclamos.',
        'Prevenir actividades fraudulentas y fortalecer la seguridad de la plataforma.',
        'Cumplir obligaciones legales y contractuales.',
      ],
      'En ningún caso Mandalo utilizará los datos personales de los usuarios para finalidades distintas de las aquí previstas sin la autorización correspondiente o sin que exista un fundamento legal que lo permita.',
    ],
  },
  {
    heading: 'Artículo 36. Tratamiento de Datos Personales de los Comercios Aliados',
    paragraphs: [
      'Los datos personales de los comercios aliados serán tratados con el fin de permitir su vinculación a la plataforma, administrar la relación comercial y facilitar la gestión de los pedidos.',
      'Las finalidades específicas comprenderán, entre otras: registrar establecimientos comerciales; verificar la identidad de los representantes legales cuando resulte necesario; administrar el catálogo de productos y servicios; gestionar pedidos recibidos a través de la plataforma; coordinar la preparación y entrega de los pedidos; facilitar la comunicación con usuarios y domiciliarios; gestionar pagos, liquidaciones y reportes; atender requerimientos administrativos y legales; e implementar mecanismos para prevenir fraudes.',
      'Los comercios aliados se obligan a tratar los datos personales de los usuarios a los que tengan acceso exclusivamente para la ejecución del pedido correspondiente, y de conformidad con la legislación vigente sobre protección de datos personales.',
    ],
  },
  {
    heading: 'Artículo 37. Tratamiento de Datos Personales de los Domiciliarios',
    paragraphs: [
      'Los datos personales de los domiciliarios serán tratados para administrar su vinculación a la plataforma, coordinar la asignación de pedidos y garantizar la adecuada prestación del servicio de entrega.',
      'Entre otras, las finalidades comprenderán: verificar la identidad del domiciliario y su mayoría de edad; validar la documentación requerida para su registro; administrar su perfil dentro de la plataforma; asignar pedidos de acuerdo con criterios operativos; compartir con el domiciliario únicamente la información indispensable para realizar la entrega; registrar el historial de entregas; gestionar calificaciones y reportes asociados al servicio; realizar seguimiento de la ubicación durante los pedidos activos; atender incidentes; y cumplir obligaciones legales y contractuales.',
      'La información de geolocalización de los domiciliarios únicamente será utilizada durante el tiempo necesario para la ejecución de los pedidos, conforme al Artículo 30.',
    ],
  },
  {
    heading: 'Artículo 38. Compartición de Información entre las Partes',
    paragraphs: [
      'Con el fin de permitir la correcta ejecución de los pedidos, Mandalo compartirá determinada información entre los participantes de la operación. La información compartida está limitada al mínimo necesario para la prestación del servicio.',
      'El comercio aliado podrá conocer:',
      ['Nombre del usuario.', 'Información del pedido.', 'Dirección de entrega cuando resulte necesaria para la preparación del pedido.', 'Observaciones registradas por el usuario.'],
      'El domiciliario podrá conocer:',
      ['Nombre del usuario.', 'Dirección de recogida y dirección de entrega.', 'Número telefónico cuando resulte necesario para coordinar la entrega.', 'Observaciones relacionadas con el pedido.'],
      'El usuario podrá conocer:',
      ['Nombre del comercio y estado del pedido.', 'Nombre del domiciliario asignado.', 'Fotografía del perfil del domiciliario, cuando esté habilitada.', 'Ubicación aproximada del domiciliario durante el recorrido del pedido.', 'Tiempo estimado de llegada.'],
      'En ningún caso se compartirán datos personales que no sean necesarios para la correcta prestación del servicio.',
      'Los comercios aliados y los domiciliarios tienen prohibido utilizar los datos personales de los usuarios para finalidades distintas de la ejecución del pedido, incluyendo contactarlos con posterioridad a la entrega o incorporarlos a bases de datos propias.',
      'Compartición con Operadores Parafiscales de Ley: el usuario en el rol de Domiciliario Independiente autoriza de forma expresa a Mandalo para transmitir sus datos de identificación, contacto y reportes de ingresos mensuales a los operadores de información de la Planilla Integrada de Liquidación de Aportes (PILA), Administradoras de Riesgos Laborales (ARL), Entidades Promotoras de Salud (EPS) y Fondos de Pensión, con el único fin de tramitar la cotización cofinanciada exigida por la legislación nacional.',
    ],
  },
  {
    heading: 'Artículo 39. Comunicaciones entre las Partes',
    paragraphs: [
      'Mandalo podrá habilitar mecanismos de comunicación entre usuarios, comercios y domiciliarios cuando ello resulte necesario para la adecuada ejecución del servicio.',
      'Las comunicaciones realizadas mediante la plataforma podrán ser registradas cuando resulte necesario para resolver reclamaciones, investigar incidentes, prevenir fraudes, verificar la correcta prestación del servicio y cumplir obligaciones legales.',
      'El tratamiento de dicha información se realizará respetando la confidencialidad de las comunicaciones y únicamente durante el tiempo necesario para cumplir las finalidades aquí previstas.',
    ],
  },
  {
    heading: 'Artículo 40. Calificaciones, Comentarios y Reputación',
    paragraphs: [
      'Con el propósito de mejorar la calidad del servicio, Mandalo podrá permitir que los usuarios, comercios y domiciliarios se califiquen mutuamente una vez finalizado cada pedido.',
      'Las calificaciones podrán utilizarse para evaluar la calidad del servicio, generar indicadores internos, identificar oportunidades de mejora, detectar conductas fraudulentas o contrarias a los Términos y Condiciones e implementar medidas orientadas a fortalecer la seguridad y confiabilidad de la plataforma.',
      'Los comentarios realizados por los usuarios deberán respetar los derechos de terceros y no podrán contener información ilícita, ofensiva o difamatoria.',
    ],
  },
  {
    heading: 'Artículo 41. Prevención del Fraude y Protección de la Plataforma',
    paragraphs: [
      'Mandalo podrá tratar datos personales con el fin de prevenir actividades fraudulentas, proteger la integridad de la plataforma y garantizar la seguridad de todos los participantes.',
      'Para ello podrán realizarse actividades como verificación de identidad, validación de autenticaciones, detección de accesos inusuales, identificación de comportamientos atípicos, prevención de múltiples cuentas fraudulentas, registro de eventos de seguridad y análisis de incidentes relacionados con la operación.',
      'Cuando existan indicios razonables de fraude, uso indebido de la plataforma o incumplimiento de las condiciones de uso, Mandalo podrá adoptar medidas preventivas, incluyendo la suspensión temporal de funcionalidades o el bloqueo de cuentas, sin perjuicio del derecho del titular a presentar las aclaraciones correspondientes conforme al Artículo 14 de los Términos y Condiciones.',
    ],
  },
  {
    heading: 'Artículo 42. Conservación de Evidencias Operativas',
    paragraphs: [
      'Con el fin de atender reclamaciones, resolver controversias, responder requerimientos de autoridades competentes y garantizar la trazabilidad de las operaciones, Mandalo podrá conservar registros relacionados con: pedidos realizados; historial de entregas; registros de geolocalización asociados a pedidos ejecutados; confirmaciones de entrega; fotografías utilizadas como evidencia de entrega; registros de autenticación; eventos relevantes de seguridad; y comunicaciones relacionadas con incidentes del servicio.',
      'La conservación de dicha información se realizará únicamente durante el tiempo necesario para cumplir las finalidades descritas y de conformidad con los plazos establecidos en el Artículo 51.',
    ],
  },
  {
    heading: 'Artículo 43. Decisiones Automatizadas',
    paragraphs: [
      'Mandalo utiliza procesos automatizados para asignar pedidos, calcular distancias, estimar tiempos de entrega, determinar rutas y organizar la operación de la plataforma.',
      'Estas decisiones se fundamentan en criterios objetivos: la disponibilidad y conexión de los domiciliarios, la proximidad geográfica respecto del comercio, la distancia de la ruta, los tiempos estimados y el estado operativo de la plataforma. El pedido se ofrece a los domiciliarios disponibles priorizando la proximidad, y se asigna al primer domiciliario que lo acepte voluntariamente.',
      'Las decisiones automatizadas implementadas por Mandalo tienen una finalidad exclusivamente operativa y no producen efectos jurídicos independientes sobre los titulares ni sustituyen las decisiones que legalmente correspondan al Responsable del Tratamiento.',
      'Las medidas de suspensión o cancelación de cuentas no se adoptan de forma exclusivamente automatizada: toda decisión de esta naturaleza es revisada por personal de Mandalo y el titular podrá solicitar su reconsideración.',
    ],
  },
  { chapter: 'Capítulo V — Seguridad, Transferencias Internacionales y Conservación' },
  {
    heading: 'Artículo 44. Compromiso con la Seguridad de la Información',
    paragraphs: [
      'Mandalo reconoce que la protección de los datos personales constituye un elemento esencial para la confianza de los usuarios, comercios y domiciliarios.',
      'En consecuencia, implementará medidas técnicas, administrativas y organizacionales razonables destinadas a proteger la confidencialidad, integridad, disponibilidad y resiliencia de la información tratada, las cuales serán revisadas y actualizadas periódicamente teniendo en cuenta la evolución tecnológica y los riesgos identificados.',
    ],
  },
  {
    heading: 'Artículo 45. Medidas de Seguridad Implementadas',
    paragraphs: [
      'Seguridad de acceso:',
      ['Autenticación mediante tokens de sesión de vigencia limitada.', 'Control de acceso basado en perfiles y roles.', 'Restricción de acceso únicamente al personal autorizado.', 'Gestión segura de credenciales de acceso.', 'Registro de eventos de autenticación.'],
      'Seguridad de la información:',
      ['Cifrado de las comunicaciones mediante protocolos seguros (HTTPS/TLS).', 'Almacenamiento de los archivos de carácter reservado mediante identificadores no secuenciales, sin publicación ni indexación en medios de acceso público.', 'Implementación de reglas de seguridad para bases de datos y almacenamiento.', 'Copias de seguridad periódicas, sujetas a las mismas medidas de protección que la información en producción.'],
      'Seguridad operacional:',
      ['Monitoreo de incidentes.', 'Registro de eventos relevantes para auditoría.', 'Actualización periódica de la plataforma y corrección de vulnerabilidades identificadas.', 'Aplicación del principio de mínimo privilegio.', 'Segregación de los entornos de desarrollo y producción.'],
      'Las medidas implementadas serán objeto de revisión periódica y podrán modificarse de acuerdo con la evolución tecnológica y los riesgos identificados. Ningún sistema informático ofrece seguridad absoluta, por lo que Mandalo no garantiza que terceros no autorizados puedan superar las medidas implementadas, sin perjuicio de las obligaciones legales que le corresponden como Responsable del Tratamiento.',
    ],
  },
  {
    heading: 'Artículo 46. Confidencialidad',
    paragraphs: [
      'Toda persona que tenga acceso a datos personales tratados por Mandalo deberá mantener absoluta reserva sobre dicha información.',
      'La obligación de confidencialidad comprenderá tanto la información obtenida durante la ejecución de actividades operativas como aquella conocida con ocasión de relaciones contractuales, comerciales o de prestación de servicios, y subsistirá aun cuando finalice la relación que dio origen al acceso.',
    ],
  },
  {
    heading: 'Artículo 47. Gestión de Incidentes de Seguridad',
    paragraphs: [
      'Cuando Mandalo tenga conocimiento de un incidente que pueda comprometer la confidencialidad, integridad o disponibilidad de los datos personales, adoptará las medidas razonables necesarias para contener el incidente, identificar su causa, evaluar el impacto generado, restablecer la disponibilidad de los servicios afectados, implementar acciones correctivas y evitar la repetición de eventos similares.',
      'Mandalo reportará los incidentes que afecten datos personales ante la Superintendencia de Industria y Comercio en los términos y plazos previstos por la legislación vigente, y comunicará a los titulares afectados cuando ello resulte necesario para la protección de sus derechos.',
    ],
  },
  {
    heading: 'Artículo 48. Transferencia y Transmisión Internacional de Datos',
    paragraphs: [
      'Debido a la utilización de infraestructura tecnológica ubicada fuera del territorio colombiano, determinados datos personales son almacenados, procesados o transmitidos en el exterior.',
      'Las operaciones de transferencia y transmisión internacional se efectúan únicamente con los siguientes destinatarios:',
      {
        table: {
          headers: ['Destinatario', 'Servicio', 'País', 'Datos involucrados'],
          rows: [
            ['Hostinger International Ltd.', 'Infraestructura de servidores (hosting)', 'Estados Unidos (Boston)', 'Totalidad de la información alojada en la plataforma'],
            ['Google LLC', 'Google Sign-In (autenticación)', 'Estados Unidos', 'Nombre, correo electrónico, fotografía de perfil e identificador de cuenta'],
            ['Google LLC', 'Correo electrónico transaccional', 'Estados Unidos', 'Dirección de correo electrónico y contenido del mensaje'],
            ['Google LLC', 'Firebase Cloud Messaging', 'Estados Unidos', 'Identificador técnico del dispositivo y contenido de la notificación'],
            ['Google LLC', 'Google Maps Platform', 'Estados Unidos', 'Coordenadas geográficas y direcciones'],
          ],
        },
      },
      'Las transferencias y transmisiones internacionales se efectúan únicamente cuando resultan necesarias para la operación de la plataforma y se encuentran amparadas en: la autorización previa, expresa e informada otorgada por el titular al momento del registro, en la cual se le informa de manera específica sobre la transferencia internacional de sus datos personales; la circunstancia de que los Estados Unidos de América figuran entre los países que, conforme a los criterios de la Superintendencia de Industria y Comercio, ofrecen un nivel adecuado de protección de datos personales; y la suscripción, con cada uno de los proveedores señalados, de instrumentos contractuales que incorporan obligaciones de confidencialidad, seguridad y protección de datos compatibles con la legislación colombiana.',
      'Mandalo conserva la calidad de Responsable del Tratamiento respecto de toda la información transferida y responde por el cumplimiento de las obligaciones que le impone la legislación colombiana.',
    ],
  },
  {
    heading: 'Artículo 49. Tratamiento por Encargados',
    paragraphs: [
      'Mandalo podrá contratar proveedores tecnológicos o prestadores de servicios que actúen como Encargados del Tratamiento.',
      'En estos casos, dichos terceros únicamente podrán tratar los datos personales conforme a las instrucciones impartidas por Mandalo y exclusivamente para las finalidades autorizadas.',
      'Los Encargados deberán implementar medidas razonables de seguridad, confidencialidad y protección de la información y no podrán utilizar los datos personales para fines propios o distintos de aquellos expresamente autorizados.',
    ],
  },
  {
    heading: 'Artículo 50. Conservación de los Datos Personales',
    paragraphs: [
      'Los datos personales serán conservados únicamente durante el tiempo necesario para cumplir las finalidades que motivaron su recolección, atender obligaciones legales, contractuales, contables, tributarias o administrativas y resolver eventuales reclamaciones.',
      'Una vez desaparezca la necesidad de conservar la información, Mandalo procederá a eliminar los datos personales, anonimizar la información cuando resulte posible, bloquear temporalmente el acceso cuando exista obligación legal de conservación o adoptar cualquier otra medida permitida por la legislación vigente.',
      'La eliminación se realizará de manera segura procurando evitar la recuperación no autorizada de la información.',
    ],
  },
  {
    heading: 'Artículo 51. Plazos de Conservación',
    paragraphs: [
      'Mandalo conservará la información conforme a los siguientes plazos, sin perjuicio de los términos superiores que establezca la legislación aplicable:',
      {
        table: {
          headers: ['Tipo de información', 'Plazo de conservación'],
          rows: [
            ['Datos de la cuenta del usuario', 'Mientras la cuenta permanezca activa. Tras la solicitud de eliminación, se suprimen dentro de los 30 días calendario siguientes'],
            ['Cuentas inactivas', 'Se eliminan automáticamente transcurridos 24 meses sin actividad, previo aviso al titular'],
            ['Historial de pedidos y soportes de la transacción', '5 años, conforme a los términos de conservación de documentos comerciales y obligaciones tributarias'],
            ['Registros de autenticación y de seguridad', '12 meses'],
            ['Registros de geolocalización asociados a pedidos', '90 días desde la finalización del pedido, salvo que exista una reclamación en curso'],
            ['Evidencias fotográficas de entrega', '90 días desde la entrega, salvo que exista una reclamación en curso'],
            ['Comunicaciones entre las partes dentro de la aplicación', '6 meses'],
            ['Documentación de comercios aliados', 'Mientras exista la relación comercial y 5 años adicionales'],
            ['Documentación de domiciliarios', 'Mientras exista la relación con la plataforma y 5 años adicionales'],
            ['Registros de incidentes de seguridad', '2 años desde el cierre del incidente'],
            ['Prueba de la autorización para el tratamiento', 'Mientras se traten los datos y 5 años adicionales'],
            ['Reclamaciones y peticiones (PQR)', '3 años desde su resolución'],
          ],
        },
      },
      'Los plazos anteriores podrán ampliarse cuando exista una obligación legal, un requerimiento de autoridad competente o un proceso judicial o administrativo en curso que justifique la conservación de la información.',
    ],
  },
  {
    heading: 'Artículo 52. Eliminación y Anonimización',
    paragraphs: [
      'Cuando los datos personales dejen de ser necesarios para las finalidades que motivaron su tratamiento y no exista obligación legal de conservarlos, Mandalo procederá a su eliminación segura o, cuando resulte técnicamente viable, a su anonimización irreversible.',
      'La información anonimizada podrá ser utilizada para fines estadísticos, analíticos o de mejora del servicio, siempre que no permita identificar directa o indirectamente a los titulares.',
    ],
  },
  {
    heading: 'Artículo 53. Continuidad del Negocio',
    paragraphs: [
      'Mandalo implementa mecanismos de respaldo y recuperación con el fin de procurar la disponibilidad de la plataforma ante fallos técnicos, incidentes de seguridad o eventos que afecten la infraestructura tecnológica.',
      'Las copias de seguridad están sujetas a medidas de protección equivalentes a las aplicadas sobre la información en producción, se conservan en la misma región del centro de datos señalado en el Artículo 22 y se utilizan exclusivamente para asegurar la continuidad operativa y la recuperación de los servicios.',
    ],
  },
  { chapter: 'Capítulo VI — Derechos de los Titulares, Procedimientos y Disposiciones Finales' },
  {
    heading: 'Artículo 54. Derechos de los Titulares',
    paragraphs: [
      'De conformidad con la Constitución Política de Colombia, la Ley 1581 de 2012 y las demás normas aplicables, los titulares de la información tendrán derecho a ejercer, en cualquier momento, los siguientes derechos:',
      [
        'Conocer la existencia de datos personales que estén siendo tratados por Mandalo.',
        'Acceder de manera gratuita a sus datos personales.',
        'Solicitar la actualización de la información cuando esta sea parcial, incompleta, fraccionada, inexacta o se encuentre desactualizada.',
        'Solicitar la rectificación de los datos personales cuando corresponda.',
        'Solicitar la supresión de sus datos personales cuando proceda conforme a la legislación vigente.',
        'Revocar la autorización otorgada para el tratamiento, cuando ello sea legalmente procedente.',
        'Solicitar prueba de la autorización otorgada.',
        'Solicitar información sobre el uso dado a sus datos personales.',
        'Presentar consultas relacionadas con el tratamiento de su información.',
        'Formular peticiones, quejas o reclamos relacionados con el tratamiento de datos personales.',
        'Solicitar la eliminación de su cuenta conforme al Artículo 66 de la presente Política.',
        'Presentar quejas ante la Superintendencia de Industria y Comercio cuando considere que se ha vulnerado la legislación sobre protección de datos personales, una vez agotado el trámite de consulta o reclamo ante Mandalo cuando ello resulte exigible.',
        'Ejercer los demás derechos reconocidos por la Constitución Política de Colombia y la legislación vigente.',
      ],
    ],
  },
  {
    heading: 'Artículo 55. Ejercicio de los Derechos',
    paragraphs: [
      'Los titulares podrán ejercer sus derechos mediante solicitud dirigida al Responsable del Tratamiento a través de cualquiera de los siguientes canales oficiales:',
      [
        'Correo electrónico: mandaloputumayo@gmail.com',
        'Formulario web: https://somosmandalo.com',
        'Dentro de la aplicación: menú de Perfil → Privacidad y datos personales',
        'Domicilio: Cll 10 Cr 3-14 B/ 29 de mayo, Villagarzón, Putumayo, Colombia',
      ],
      'El ejercicio de estos derechos es gratuito y no está condicionado a la realización de pago alguno.',
    ],
  },
  {
    heading: 'Artículo 56. Contenido Mínimo de las Solicitudes',
    paragraphs: [
      'Las solicitudes relacionadas con el ejercicio de los derechos del titular deberán contener, como mínimo: el nombre completo del titular, su documento de identificación, información suficiente para identificar la cuenta o registro relacionado, una descripción clara de la solicitud, la dirección de correo electrónico o medio para recibir respuesta y los documentos que soporten la solicitud cuando resulten necesarios.',
      'Cuando la solicitud sea presentada por un representante, este deberá acreditar la representación correspondiente conforme a la legislación aplicable.',
    ],
  },
  {
    heading: 'Artículo 57. Consultas',
    paragraphs: [
      'Los titulares podrán consultar la información personal que repose en las bases de datos administradas por Mandalo.',
      'Las consultas serán atendidas en un término máximo de diez (10) días hábiles contados a partir de la fecha de su recibo. Cuando no fuere posible atender la consulta dentro de dicho término, se informará al interesado los motivos de la demora y la fecha en que se atenderá su consulta, la cual en ningún caso podrá superar los cinco (5) días hábiles siguientes al vencimiento del primer término.',
    ],
  },
  {
    heading: 'Artículo 58. Reclamos',
    paragraphs: [
      'Los titulares podrán presentar reclamos cuando consideren que la información tratada por Mandalo deba ser corregida, actualizada o suprimida, o cuando adviertan un posible incumplimiento de las obligaciones legales relacionadas con la protección de datos personales.',
      'El reclamo será atendido en un término máximo de quince (15) días hábiles contados a partir del día siguiente a la fecha de su recibo. Cuando no fuere posible atenderlo dentro de dicho término, se informará al interesado los motivos de la demora y la fecha en que se atenderá su reclamo, la cual en ningún caso podrá superar los ocho (8) días hábiles siguientes al vencimiento del primer término.',
      'Cuando el reclamo resulte incompleto, Mandalo requerirá al interesado dentro de los cinco (5) días siguientes a su recepción para que subsane las fallas. Transcurridos dos (2) meses desde la fecha del requerimiento sin que el solicitante presente la información requerida, se entenderá que ha desistido del reclamo.',
      'Una vez recibido el reclamo completo, se incluirá en la base de datos una leyenda que diga "reclamo en trámite" y el motivo del mismo, en un término no mayor a dos (2) días hábiles. Dicha leyenda deberá mantenerse hasta que el reclamo sea decidido.',
    ],
  },
  {
    heading: 'Artículo 59. Revocatoria de la Autorización',
    paragraphs: [
      'El titular podrá solicitar la revocatoria de la autorización otorgada para el tratamiento de sus datos personales cuando no exista un deber legal o contractual que obligue a Mandalo a continuar con dicho tratamiento.',
      'La revocatoria podrá ser total o parcial. En particular, el titular podrá revocar en cualquier momento y de manera independiente la autorización para recibir comunicaciones comerciales, sin que ello afecte la prestación del servicio.',
      'La revocatoria no tendrá efectos retroactivos respecto de las actuaciones realizadas de manera legítima con anterioridad a la solicitud.',
    ],
  },
  {
    heading: 'Artículo 60. Supresión de Datos Personales',
    paragraphs: [
      'El titular podrá solicitar la supresión de sus datos personales cuando considere que no están siendo tratados conforme a los principios, derechos y garantías previstos en la legislación vigente, cuando haya desaparecido la finalidad que justificó el tratamiento o cuando la revocatoria resulte procedente conforme a la ley.',
      'La supresión no procederá cuando exista una obligación legal o contractual que exija la conservación de la información, en los términos del Artículo 51.',
    ],
  },
  {
    heading: 'Artículo 61. Deberes del Responsable del Tratamiento',
    paragraphs: [
      'Mandalo, en calidad de Responsable del Tratamiento, se compromete a garantizar el ejercicio de los derechos de los titulares; solicitar las autorizaciones cuando sean legalmente exigibles y conservar evidencia de las mismas; utilizar la información únicamente para las finalidades informadas; implementar medidas razonables de seguridad; actualizar la información cuando sea necesario; rectificar los datos cuando resulten inexactos; suprimir la información cuando proceda; atender consultas y reclamos dentro de los términos legales; informar a los titulares sobre modificaciones sustanciales de la presente Política; e informar a la autoridad de protección de datos cuando se presenten violaciones a los códigos de seguridad.',
    ],
  },
  {
    heading: 'Artículo 62. Deberes de los Titulares',
    paragraphs: [
      'Los titulares de los datos personales se comprometen a suministrar información veraz y actualizada; mantener actualizados sus datos personales; utilizar la plataforma conforme a la ley y a los Términos y Condiciones; custodiar adecuadamente los mecanismos de autenticación utilizados para acceder a la aplicación; e informar oportunamente cualquier uso no autorizado de su cuenta o cualquier incidente que pueda afectar la seguridad de la información.',
    ],
  },
  {
    heading: 'Artículo 63. Aviso de Privacidad',
    paragraphs: [
      'Cuando no resulte posible poner a disposición del titular el texto íntegro de la presente Política, Mandalo comunicará mediante un aviso de privacidad la existencia de la misma, la forma de acceder a su contenido, las finalidades del tratamiento y los mecanismos dispuestos para el ejercicio de los derechos.',
      'El aviso de privacidad se presenta al titular durante el proceso de registro, con un enlace directo al texto completo de esta Política.',
    ],
  },
  {
    heading: 'Artículo 64. Modificaciones de la Política',
    paragraphs: [
      'Mandalo podrá modificar la presente Política cuando resulte necesario para dar cumplimiento a nuevas disposiciones legales, incorporar nuevas funcionalidades, implementar mejoras tecnológicas, integrar nuevos proveedores tecnológicos, fortalecer las medidas de seguridad o ajustar los procedimientos internos de tratamiento.',
      'Cuando las modificaciones afecten sustancialmente las finalidades del tratamiento, incorporen nuevos destinatarios de transferencias internacionales o afecten los derechos de los titulares, serán comunicadas mediante la aplicación, correo electrónico o notificación, con una antelación mínima de quince (15) días calendario a su entrada en vigor.',
      'Cuando la modificación implique una finalidad no cubierta por la autorización inicial, se solicitará una nueva autorización del titular.',
      'La versión vigente estará disponible permanentemente para consulta en https://somosmandalo.com/politicas-de-privacidad y dentro de la aplicación.',
    ],
  },
  {
    heading: 'Artículo 65. Legislación Aplicable',
    paragraphs: [
      'La presente Política se regirá e interpretará conforme a la Constitución Política de Colombia, la Ley 1581 de 2012, el Decreto 1377 de 2013, el Decreto 1074 de 2015 y las demás disposiciones que regulen la protección de datos personales en la República de Colombia.',
      'Cuando Mandalo utilice proveedores tecnológicos ubicados en otros países, el tratamiento internacional de datos personales se realizará sin perjuicio de la aplicación preferente de la legislación colombiana.',
    ],
  },
  {
    heading: 'Artículo 66. Eliminación de la Cuenta',
    paragraphs: [
      'Los usuarios, comercios aliados y domiciliarios podrán solicitar la eliminación de su cuenta en cualquier momento, de forma gratuita y sin necesidad de justificación, mediante cualquiera de los siguientes canales:',
      [
        'Desde la aplicación: menú de Perfil → Configuración de la cuenta → Eliminar cuenta.',
        'Desde la web: https://somosmandalo.com/eliminar-cuenta, sin necesidad de tener la aplicación instalada.',
        'Por correo electrónico: mandaloputumayo@gmail.com, desde la dirección registrada en la cuenta.',
      ],
      'La solicitud se hará efectiva dentro de los treinta (30) días calendario siguientes a su recepción, previa verificación de la identidad del solicitante.',
      'Información que se elimina: perfil del titular y credenciales de acceso; direcciones registradas; fotografía de perfil; documentos de identificación cargados; calificaciones y comentarios asociados de forma identificable; tokens de notificación y preferencias de la cuenta; registros de geolocalización no asociados a reclamaciones en curso.',
      'Información que se conserva y por cuánto tiempo: registros de las transacciones realizadas y soportes contables y tributarios (5 años, conforme a las obligaciones legales aplicables); información necesaria para atender reclamaciones, garantías o procesos en curso (mientras dichos procesos se encuentren vigentes); prueba de la autorización otorgada (5 años); registros exigidos por autoridad competente (por el término que dicha autoridad determine).',
      'Vencidos dichos plazos, la información será eliminada de forma segura o anonimizada de manera irreversible.',
      'La eliminación de la cuenta no exime al titular de las obligaciones pendientes de cumplimiento generadas con anterioridad a la solicitud.',
    ],
  },
  {
    heading: 'Artículo 67. Vigencia',
    paragraphs: [
      'La presente Política de Privacidad y Tratamiento de Datos Personales entra en vigor a partir de la fecha indicada en la portada del documento y permanecerá vigente mientras Mandalo realice actividades de tratamiento de datos personales o hasta que sea reemplazada por una versión posterior debidamente aprobada y publicada.',
      'Las bases de datos administradas por Mandalo tendrán una vigencia igual al tiempo en que se mantenga la finalidad que justificó su tratamiento.',
    ],
  },
  {
    heading: 'Artículo 68. Disposición Final',
    paragraphs: [
      'El tratamiento de los datos personales por parte de Mandalo se sustenta en la autorización previa, expresa e informada otorgada por el titular durante el proceso de registro, mediante la selección de la casilla específica dispuesta para tal efecto conforme al Artículo 8 de la presente Política.',
      'Dicha autorización comprende el conocimiento y la aceptación de las finalidades descritas en este documento, incluida la transferencia internacional de datos personales señalada en el Artículo 48.',
      'Lo anterior se entiende sin perjuicio de los derechos que la Constitución Política de Colombia y la legislación vigente reconocen a los titulares en materia de protección de datos personales y Habeas Data, los cuales son irrenunciables y podrán ejercerse en cualquier momento.',
    ],
  },
];

export { meta, blocks };
