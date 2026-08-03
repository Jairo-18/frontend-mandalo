// Contenido integro de los Terminos y Condiciones (TYC-001) -- portado tal
// cual desde web-mandalo/src/pages/terminos-y-condiciones-de-uso.astro al
// fusionar el sitio Astro dentro de frontend-mandalo (NOTAS S62). No cambiar
// el texto aca sin actualizar primero el documento legal registrado en
// Camara de Comercio.

type Para = string | string[] | { table: { headers: string[]; rows: string[][] } };
type Block = { chapter: string } | { heading: string; paragraphs: Para[] };

const meta = [
  ['Documento', 'Términos y Condiciones Generales de Uso de la Plataforma Tecnológica Mándalo'],
  ['Código', 'TYC-001'],
  ['Versión', '1.0'],
  ['Estado', 'Vigente'],
  ['Fecha de entrada en vigencia', '01 de agosto de 2026'],
  ['Titular y operador', 'Luis Carlos Erazo Burbano — NIT 1127077851-4'],
  ['Matrícula mercantil', '104098 — Cámara de Comercio del Putumayo'],
  ['Domicilio principal', 'Cll 10 Cr 3-14 B/ 29 de mayo, Villagarzón, Putumayo, Colombia'],
  ['Correo de contacto', 'mandaloputumayo@gmail.com'],
];

const blocks: Block[] = [
  { chapter: 'Capítulo I — Disposiciones Generales' },
  {
    heading: 'Artículo 1. Objeto',
    paragraphs: [
      'Los presentes Términos y Condiciones tienen por objeto regular el acceso, registro, navegación y utilización de la plataforma tecnológica Mándalo, así como establecer los derechos, obligaciones, responsabilidades y condiciones aplicables a las relaciones entre Mándalo, los clientes, los comercios afiliados y los repartidores independientes que utilicen la plataforma.',
      'Estos Términos y Condiciones constituyen un acuerdo jurídicamente vinculante entre Mándalo y cada uno de sus usuarios desde el momento en que estos aceptan expresamente su contenido mediante los mecanismos previstos en el Artículo 4.',
    ],
  },
  {
    heading: 'Artículo 2. Naturaleza y Alcance de la Plataforma',
    paragraphs: [
      'Mándalo es una plataforma tecnológica de intermediación digital que permite a los usuarios solicitar productos ofrecidos por comercios afiliados y gestionar su entrega mediante repartidores independientes.',
      'La plataforma actúa como intermediaria tecnológica entre las partes, facilitando la recepción, administración y gestión de pedidos mediante herramientas digitales.',
      'Salvo disposición legal expresa, Mándalo no actúa como fabricante, productor, proveedor directo, vendedor, distribuidor, comerciante ni transportador de los productos comercializados por los comercios afiliados.',
      'Lo anterior se entiende sin perjuicio de las responsabilidades que la legislación colombiana atribuya directamente a Mándalo en su condición de operador de la plataforma y de las obligaciones que le corresponden frente a los consumidores conforme al Estatuto del Consumidor.',
    ],
  },
  {
    heading: 'Artículo 3. Marco Normativo',
    paragraphs: [
      'Los presentes Términos y Condiciones se regirán e interpretarán de conformidad con la legislación vigente de la República de Colombia, especialmente por las siguientes disposiciones, sin limitarse a ellas:',
      [
        'Constitución Política de Colombia.',
        'Código Civil Colombiano.',
        'Código de Comercio.',
        'Ley 527 de 1999, sobre comercio electrónico, mensajes de datos y firmas electrónicas.',
        'Ley 1480 de 2011 (Estatuto del Consumidor) y sus normas reglamentarias, en particular las relativas al comercio electrónico.',
        'Ley 1581 de 2012 sobre Protección de Datos Personales.',
        'Decreto 1377 de 2013 y Decreto Único Reglamentario 1074 de 2015.',
        'Demás normas nacionales, departamentales o municipales que regulen las actividades desarrolladas mediante la plataforma.',
      ],
      'Cuando alguna disposición de estos Términos y Condiciones entre en conflicto con una norma imperativa del ordenamiento jurídico colombiano, prevalecerá esta última, manteniéndose vigentes las demás disposiciones del documento.',
    ],
  },
  {
    heading: 'Artículo 4. Aceptación de los Términos y Condiciones',
    paragraphs: [
      'La aceptación de los presentes Términos y Condiciones se manifiesta mediante la selección expresa de la casilla de aceptación dispuesta durante el proceso de registro en la aplicación.',
      'Dicha casilla se presentará sin marcación previa y de manera independiente de cualquier otra autorización, en particular de la autorización para el tratamiento de datos personales y de la autorización para recibir comunicaciones comerciales, las cuales se solicitan por separado.',
      'La aceptación electrónica producirá plenos efectos jurídicos conforme a la Ley 527 de 1999 y tendrá el mismo valor probatorio que un documento suscrito físicamente, salvo disposición legal en contrario.',
      'Mándalo conservará registro electrónico de la aceptación, incluyendo la fecha, la hora, el identificador del usuario y la versión del documento aceptado.',
      'Quien no esté de acuerdo con estos Términos y Condiciones deberá abstenerse de registrarse y de utilizar la plataforma.',
    ],
  },
  {
    heading: 'Artículo 5. Capacidad Legal y Edad Mínima',
    paragraphs: [
      'El uso de la plataforma Mándalo está permitido exclusivamente a personas mayores de dieciocho (18) años que cuenten con capacidad legal para contratar conforme a la legislación colombiana.',
      'La plataforma no está dirigida a menores de edad, no permite su registro y no recopila intencionalmente sus datos personales. Al aceptar estos Términos y Condiciones, el usuario declara ser mayor de dieciocho (18) años.',
      'Esta restricción obedece, entre otras razones, a que la plataforma puede intermediar la venta de productos cuya comercialización está legalmente restringida a mayores de edad, conforme al Capítulo XVI del presente documento.',
      'Cuando Mándalo advierta que una cuenta ha sido creada por una persona menor de edad, procederá a su cancelación inmediata y a la eliminación de los datos personales asociados, salvo que exista un deber legal de conservación.',
      'Mándalo podrá solicitar verificaciones de identidad y de edad cuando resulte razonablemente necesario para garantizar el cumplimiento de esta disposición, prevenir fraudes o proteger la seguridad de los usuarios.',
    ],
  },
  {
    heading: 'Artículo 6. Modificación de los Términos y Condiciones',
    paragraphs: [
      'Mándalo podrá modificar, actualizar, complementar o sustituir los presentes Términos y Condiciones cuando resulte necesario para cumplir nuevas disposiciones legales o regulatorias, incorporar nuevos servicios o funcionalidades, fortalecer la seguridad de la plataforma, optimizar la operación tecnológica o atender cambios en el modelo de negocio.',
      'Toda modificación será publicada dentro de la plataforma indicando expresamente su fecha de entrada en vigencia y el número de versión correspondiente.',
      'Cuando las modificaciones afecten de manera sustancial los derechos u obligaciones de los usuarios, Mándalo las comunicará con una antelación mínima de quince (15) días calendario a su entrada en vigor, mediante notificación dentro de la aplicación, correo electrónico o cualquier otro canal idóneo.',
      'El usuario que no esté de acuerdo con las modificaciones podrá terminar su relación con la plataforma y solicitar la eliminación de su cuenta en cualquier momento, sin costo ni penalidad alguna, conforme al Artículo 15.',
      'El uso de la plataforma con posterioridad a la entrada en vigencia de las modificaciones constituirá aceptación de la nueva versión, sin perjuicio de los derechos irrenunciables que la ley reconozca a los usuarios y de los casos en que la legislación exija una aceptación expresa adicional.',
      'Las modificaciones no afectarán los pedidos ya confirmados ni los derechos válidamente adquiridos con anterioridad a su entrada en vigor.',
    ],
  },
  {
    heading: 'Artículo 7. Tiendas de Aplicaciones',
    paragraphs: [
      'La aplicación Mándalo se distribuye a través de tiendas de aplicaciones operadas por terceros, entre ellas Google Play y Apple App Store.',
      'Los presentes Términos y Condiciones se celebran exclusivamente entre el usuario y Mándalo. Los operadores de dichas tiendas no son parte de este acuerdo, no asumen responsabilidad alguna por la aplicación, su contenido o su funcionamiento, y no prestan servicios de soporte respecto de la misma.',
      'El usuario reconoce que, adicionalmente a estos Términos y Condiciones, el uso de la aplicación se encuentra sujeto a los términos de servicio de la tienda desde la cual la haya descargado.',
      'Toda reclamación relacionada con la aplicación deberá dirigirse a Mándalo a través de los canales oficiales previstos en el Capítulo XIV, y no a los operadores de las tiendas de aplicaciones.',
      'El usuario declara que no se encuentra ubicado en un país sujeto a embargo por parte de las autoridades competentes ni incluido en listas restrictivas que impidan el uso de la aplicación.',
    ],
  },
  { chapter: 'Capítulo II — Definiciones' },
  {
    heading: 'Artículo 8. Definiciones',
    paragraphs: [
      'Para efectos de la interpretación y aplicación de los presentes Términos y Condiciones, los siguientes términos tendrán el significado que se indica a continuación:',
      [
        'Aceptación Electrónica: manifestación de voluntad realizada mediante medios electrónicos, con plena validez jurídica conforme a la Ley 527 de 1999.',
        'Aplicación: software móvil, sitio web o cualquier otro canal digital operado por Mándalo que permita acceder a sus servicios.',
        'Cliente: persona natural mayor de dieciocho (18) años que utiliza la plataforma para solicitar productos ofrecidos por los comercios afiliados o para solicitar compras personalizadas.',
        'Comercio Afiliado: persona natural o jurídica que ofrece productos mediante la plataforma Mándalo y los vende directamente a los clientes.',
        'Compra Personalizada: modalidad de servicio mediante la cual el cliente solicita al repartidor la adquisición de uno o varios productos en un establecimiento no afiliado a la plataforma, conforme al Capítulo V.',
        'Cuenta: registro personal creado por un usuario para acceder a los servicios de la plataforma.',
        'Datos Personales: información vinculada o que pueda asociarse a una persona natural identificada o identificable, conforme a la Ley 1581 de 2012.',
        'Pedido: solicitud realizada por un cliente para adquirir uno o varios productos ofrecidos por un comercio afiliado.',
        'Plataforma: ecosistema tecnológico operado por Mándalo, integrado por la aplicación móvil, sitio web, servidores, bases de datos, interfaces y demás componentes tecnológicos destinados a facilitar la intermediación digital.',
        'Productos: bienes ofrecidos por los comercios afiliados mediante la plataforma o adquiridos mediante compra personalizada.',
        'Repartidor: persona natural mayor de dieciocho (18) años que, actuando de manera independiente y autónoma, realiza el servicio de recogida y entrega de pedidos. En la Política de Privacidad se denomina indistintamente "domiciliario".',
        'Servicios de Intermediación: servicios tecnológicos prestados por Mándalo consistentes en facilitar la interacción entre clientes, comercios y repartidores para la gestión de pedidos.',
        'Tarifa de Servicio: valor cobrado por Mándalo como contraprestación por el uso de la plataforma tecnológica y los servicios de intermediación digital, conforme al Artículo 38.',
        'Valor del Servicio de Entrega: valor correspondiente al servicio de transporte prestado por el repartidor, calculado conforme al Anexo I.',
        'Usuario: toda persona natural o jurídica que accede, navega, consulta, se registra o utiliza la plataforma, incluyendo clientes, comercios afiliados y repartidores.',
      ],
      'Los términos definidos en singular comprenderán igualmente su plural cuando el contexto así lo requiera y viceversa. Cuando un término no se encuentre definido expresamente, se interpretará conforme a la legislación colombiana y al significado técnico o jurídico generalmente aceptado para la materia correspondiente.',
    ],
  },
  { chapter: 'Capítulo III — Registro, Cuenta y Eliminación' },
  {
    heading: 'Artículo 9. Registro de Usuarios',
    paragraphs: [
      'Para acceder a las funcionalidades de la plataforma será necesario crear una cuenta de usuario.',
      'El registro es personal, individual e intransferible y únicamente podrá realizarse mediante los procedimientos habilitados por Mándalo, los cuales incluyen el inicio de sesión con cuenta de Google y el registro con dirección de correo electrónico verificada.',
      'Cada usuario podrá mantener una sola cuenta activa por modalidad de uso, salvo autorización expresa de Mándalo.',
      'La creación de la cuenta no genera, por sí misma, derecho alguno a recibir servicios específicos, mantener la cuenta activa de manera indefinida o acceder a funcionalidades futuras de la plataforma.',
    ],
  },
  {
    heading: 'Artículo 10. Información del Usuario',
    paragraphs: [
      'El usuario deberá suministrar información completa, exacta, veraz, actualizada y verificable durante el proceso de registro.',
      'Mándalo solicitará únicamente la información necesaria para la prestación del servicio, conforme al principio de minimización de datos. Dependiendo del tipo de usuario, podrá solicitarse:',
      'Clientes:',
      ['Nombres y apellidos.', 'Número de teléfono.', 'Correo electrónico.', 'Dirección de entrega, ciudad y municipio.', 'Información de facturación cuando resulte aplicable.'],
      'Comercios afiliados:',
      ['Nombre comercial y razón social cuando corresponda.', 'NIT o documento de identificación.', 'Nombre y documento del representante legal, cuando aplique.', 'Dirección del establecimiento y horario de atención.', 'Categoría comercial.', 'Información bancaria para la dispersión de pagos.', 'Permisos, licencias o registros exigidos por la legislación aplicable.'],
      'Repartidores:',
      ['Nombres y apellidos.', 'Documento de identidad y fotografía del mismo, cuando sea requerida para procesos de validación.', 'Licencia de conducción, cuando resulte aplicable.', 'Información y documentación vigente del vehículo utilizado.', 'Número telefónico y correo electrónico.', 'Información bancaria para recibir pagos.', 'Demás documentos que la legislación colombiana exija para desarrollar la actividad.'],
      'El tratamiento de esta información se rige por la Política de Privacidad y Tratamiento de Datos Personales, disponible permanentemente en https://somosmandalo.com/politicas-de-privacidad y dentro de la aplicación.',
    ],
  },
  {
    heading: 'Artículo 11. Veracidad y Actualización de la Información',
    paragraphs: [
      'El usuario garantiza que toda la información suministrada es verdadera, completa, exacta y corresponde a su identidad o representación legal, y se compromete a mantenerla permanentemente actualizada.',
      'Mándalo podrá suspender temporalmente o cancelar definitivamente cualquier cuenta cuando existan indicios razonables y objetivos de que la información registrada sea falsa, pertenezca a un tercero sin autorización, se encuentre alterada, sea inconsistente, haya sido utilizada para cometer fraude o incumpla la legislación colombiana.',
      'La suspensión o cancelación podrá efectuarse sin perjuicio de las acciones civiles, administrativas o penales a que haya lugar.',
    ],
  },
  {
    heading: 'Artículo 12. Verificación de Identidad',
    paragraphs: [
      'Con el fin de proteger la seguridad de la plataforma, verificar la mayoría de edad y prevenir actividades fraudulentas, Mándalo podrá verificar la identidad de los usuarios antes o después del registro.',
      'Para tal efecto podrá solicitar documentos de identidad, fotografías de los mismos, códigos de verificación enviados al correo electrónico registrado, comprobantes de titularidad, certificaciones o cualquier otro mecanismo de autenticación permitido por la legislación colombiana.',
      'Mándalo no recopila ni procesa datos biométricos para la identificación de los usuarios.',
      'La negativa injustificada a completar los procesos de verificación podrá impedir el registro, limitar determinadas funcionalidades o dar lugar a la suspensión de la cuenta.',
    ],
  },
  {
    heading: 'Artículo 13. Seguridad de la Cuenta',
    paragraphs: [
      'Cada usuario será responsable de mantener la confidencialidad de sus credenciales de acceso, incluyendo contraseñas, códigos de autenticación y demás mecanismos de seguridad implementados por la plataforma.',
      'El usuario se obliga a crear contraseñas seguras, no compartir sus credenciales con terceros, proteger el acceso a sus dispositivos, cerrar la sesión cuando utilice equipos compartidos e informar a Mándalo, tan pronto tenga conocimiento, sobre la pérdida del dispositivo, el acceso no autorizado a la cuenta, el robo de credenciales o cualquier incidente que pueda comprometer la seguridad de su información.',
      'Las operaciones realizadas desde una cuenta registrada se presumirán efectuadas por su titular. Esta presunción admite prueba en contrario y no será aplicable cuando el usuario haya reportado oportunamente a Mándalo el acceso no autorizado a su cuenta, ni cuando el acceso indebido sea imputable a una falla de seguridad de la plataforma.',
      'Mándalo podrá implementar mecanismos de autenticación multifactor, códigos de verificación, detección de accesos inusuales, bloqueo preventivo de cuentas y monitoreo de actividades sospechosas. La implementación de estas medidas no garantiza la inexistencia absoluta de riesgos informáticos.',
    ],
  },
  {
    heading: 'Artículo 14. Suspensión, Restricción y Cancelación de la Cuenta por Mándalo',
    paragraphs: [
      'Mándalo podrá suspender, restringir o cancelar una cuenta cuando exista cualquiera de las siguientes circunstancias:',
      [
        'Incumplimiento de estos Términos y Condiciones.',
        'Utilización indebida de la plataforma.',
        'Fraude o intento de fraude comprobado o razonablemente fundado.',
        'Suministro de información falsa o suplantación de identidad.',
        'Utilización de documentos falsificados.',
        'Incumplimiento de obligaciones legales.',
        'Afectación de la seguridad de la plataforma.',
        'Verificación de que el titular es menor de dieciocho (18) años.',
        'Orden emitida por autoridad competente.',
        'Cualquier conducta que genere riesgos objetivos para otros usuarios o para Mándalo.',
      ],
      'La suspensión temporal podrá mantenerse mientras se adelantan las verificaciones correspondientes.',
      'Mándalo informará al usuario sobre la suspensión o cancelación de su cuenta y sobre los motivos que la fundamentan, salvo cuando exista prohibición legal, orden de autoridad competente o cuando ello comprometa una investigación en curso sobre actividades fraudulentas.',
      'El usuario podrá presentar aclaraciones y solicitar la revisión de la medida a través de los canales oficiales de atención. Mándalo responderá dentro de los términos previstos en el Artículo 79.',
      'La cancelación de la cuenta no extinguirá las obligaciones económicas, contractuales o legales generadas con anterioridad.',
    ],
  },
  {
    heading: 'Artículo 15. Eliminación de la Cuenta a Solicitud del Usuario',
    paragraphs: [
      'El usuario podrá solicitar la eliminación de su cuenta en cualquier momento, de forma gratuita y sin necesidad de justificación, mediante cualquiera de los siguientes canales:',
      [
        'Desde la aplicación: menú de Perfil → Configuración de la cuenta → Eliminar cuenta.',
        'Desde la web: https://somosmandalo.com/eliminar-cuenta, sin necesidad de tener la aplicación instalada.',
        'Por correo electrónico: mandaloputumayo@gmail.com, desde la dirección registrada en la cuenta.',
      ],
      'La solicitud se hará efectiva dentro de los treinta (30) días calendario siguientes a su recepción, previa verificación de la identidad del solicitante y del cumplimiento de las obligaciones económicas pendientes.',
      'Como consecuencia de la eliminación de la cuenta se suprimirán: el perfil del usuario y sus credenciales de acceso, las direcciones registradas, la fotografía de perfil, los documentos de identificación cargados, las calificaciones y comentarios asociados de forma identificable, los tokens de notificación y las preferencias de la cuenta.',
      'Se conservarán, únicamente por el tiempo y en la medida exigidos por la ley: los registros de las transacciones realizadas y los soportes contables y tributarios asociados, por el término legal aplicable; la información necesaria para atender reclamaciones, garantías o procesos en curso, mientras estos se encuentren vigentes; y los registros exigidos por autoridad competente.',
      'Vencidos dichos términos, la información será eliminada de forma segura o anonimizada de manera irreversible. El detalle de los plazos de conservación se encuentra en la Política de Privacidad y Tratamiento de Datos Personales.',
      'La eliminación de la cuenta no exime al usuario de las obligaciones pendientes de cumplimiento generadas con anterioridad a la solicitud.',
    ],
  },
  { chapter: 'Capítulo IV — Funcionamiento de la Plataforma' },
  {
    heading: 'Artículo 16. Naturaleza del Servicio',
    paragraphs: [
      'Mándalo presta un servicio de intermediación tecnológica que permite a los clientes localizar comercios afiliados, realizar pedidos, gestionar su pago cuando corresponda y coordinar la entrega mediante repartidores independientes.',
      'La plataforma facilita la interacción entre las partes, pero no participa en la fabricación, preparación, venta, almacenamiento o producción de los bienes ofrecidos por los comercios, ni presta directamente el servicio de transporte de los productos.',
    ],
  },
  {
    heading: 'Artículo 17. Cobertura del Servicio',
    paragraphs: [
      'La plataforma operará en los municipios que Mándalo determine y publique oficialmente dentro de la aplicación.',
      'La disponibilidad del servicio dependerá de la cobertura geográfica, la disponibilidad de comercios y repartidores, los horarios de operación, las condiciones de seguridad, las restricciones impuestas por autoridades competentes y la capacidad operativa de la plataforma.',
      'Mándalo podrá ampliar, restringir o modificar su cobertura territorial, informando dicha circunstancia dentro de la aplicación.',
    ],
  },
  {
    heading: 'Artículo 18. Disponibilidad de la Plataforma',
    paragraphs: [
      'Mándalo realizará esfuerzos razonables para mantener la plataforma disponible de manera continua. No obstante, podrán presentarse interrupciones temporales derivadas de mantenimiento preventivo o correctivo, actualizaciones del sistema, fallas de infraestructura tecnológica, indisponibilidad de servicios de terceros, ataques informáticos, eventos de fuerza mayor o caso fortuito, o cualquier circunstancia razonablemente ajena al control de Mándalo.',
      'Siempre que resulte posible, el mantenimiento programado será informado con antelación dentro de la aplicación.',
      'La indisponibilidad temporal de la plataforma no generará, por sí sola, derecho a indemnización, sin perjuicio de los derechos que la legislación colombiana reconozca a los consumidores y de la devolución de los valores cobrados por servicios que no hayan podido prestarse.',
    ],
  },
  {
    heading: 'Artículo 19. Publicación de Productos',
    paragraphs: [
      'Los productos ofrecidos mediante la plataforma son publicados directamente por los comercios afiliados, quienes son responsables de la información relacionada con el nombre del producto, su descripción, ingredientes, composición, fotografías, precios, promociones, disponibilidad, restricciones de venta y demás características comerciales.',
      'Mándalo podrá retirar publicaciones que incumplan la legislación colombiana, estos Términos y Condiciones o las políticas internas de la plataforma.',
    ],
  },
  {
    heading: 'Artículo 20. Realización del Pedido',
    paragraphs: [
      'El cliente podrá realizar pedidos seleccionando los productos ofrecidos por los comercios afiliados y siguiendo el procedimiento establecido dentro de la aplicación.',
      'Antes de confirmar el pedido, la plataforma informará de manera clara, suficiente, visible y desagregada, como mínimo:',
      [
        'El comercio seleccionado.',
        'Los productos incluidos y sus cantidades.',
        'El precio individual de cada producto y el valor total de los mismos.',
        'El valor del servicio de entrega, cuando corresponda.',
        'La tarifa de servicio de Mándalo.',
        'Los descuentos o promociones aplicadas.',
        'Los impuestos legalmente aplicables.',
        'El valor total a pagar.',
        'El método de pago seleccionado.',
        'La dirección de entrega registrada por el cliente.',
        'El tiempo estimado de entrega.',
      ],
      'La confirmación del pedido únicamente podrá efectuarse una vez el cliente haya tenido acceso a la totalidad de esta información.',
      'Es responsabilidad del cliente verificar la exactitud de la información antes de confirmar definitivamente el pedido.',
    ],
  },
  {
    heading: 'Artículo 21. Confirmación del Pedido',
    paragraphs: [
      'El pedido se entenderá formalmente realizado cuando el cliente confirme la compra mediante los mecanismos electrónicos habilitados por la plataforma.',
      'La confirmación constituye una manifestación expresa de voluntad y genera la obligación del cliente de pagar el valor total informado al momento de la aceptación.',
      'La recepción del pedido por parte de Mándalo no implica su aceptación automática por el comercio ni garantiza la disponibilidad de los productos solicitados.',
    ],
  },
  {
    heading: 'Artículo 22. Aceptación del Pedido por el Comercio',
    paragraphs: [
      'Una vez recibido el pedido, el comercio podrá aceptarlo, rechazarlo o solicitar aclaraciones cuando resulte necesario.',
      'El pedido únicamente se entenderá aceptado cuando el comercio manifieste electrónicamente su aceptación mediante la plataforma. Hasta ese momento no existirá obligación para el comercio de preparar los productos solicitados.',
      'Cuando el comercio rechace el pedido o no lo acepte dentro de un plazo razonable, el pedido será cancelado sin costo alguno para el cliente y se procederá a la devolución de los valores cobrados, cuando corresponda.',
    ],
  },
  {
    heading: 'Artículo 23. Disponibilidad de Productos',
    paragraphs: [
      'La disponibilidad de los productos dependerá exclusivamente del inventario del comercio afiliado.',
      'Cuando uno o varios productos no se encuentren disponibles, el comercio deberá informarlo de manera inmediata a través de la plataforma, y el cliente podrá aceptar un producto sustituto, modificar el pedido, cancelar únicamente el producto afectado o cancelar el pedido completo.',
      'En ningún caso el comercio podrá sustituir productos sin la autorización previa y expresa del cliente, salvo cuando este haya autorizado expresamente sustituciones automáticas dentro de la plataforma.',
      'Cuando la cancelación obedezca a la indisponibilidad de productos, no se generará costo alguno para el cliente y se devolverán íntegramente los valores cobrados.',
    ],
  },
  {
    heading: 'Artículo 24. Asignación del Repartidor',
    paragraphs: [
      'Una vez aceptado el pedido por el comercio, la plataforma iniciará el proceso de asignación de un repartidor independiente.',
      'La asignación se realiza mediante un proceso automatizado que ofrece el pedido a los repartidores disponibles y conectados en el área de cobertura, priorizando la proximidad geográfica respecto del comercio y la optimización del tiempo de entrega. El servicio se asigna al primer repartidor que lo acepte voluntariamente.',
      'Estos criterios son objetivos y de naturaleza exclusivamente operativa. La descripción detallada del tratamiento de datos asociado a este proceso se encuentra en la Política de Privacidad y Tratamiento de Datos Personales.',
      'La aceptación del pedido por parte del repartidor es completamente voluntaria y no genera relación laboral con Mándalo.',
    ],
  },
  {
    heading: 'Artículo 25. Tiempos Estimados de Entrega',
    paragraphs: [
      'Los tiempos informados por la plataforma constituyen estimaciones calculadas con base en la información disponible al momento de realizar el pedido.',
      'Estos tiempos podrán variar por circunstancias tales como el volumen de pedidos, los tiempos de preparación del comercio, las condiciones climáticas, la congestión vehicular, los cierres de vías, accidentes, manifestaciones, restricciones de movilidad, eventos de fuerza mayor o cualquier otra circunstancia ajena al control razonable de Mándalo.',
      'Los tiempos estimados no constituyen una garantía contractual de entrega en una hora determinada. Cuando se presenten demoras significativas, la plataforma informará al cliente sobre el estado del pedido.',
    ],
  },
  {
    heading: 'Artículo 26. Comunicación Durante el Pedido',
    paragraphs: [
      'Durante la ejecución del servicio, la plataforma podrá permitir la comunicación entre cliente, comercio y repartidor mediante los canales tecnológicos habilitados.',
      'Las comunicaciones deberán utilizarse exclusivamente para asuntos relacionados con el pedido. Se prohíbe utilizar dichos canales para realizar amenazas, efectuar actos de acoso, reenviar publicidad, solicitar información personal innecesaria, promover actividades ilícitas o utilizar lenguaje ofensivo o discriminatorio.',
      'Mándalo podrá conservar registros de dichas comunicaciones cuando resulte necesario para la atención de reclamaciones, la prevención del fraude, el cumplimiento de obligaciones legales o la protección de los usuarios, de conformidad con la legislación aplicable.',
    ],
  },
  {
    heading: 'Artículo 27. Preparación del Pedido',
    paragraphs: [
      'Una vez aceptado el pedido, el comercio será el único responsable de preparar los productos conforme a la descripción publicada, las especificaciones seleccionadas por el cliente, las normas sanitarias aplicables y las condiciones de calidad ofrecidas.',
      'El comercio deberá entregar los productos correctamente empacados, identificados y protegidos para permitir su adecuado transporte.',
      'Mándalo no interviene en la fabricación, elaboración, manipulación, almacenamiento, preparación o empaque de los productos comercializados por los establecimientos afiliados.',
    ],
  },
  {
    heading: 'Artículo 28. Entrega al Repartidor',
    paragraphs: [
      'El comercio entregará el pedido al repartidor previamente asignado mediante la plataforma.',
      'El repartidor verificará únicamente que recibe el número de paquetes o unidades informadas por el comercio, sin que exista obligación de abrir empaques sellados, inspeccionar alimentos, verificar cantidades internas o revisar el contenido de productos cuya apertura pueda afectar su integridad, higiene o seguridad.',
      'La entrega del pedido al repartidor marcará el inicio de la etapa de transporte hacia el cliente.',
    ],
  },
  {
    heading: 'Artículo 29. Transporte del Pedido',
    paragraphs: [
      'El repartidor deberá transportar los productos utilizando los elementos adecuados para preservar su estado, calidad e integridad durante el recorrido.',
      'Cuando la naturaleza del producto lo requiera, el repartidor deberá emplear maletas térmicas, contenedores especializados u otros elementos de transporte apropiados.',
      'Durante el transporte, el repartidor deberá adoptar las medidas razonables para evitar pérdidas, derrames, contaminación, daños físicos o alteraciones de los productos.',
    ],
  },
  {
    heading: 'Artículo 30. Entrega al Cliente',
    paragraphs: [
      'El pedido será entregado en la dirección registrada por el cliente al momento de confirmar la compra. El cliente deberá encontrarse disponible para recibir el pedido.',
      'La entrega se entenderá válidamente realizada cuando el pedido sea recibido por el cliente, un familiar, un empleado, un portero, un vigilante o cualquier persona que razonablemente se encuentre autorizada para recibir el pedido en la dirección suministrada.',
      'Tratándose de productos cuya venta esté restringida a mayores de edad, la entrega se sujetará a lo dispuesto en el Artículo 100.',
      'Una vez realizada la entrega, los riesgos asociados a la conservación del producto serán asumidos por quien lo reciba, salvo que la ley disponga otra cosa y sin perjuicio de los derechos de garantía reconocidos por el Estatuto del Consumidor.',
    ],
  },
  {
    heading: 'Artículo 31. Dirección Incorrecta o Información Insuficiente',
    paragraphs: [
      'El cliente es responsable de suministrar una dirección completa, exacta, verificable y suficientemente detallada para permitir la correcta entrega del pedido, incluyendo, cuando resulte aplicable, el nombre del conjunto residencial o edificio, el número de apartamento u oficina, la torre o bloque, el barrio, las referencias de ubicación y las instrucciones especiales de acceso.',
      'Cuando la dirección suministrada sea errónea, inexistente, incompleta o impida razonablemente la entrega del pedido, Mándalo, el comercio y el repartidor no serán responsables por los retrasos o la imposibilidad de efectuar la entrega derivados de dicha circunstancia.',
      'En estos casos podrán generarse costos adicionales por desplazamientos o nuevos intentos de entrega, los cuales serán informados al cliente y requerirán su aceptación previa antes de ser cobrados.',
    ],
  },
  {
    heading: 'Artículo 32. Imposibilidad de Entrega',
    paragraphs: [
      'Cuando el repartidor no pueda realizar la entrega por causas atribuibles al cliente —incluyendo la ausencia del destinatario, la negativa injustificada a recibir el pedido, la imposibilidad de establecer contacto mediante los canales registrados, una dirección incorrecta, restricciones de ingreso no informadas previamente, condiciones de seguridad que impidan razonablemente la entrega o instrucciones contradictorias— el repartidor realizará esfuerzos razonables para comunicarse con el cliente utilizando los medios disponibles.',
      'Si transcurrido un tiempo prudencial no es posible efectuar la entrega, el pedido podrá darse por finalizado.',
      'En tal evento, el cliente no tendrá derecho a la devolución de la tarifa de servicio ni de los costos operativos efectivamente causados, sin perjuicio de los derechos irrenunciables reconocidos por la legislación colombiana.',
      'Cuando la naturaleza del producto permita su devolución al comercio, el repartidor podrá retornarlo al establecimiento. Si ello no fuere posible por razones sanitarias, de seguridad o por la naturaleza perecedera del producto, el comercio determinará su destino conforme a la legislación aplicable.',
    ],
  },
  {
    heading: 'Artículo 33. Cancelación de Pedidos',
    paragraphs: [
      'El régimen de cancelación de pedidos será el siguiente:',
      'a) Antes de la aceptación por el comercio: el cliente podrá cancelar libremente el pedido sin generar costo alguno. No se causará la tarifa de servicio ni costos de operación asociados al pedido.',
      'b) Después de la aceptación por el comercio y antes de la recogida por el repartidor: la tarifa de servicio no será reembolsable, por haberse iniciado las actividades tecnológicas, administrativas y operativas necesarias para la gestión del pedido, salvo en los casos previstos en el Artículo 42.',
      'c) Después de la recogida por el repartidor: podrán generarse, además de la tarifa de servicio, los costos correspondientes al servicio de entrega y demás gastos efectivamente ocasionados por la ejecución parcial del servicio.',
      'En todos los casos, cuando la cancelación obedezca a causas imputables al comercio, al repartidor o a Mándalo, el cliente tendrá derecho a la devolución íntegra de todos los valores pagados, incluida la tarifa de servicio.',
      'Cuando el pago se hubiere realizado por un medio electrónico habilitado por la plataforma, Mándalo gestionará la reversión o devolución conforme al medio de pago utilizado, los tiempos de procesamiento de la entidad financiera y la legislación colombiana aplicable.',
    ],
  },
  {
    heading: 'Artículo 34. Pedidos Fraudulentos',
    paragraphs: [
      'Constituyen pedidos fraudulentos, entre otros, aquellos realizados mediante información falsa, identidad suplantada, documentos adulterados, medios de pago fraudulentos, múltiples cuentas creadas para obtener beneficios indebidos, simulación de pedidos, abuso de promociones, utilización de herramientas automatizadas para afectar el funcionamiento de la plataforma, o cualquier conducta destinada a obtener un beneficio ilegítimo o causar perjuicios a otros usuarios.',
      'Cuando existan indicios razonables y objetivos de fraude, Mándalo podrá suspender temporalmente la cuenta, cancelar definitivamente el registro del usuario, bloquear promociones o beneficios, rechazar nuevos pedidos, conservar las evidencias electrónicas correspondientes e informar los hechos a las autoridades competentes cuando exista obligación legal o ello resulte procedente.',
      'Estas medidas deberán ser proporcionales a los riesgos identificados y el usuario afectado podrá presentar las aclaraciones correspondientes.',
    ],
  },
  { chapter: 'Capítulo V — Compras Personalizadas' },
  {
    heading: 'Artículo 35. Naturaleza de la Compra Personalizada',
    paragraphs: [
      'La compra personalizada es una modalidad mediante la cual el cliente encarga al repartidor la adquisición de uno o varios productos en un establecimiento que no se encuentra afiliado a la plataforma.',
      'En esta modalidad, el repartidor actúa por cuenta y riesgo del cliente y siguiendo sus instrucciones. Mándalo se limita a facilitar el contacto tecnológico y no interviene en la selección, calidad, precio ni disponibilidad de los productos adquiridos.',
      'El cliente reconoce que el establecimiento no afiliado no es parte de la relación contractual con Mándalo y que las garantías legales sobre los productos deberán ejercerse directamente ante dicho establecimiento, conservando el cliente la factura o comprobante de compra.',
    ],
  },
  {
    heading: 'Artículo 36. Solicitud, Valor Estimado y Adelanto de Recursos',
    paragraphs: [
      'Al solicitar una compra personalizada, el cliente deberá indicar con la mayor precisión posible los productos requeridos, el establecimiento sugerido cuando corresponda y un valor máximo autorizado para la compra.',
      'El valor final se determinará conforme al precio efectivamente pagado en el establecimiento, acreditado mediante la factura o comprobante correspondiente, más el valor del servicio de entrega y la tarifa de servicio.',
      'Cuando el repartidor deba adelantar recursos propios para efectuar la compra, el cliente se obliga a reembolsar íntegramente dicho valor al momento de la entrega, contra la presentación del comprobante de compra.',
      'Si el valor real excede el máximo autorizado, el repartidor deberá consultar al cliente antes de efectuar la compra. En ausencia de autorización, la compra no se realizará.',
      'La negativa injustificada del cliente a reembolsar los valores adelantados y debidamente acreditados dará lugar a la suspensión de la cuenta y a las acciones legales correspondientes.',
    ],
  },
  {
    heading: 'Artículo 37. Límites y Exclusiones',
    paragraphs: [
      'Mándalo podrá establecer un valor máximo por compra personalizada, el cual será informado dentro de la aplicación.',
      'No podrán solicitarse mediante esta modalidad: productos cuya comercialización esté prohibida por la legislación colombiana; medicamentos de venta bajo fórmula médica; sustancias psicoactivas; armas, municiones o explosivos; animales vivos; dinero en efectivo, títulos valores o instrumentos negociables; joyas u objetos de alto valor; ni ningún producto que requiera licencia o autorización especial que el cliente no pueda acreditar.',
      'La venta de bebidas alcohólicas mediante esta modalidad se sujeta a lo dispuesto en el Artículo 100.',
      'El repartidor podrá negarse a ejecutar una compra personalizada cuando esta resulte contraria a la ley, comprometa su seguridad o exceda las condiciones informadas al momento de aceptar el servicio.',
    ],
  },
  { chapter: 'Capítulo VI — Tarifas, Precios y Pagos' },
  {
    heading: 'Artículo 38. Tarifa de Servicio',
    paragraphs: [
      'Como contraprestación por el uso de la plataforma tecnológica y los servicios de intermediación digital, Mándalo cobrará al cliente una Tarifa de Servicio equivalente al siete por ciento (7 %) del valor de los productos incluidos en cada pedido.',
      'Esta tarifa remunera el uso de la infraestructura tecnológica, la operación de la plataforma, la administración del servicio, el mantenimiento de servidores, el desarrollo y actualización de software, el soporte técnico, las herramientas de seguridad, la atención al usuario y la mejora continua del servicio.',
      'La Tarifa de Servicio es independiente del valor de los productos vendidos por el comercio y del valor correspondiente al servicio de entrega realizado por el repartidor.',
      'Mándalo podrá establecer tarifas diferentes para determinadas ciudades, campañas promocionales, categorías de productos o modalidades especiales de servicio, informando previamente al usuario antes de la confirmación del pedido.',
    ],
  },
  {
    heading: 'Artículo 39. Valor del Servicio de Entrega',
    paragraphs: [
      'El valor del servicio de entrega corresponde al transporte realizado por el repartidor independiente y se calcula conforme a la fórmula, tarifas mínimas y recargos establecidos en el Anexo I del presente documento.',
      'Este valor se informa al cliente de manera desagregada antes de la confirmación del pedido y no podrá modificarse unilateralmente con posterioridad.',
      'Mándalo podrá actualizar las tarifas del Anexo I conforme al procedimiento de modificación previsto en el Artículo 6. Las actualizaciones no afectarán los pedidos ya confirmados.',
    ],
  },
  {
    heading: 'Artículo 40. Información del Precio',
    paragraphs: [
      'Antes de confirmar el pedido, la plataforma informará al cliente, de forma clara, suficiente, visible y desagregada: el valor de los productos, los descuentos aplicados, el valor del servicio de entrega cuando corresponda, la Tarifa de Servicio de Mándalo, los impuestos cuando resulten aplicables y el valor total a pagar.',
      'La confirmación del pedido únicamente podrá efectuarse una vez el usuario tenga acceso a esta información.',
    ],
  },
  {
    heading: 'Artículo 41. Aceptación del Cobro',
    paragraphs: [
      'Al confirmar el pedido, el cliente acepta expresamente el valor de los productos seleccionados, la Tarifa de Servicio, el valor del servicio de entrega cuando corresponda, los impuestos legalmente aplicables y el valor total informado por la plataforma.',
      'La aceptación electrónica constituirá autorización suficiente para efectuar el cobro conforme al método de pago seleccionado.',
    ],
  },
  {
    heading: 'Artículo 42. Reembolso de la Tarifa de Servicio',
    paragraphs: [
      'Una vez el comercio haya aceptado el pedido, la Tarifa de Servicio no será reembolsable, salvo en cualquiera de los siguientes casos, en los cuales procederá su devolución íntegra:',
      [
        'Cuando una disposición legal establezca lo contrario.',
        'Cuando el pedido no pueda ejecutarse por causas imputables al comercio afiliado.',
        'Cuando el pedido no pueda ejecutarse por causas imputables al repartidor.',
        'Cuando el pedido no pueda ejecutarse por fallas de la plataforma o por error atribuible a Mándalo.',
        'Cuando el producto entregado no corresponda al solicitado o el pedido se entregue incompleto.',
        'Cuando la plataforma decida voluntariamente efectuar la devolución o proceda conforme a sus políticas vigentes.',
      ],
      'La presente disposición no limita los derechos mínimos e irrenunciables reconocidos por el Estatuto del Consumidor.',
    ],
  },
  {
    heading: 'Artículo 43. Métodos de Pago',
    paragraphs: [
      'Actualmente, Mándalo permite los siguientes métodos de pago: efectivo contra entrega, consignación bancaria y transferencia bancaria autorizada por el comercio.',
      'La aplicación actúa únicamente como una herramienta de intermediación y visualización de información de clasificados comerciales. El procesamiento monetario de los productos y fletes se ejecuta de forma exclusiva fuera del software (Off-app Transactions) en el mundo físico entre las partes, por lo cual la aplicación no recauda, custodia ni procesa flujos de pago digitales de usuarios dentro de la plataforma móvil.',
      'En el futuro, la plataforma podrá incorporar pasarelas de pago, tarjetas débito y crédito, billeteras digitales, transferencias inmediatas, pagos mediante códigos QR o cualquier otro mecanismo de pago legalmente autorizado. La incorporación de nuevos métodos será informada dentro de la aplicación.',
      'Mándalo no almacena información de tarjetas de crédito o débito. Cuando se habiliten pagos electrónicos, estos serán procesados por proveedores especializados sujetos a los estándares de seguridad aplicables.',
      'La disponibilidad de cada método podrá variar según la ciudad, el comercio o la modalidad del servicio.',
    ],
  },
  {
    heading: 'Artículo 44. Comprobantes Electrónicos y Facturación',
    paragraphs: [
      'Mándalo generará comprobantes electrónicos de cada operación realizada mediante la plataforma, los cuales podrán contener el número del pedido, la fecha y hora, la identificación del comercio, los productos adquiridos, el valor de los productos, el valor del servicio de entrega, la Tarifa de Servicio, los descuentos aplicados, los impuestos, el valor total pagado y el método de pago utilizado.',
      'La facturación de los productos corresponde al comercio afiliado, quien es responsable del cumplimiento de sus obligaciones tributarias y de facturación electrónica ante la Dirección de Impuestos y Aduanas Nacionales.',
      'Mándalo expedirá factura electrónica por la Tarifa de Servicio que cobra como contraprestación por los servicios de intermediación tecnológica, conforme a la normativa tributaria vigente.',
      'Los comprobantes generados por la plataforma no sustituyen las obligaciones tributarias o de facturación que correspondan legalmente a cada parte.',
    ],
  },
  { chapter: 'Capítulo VII — Obligaciones del Cliente' },
  {
    heading: 'Artículo 45. Obligaciones Generales del Cliente',
    paragraphs: [
      'El cliente se obliga a:',
      [
        'Suministrar información veraz, completa, exacta y actualizada.',
        'Mantener actualizados sus datos de contacto y dirección de entrega.',
        'Utilizar la plataforma de buena fe y conforme a la legislación colombiana.',
        'Revisar cuidadosamente la información del pedido antes de confirmarlo.',
        'Pagar el valor total del pedido conforme al método de pago seleccionado.',
        'Recibir oportunamente el pedido en la dirección suministrada.',
        'Tratar con respeto a los comercios, repartidores y personal de Mándalo.',
        'Abstenerse de realizar actuaciones que afecten el funcionamiento normal de la plataforma.',
        'Cumplir los presentes Términos y Condiciones y las políticas publicadas por Mándalo.',
      ],
    ],
  },
  {
    heading: 'Artículo 46. Conductas Prohibidas para el Cliente',
    paragraphs: [
      'Sin perjuicio de las demás prohibiciones previstas en estos Términos y Condiciones, el cliente no podrá:',
      [
        'Realizar pedidos falsos.',
        'Utilizar identidades o documentos de terceros sin autorización.',
        'Crear múltiples cuentas para obtener beneficios indebidos.',
        'Manipular promociones, descuentos o programas de referidos.',
        'Utilizar programas automatizados o cualquier mecanismo destinado a alterar el funcionamiento de la plataforma.',
        'Solicitar productos con fines ilícitos.',
        'Amenazar, intimidar, acosar o agredir a comercios, repartidores o personal de Mándalo.',
        'Publicar información falsa o difamatoria.',
        'Interferir en los sistemas de seguridad de la plataforma.',
        'Utilizar la plataforma con fines fraudulentos o contrarios a la ley.',
      ],
      'El incumplimiento de estas obligaciones podrá dar lugar a la suspensión o cancelación de la cuenta, conforme al procedimiento previsto en el Artículo 14, sin perjuicio de las acciones legales correspondientes.',
    ],
  },
  { chapter: 'Capítulo VIII — Obligaciones del Comercio Afiliado' },
  {
    heading: 'Artículo 47. Obligaciones Generales del Comercio',
    paragraphs: [
      'El comercio afiliado se obliga a:',
      [
        'Mantener vigente y actualizada la información registrada en la plataforma.',
        'Contar con las autorizaciones, licencias y permisos exigidos por la legislación para desarrollar su actividad.',
        'Ofrecer únicamente productos cuya comercialización sea legal.',
        'Mantener actualizados los precios y la disponibilidad de los productos.',
        'Preparar los pedidos conforme a las especificaciones aceptadas por el cliente.',
        'Entregar los pedidos correctamente empacados y protegidos.',
        'Cumplir los horarios de atención publicados.',
        'Informar oportunamente la indisponibilidad de productos.',
        'Atender las garantías y reclamaciones que legalmente le correspondan.',
        'Tratar los datos personales de los usuarios a los que tenga acceso exclusivamente para la ejecución del pedido correspondiente y conforme a la Ley 1581 de 2012.',
        'Cumplir las obligaciones previstas en el Estatuto del Consumidor y las demás normas aplicables.',
      ],
    ],
  },
  {
    heading: 'Artículo 48. Información de Productos',
    paragraphs: [
      'El comercio será el único responsable por la veracidad, exactitud, suficiencia y actualización de la información publicada respecto de sus productos, incluyendo nombres, descripciones, ingredientes, composición, fotografías, alérgenos cuando corresponda, precios, promociones, restricciones de venta, disponibilidad y condiciones especiales.',
      'Mándalo no modifica ni valida previamente dicha información, sin perjuicio de su facultad para retirar publicaciones que incumplan la legislación o las políticas de la plataforma.',
    ],
  },
  {
    heading: 'Artículo 49. Calidad, Seguridad e Inocuidad',
    paragraphs: [
      'El comercio garantiza que los productos entregados cumplen con las condiciones de calidad, seguridad, higiene e inocuidad exigidas por la legislación colombiana.',
      'Cuando se trate de alimentos, medicamentos o productos sometidos a regulación sanitaria, el comercio será responsable del cumplimiento de las normas expedidas por las autoridades competentes.',
      'La responsabilidad sobre la calidad de los productos corresponde al comercio, sin perjuicio de los derechos que la ley reconoce a los consumidores.',
    ],
  },
  {
    heading: 'Artículo 50. Productos Agotados o No Disponibles',
    paragraphs: [
      'Cuando alguno de los productos solicitados no se encuentre disponible, el comercio deberá informar dicha circunstancia a través de la plataforma de manera inmediata.',
      'El cliente podrá aceptar un producto sustituto, modificar el pedido, cancelar únicamente el producto afectado o cancelar el pedido completo cuando ello resulte procedente.',
      'En ningún caso el comercio podrá sustituir un producto sin autorización expresa del cliente.',
    ],
  },
  {
    heading: 'Artículo 51. Actualización de Precios',
    paragraphs: [
      'El comercio será responsable de mantener permanentemente actualizados los precios publicados en la plataforma.',
      'Cuando exista un error evidente en el precio informado, el comercio deberá comunicarlo antes de iniciar la preparación del pedido. Si el cliente no acepta el precio correcto, el pedido podrá cancelarse sin penalidad para las partes y con devolución íntegra de los valores pagados.',
      'La reiteración de errores en los precios podrá dar lugar a medidas administrativas por parte de Mándalo.',
    ],
  },
  {
    heading: 'Artículo 52. Conductas Prohibidas para el Comercio',
    paragraphs: [
      'El comercio no podrá:',
      [
        'Publicar información falsa.',
        'Vender productos cuya comercialización esté prohibida.',
        'Entregar productos diferentes sin autorización del cliente.',
        'Modificar unilateralmente los precios después de la aceptación del pedido.',
        'Discriminar usuarios por razones prohibidas por la ley.',
        'Manipular calificaciones o reseñas.',
        'Exigir al cliente el pago de valores distintos o adicionales a los informados y aceptados dentro de la plataforma al momento de confirmar el pedido.',
        'Utilizar la plataforma para actividades ilícitas.',
        'Incumplir de manera reiterada los pedidos aceptados.',
      ],
      'Mándalo podrá suspender o cancelar la cuenta del comercio cuando se presenten incumplimientos graves o reiterados, conforme al procedimiento previsto en el Artículo 14.',
    ],
  },
  { chapter: 'Capítulo IX — Repartidores Independientes' },
  {
    heading: 'Artículo 53. Naturaleza de la Relación',
    paragraphs: [
      'Independencia y Autonomía: las Partes acuerdan expresamente que la relación entre Mándalo y el Repartidor Independiente es de carácter estrictamente comercial, autónoma e independiente. El Aliado Repartidor declara que mantiene plena libertad para definir sus horarios, días de conexión, zonas de operación, aceptar o rechazar solicitudes de envío sin penalización alguna, y hacer uso simultáneo de otras plataformas digitales competidoras (multiactivación). En ningún caso este documento se interpretará como la existencia de un contrato laboral o subordinación jurídica bajo el Código Sustantivo del Trabajo de Colombia.',
      '1) Sistema de Seguridad Social Cofinanciada (Ley 2466 de 2025). En estricto cumplimiento de la normativa laboral vigente en la República de Colombia, la protección del Aliado Repartidor se estructurará bajo el modelo híbrido de trabajador independiente cofinanciado:',
      [
        'Aportes a Salud y Pensión (Fórmula 60/40): los aportes obligatorios a los subsistemas de Salud y Pensión se calcularán sobre el Ingreso Base de Cotización (IBC) mensual o parcial legalmente establecido (40% de los ingresos brutos efectivamente percibidos dentro de la plataforma). La Plataforma asumirá y pagará directamente al operador de la planilla PILA el sesenta por ciento (60%) del valor total de dichos aportes. El cuarenta por ciento (40%) restante estará a cargo del Aliado Repartidor.',
        'Sistema de Riesgos Laborales (ARL — 100% Empresa): la Plataforma asumirá y pagará el cien por ciento (100%) del costo total de la afiliación y cotización al Sistema General de Riesgos Laborales (ARL), de acuerdo con la clasificación de riesgo asignada a la actividad y los días o fracciones de tiempo en los que el Aliado Repartidor registre conexión efectiva en la interfaz.',
      ],
      '2) Mecanismo de Recaudo Manual Semanal y Transparencia Financiera. Dado que la plataforma opera exclusivamente bajo la modalidad de pago en efectivo contra entrega en el entorno físico y no administra pasarelas de pago virtuales internas para la retención automatizada, el Aliado Repartidor se obliga a transferir de forma manual y anticipada una cuota fija de veinticinco mil pesos ($25.000 COP) semanales a los canales bancarios o de recaudo que el operador determine (Nequi, Daviplata o cuenta autorizada). Este valor corresponde estrictamente a su porcentaje legal de aporte (40% de salud y pensión). El incumplimiento de este pago manual dará lugar a la desactivación preventiva del perfil en la interfaz.',
      '3) Obligación de Unificación. La Plataforma se obliga a unificar el aporte transferido por el trabajador con el subsidio empresarial correspondiente (60% corporativo), tramitando el pago unificado ante el operador PILA autorizado e informando periódicamente al Aliado Repartidor sobre el estado de sus aportes mediante los canales de soporte.',
    ],
  },
  {
    heading: 'Artículo 54. Obligaciones del Repartidor',
    paragraphs: [
      'El repartidor se obliga a:',
      [
        'Recoger oportunamente el pedido en el comercio asignado.',
        'Verificar el número de paquetes recibidos.',
        'Transportar adecuadamente los productos.',
        'Cumplir las normas de tránsito.',
        'Mantener un trato respetuoso hacia clientes y comercios.',
        'Utilizar correctamente la aplicación.',
        'Conservar actualizada la documentación requerida.',
        'Proteger la confidencialidad de la información conocida durante la prestación del servicio y utilizarla exclusivamente para la ejecución del pedido.',
        'Verificar la mayoría de edad del destinatario cuando el pedido incluya productos de venta restringida.',
        'Entregar los pedidos en el menor tiempo razonablemente posible.',
      ],
    ],
  },
  {
    heading: 'Artículo 55. Vehículo y Elementos de Transporte',
    paragraphs: [
      'El repartidor será responsable de mantener el vehículo utilizado en condiciones mecánicas y de seguridad adecuadas, así como de disponer de los elementos necesarios para transportar los productos conforme a su naturaleza, incluyendo, cuando corresponda, maletas térmicas, cajas de transporte, contenedores especializados, sistemas de sujeción y demás implementos necesarios para preservar la integridad del pedido.',
    ],
  },
  {
    heading: 'Artículo 56. Accidentes y Riesgos de la Actividad',
    paragraphs: [
      'El repartidor asume los riesgos propios derivados de la conducción del vehículo y de la prestación independiente del servicio, y será responsable de mantener vigentes los documentos exigidos por la legislación colombiana para conducir y operar el vehículo utilizado.',
      'Mándalo no será responsable por accidentes de tránsito, comparendos, sanciones, daños materiales o lesiones ocasionadas por actuaciones imputables al repartidor, salvo cuando una norma imperativa disponga expresamente lo contrario.',
    ],
  },
  {
    heading: 'Artículo 57. Daños, Pérdidas o Deterioro de los Productos',
    paragraphs: [
      'El repartidor deberá adoptar todas las medidas razonables para conservar los productos en las mismas condiciones en que fueron recibidos del comercio.',
      'Cuando durante el transporte se presenten pérdidas, daños, derrames, contaminación o deterioro atribuibles a una conducta dolosa o culposa del repartidor, este responderá conforme a la legislación colombiana.',
      'Mándalo podrá colaborar en la investigación de los hechos utilizando los registros disponibles en la plataforma, sin que ello implique asumir la responsabilidad que legalmente corresponda al repartidor o al comercio.',
    ],
  },
  {
    heading: 'Artículo 58. Conductas Prohibidas para el Repartidor',
    paragraphs: [
      'El repartidor no podrá:',
      [
        'Abrir empaques sellados o manipular el contenido de los pedidos.',
        'Consumir productos transportados.',
        'Sustituir productos.',
        'Solicitar pagos no autorizados o alterar el valor del pedido.',
        'Utilizar documentos falsos.',
        'Prestar el servicio bajo los efectos del alcohol o sustancias psicoactivas.',
        'Compartir su cuenta con terceros.',
        'Utilizar los datos personales de los clientes para fines distintos de la ejecución del pedido, incluyendo contactarlos con posterioridad a la entrega.',
        'Utilizar la plataforma para actividades ilícitas.',
        'Incumplir deliberadamente las entregas asignadas.',
      ],
      'El incumplimiento de estas obligaciones podrá dar lugar a la suspensión temporal, cancelación definitiva de la cuenta o a las acciones legales correspondientes, conforme al procedimiento previsto en el Artículo 14.',
    ],
  },
  { chapter: 'Capítulo X — Responsabilidad' },
  {
    heading: 'Artículo 59. Naturaleza Jurídica de la Plataforma',
    paragraphs: [
      'Mándalo es una plataforma tecnológica de intermediación digital que facilita el contacto entre clientes, comercios y repartidores independientes para la gestión de pedidos y servicios de entrega.',
      'Mándalo no fabrica, produce, prepara, transforma, almacena, vende, distribuye ni comercializa directamente los productos ofrecidos por los comercios afiliados, ni presta directamente el servicio de transporte, el cual es ejecutado por repartidores independientes.',
      'La responsabilidad de Mándalo se circunscribe a la prestación del servicio de intermediación tecnológica, sin perjuicio de las obligaciones que expresamente le imponga la legislación colombiana en su condición de operador de la plataforma.',
    ],
  },
  {
    heading: 'Artículo 60. Responsabilidad del Comercio',
    paragraphs: [
      'Cada comercio será responsable frente al cliente por la calidad, cantidad, estado, preparación, fabricación, conservación, empaque y almacenamiento de los productos; por la información publicada; por el cumplimiento de la normativa sanitaria; por la garantía legal de los productos; y por las obligaciones previstas en la Ley 1480 de 2011 y demás normas aplicables.',
      'La utilización de la plataforma no modifica ni limita las obligaciones legales que corresponden al comercio como proveedor de bienes.',
    ],
  },
  {
    heading: 'Artículo 61. Responsabilidad del Repartidor',
    paragraphs: [
      'El repartidor responderá por los daños ocasionados durante la prestación del servicio cuando estos sean consecuencia de dolo, culpa o negligencia demostrada conforme a la legislación colombiana.',
      'Esta responsabilidad comprenderá, cuando resulte procedente, la pérdida del pedido, el deterioro ocasionado durante el transporte, la entrega a persona no autorizada por causa imputable al repartidor, el incumplimiento injustificado del servicio y cualquier otra actuación atribuible directamente al repartidor.',
    ],
  },
  {
    heading: 'Artículo 62. Alcance de la Responsabilidad de Mándalo',
    paragraphs: [
      'Mándalo responderá por los daños que sean consecuencia directa del incumplimiento de las obligaciones que legalmente le correspondan como proveedor del servicio de intermediación tecnológica.',
      'Salvo disposición legal imperativa en contrario, Mándalo no será responsable por:',
      [
        'La calidad, cantidad o estado de los productos vendidos por los comercios.',
        'La preparación de alimentos.',
        'Errores en la información publicada por los comercios.',
        'Incumplimientos contractuales atribuibles al comercio.',
        'Incumplimientos atribuibles al repartidor.',
        'Retrasos ocasionados por condiciones climáticas, tráfico, accidentes, cierres viales, manifestaciones, restricciones de movilidad o fuerza mayor.',
        'Interrupciones de servicios de telecomunicaciones o fallas en redes de internet.',
        'Indisponibilidad de servicios tecnológicos de terceros.',
        'Interrupciones del suministro de energía eléctrica.',
        'Decisiones adoptadas por autoridades públicas.',
        'Hechos imprevisibles o irresistibles.',
      ],
      'En ningún caso esta cláusula podrá interpretarse como una exclusión o limitación de los derechos mínimos e irrenunciables reconocidos a los consumidores por la legislación colombiana, ni de la responsabilidad que corresponda a Mándalo por hechos que le sean directamente imputables.',
    ],
  },
  {
    heading: 'Artículo 63. Deber de Información',
    paragraphs: [
      'Mándalo procurará que la información publicada dentro de la plataforma sea clara, suficiente, verificable y fácilmente accesible para los usuarios.',
      'Cuando la información sea suministrada directamente por los comercios afiliados, estos serán responsables de su exactitud, actualización y legalidad.',
    ],
  },
  {
    heading: 'Artículo 64. Fuerza Mayor y Caso Fortuito',
    paragraphs: [
      'Mándalo no será responsable por el incumplimiento o retraso en la prestación de sus servicios cuando ello obedezca a eventos de fuerza mayor o caso fortuito, conforme a la legislación colombiana.',
      'Se consideran tales, entre otros, los desastres naturales, terremotos, inundaciones, incendios, conflictos armados, actos terroristas, disturbios, bloqueos de vías, huelgas generales, ataques informáticos masivos, fallas generalizadas de telecomunicaciones, decisiones de autoridades competentes y cualquier otro hecho imprevisible e irresistible.',
    ],
  },
  {
    heading: 'Artículo 65. Indemnidad',
    paragraphs: [
      'Los comercios afiliados y los repartidores independientes se obligan a mantener indemne a Mándalo frente a reclamaciones, demandas, investigaciones, sanciones, multas, perjuicios, condenas, costos y gastos que se originen como consecuencia del incumplimiento de sus obligaciones legales o contractuales o de actuaciones dolosas o culposas que les sean imputables.',
      'Esta obligación no será exigible a los clientes que ostenten la calidad de consumidores, sin perjuicio de la responsabilidad civil que les corresponda conforme al régimen general por los daños que causen dolosa o culposamente.',
      'La presente obligación no aplicará respecto de hechos atribuibles a Mándalo o cuando una disposición legal establezca expresamente lo contrario.',
    ],
  },
  { chapter: 'Capítulo XI — Propiedad Intelectual y Contenido' },
  {
    heading: 'Artículo 66. Titularidad de los Derechos de Propiedad Intelectual',
    paragraphs: [
      'Todos los derechos de propiedad intelectual e industrial relacionados con Mándalo son de propiedad exclusiva de su titular o de terceros que hayan autorizado legítimamente su utilización. Esta protección comprende, entre otros, la marca Mándalo, nombres comerciales, logotipos, signos distintivos, software, código fuente y objeto, aplicaciones móviles, sitio web, bases de datos, interfaces gráficas, diseños, fotografías, imágenes, ilustraciones, textos, videos, contenido audiovisual, documentación técnica, algoritmos, desarrollos tecnológicos y demás elementos que integran la plataforma.',
      'El acceso o utilización de la plataforma no implica cesión, licencia, transferencia ni autorización distinta de la expresamente prevista en estos Términos y Condiciones.',
    ],
  },
  {
    heading: 'Artículo 67. Licencia de Uso de la Plataforma',
    paragraphs: [
      'Mándalo concede al usuario una licencia de uso personal, limitada, no exclusiva, no transferible, no sublicenciable y revocable para acceder y utilizar la plataforma únicamente para los fines previstos en estos Términos y Condiciones.',
      'La licencia permanecerá vigente mientras el usuario mantenga una cuenta activa y cumpla las obligaciones aquí establecidas.',
      'El usuario no adquiere ningún derecho de propiedad intelectual sobre la plataforma ni sobre cualquiera de sus componentes.',
    ],
  },
  {
    heading: 'Artículo 68. Restricciones de Uso',
    paragraphs: [
      'Sin autorización previa y escrita de Mándalo, queda prohibido copiar total o parcialmente la plataforma; reproducir, distribuir o comercializar el software; modificar el código fuente; realizar ingeniería inversa, descompilar o desensamblar la aplicación, salvo en la medida permitida por normas imperativas; extraer bases de datos; utilizar robots, scrapers o sistemas automatizados para obtener información; utilizar la marca Mándalo sin autorización; registrar nombres de dominio similares que puedan generar confusión; eliminar avisos de propiedad intelectual; o utilizar cualquier contenido de la plataforma con fines comerciales no autorizados.',
      'El incumplimiento de estas prohibiciones dará lugar a las acciones civiles, administrativas y penales previstas en la legislación colombiana.',
    ],
  },
  {
    heading: 'Artículo 69. Contenido Generado por el Usuario',
    paragraphs: [
      'Los usuarios podrán publicar dentro de la plataforma calificaciones, comentarios, reseñas, fotografías y otros contenidos relacionados con los servicios recibidos.',
      'El usuario conserva la titularidad de los derechos sobre el contenido que publique y otorga a Mándalo una licencia gratuita, no exclusiva, mundial y por el tiempo de permanencia del contenido en la plataforma, para almacenar, reproducir, adaptar técnicamente y comunicar públicamente dicho contenido, con la finalidad exclusiva de operar y mejorar el servicio.',
      'El usuario garantiza que el contenido publicado es de su autoría o que cuenta con las autorizaciones necesarias, y que no infringe derechos de terceros.',
      'Notificación y retiro. Cualquier persona que considere que un contenido publicado en la plataforma infringe sus derechos de propiedad intelectual, su derecho a la imagen, su buen nombre o cualquier otro derecho, podrá notificarlo a mandaloputumayo@gmail.com identificando el contenido, el derecho presuntamente vulnerado y sus datos de contacto. Mándalo evaluará la solicitud y, cuando resulte procedente, retirará o restringirá el acceso al contenido, informando al usuario que lo publicó, quien podrá presentar sus aclaraciones.',
      'La licencia otorgada terminará cuando el usuario elimine el contenido o su cuenta, sin perjuicio de las copias de respaldo que deban conservarse por obligación legal.',
    ],
  },
  { chapter: 'Capítulo XII — Protección de Datos Personales' },
  {
    heading: 'Artículo 70. Tratamiento de Datos Personales',
    paragraphs: [
      'Mándalo tratará los datos personales de los usuarios conforme a la Constitución Política, la Ley 1581 de 2012, el Decreto 1377 de 2013, el Decreto 1074 de 2015 y las demás normas que regulen la materia.',
      'El tratamiento de la información se realizará de acuerdo con la Política de Privacidad y Tratamiento de Datos Personales de Mándalo, la cual hace parte integral de los presentes Términos y Condiciones y está disponible permanentemente en https://somosmandalo.com/politicas-de-privacidad y dentro de la aplicación.',
      'La aceptación de los presentes Términos y Condiciones no constituye por sí misma autorización para el tratamiento de datos personales. Dicha autorización se solicita de manera previa, expresa, informada e independiente durante el proceso de registro.',
    ],
  },
  {
    heading: 'Artículo 71. Finalidades del Tratamiento',
    paragraphs: [
      'Los datos personales podrán ser utilizados, entre otras, para crear y administrar cuentas de usuario, gestionar pedidos, facilitar la comunicación entre clientes, comercios y repartidores, procesar pagos, brindar soporte al usuario, atender reclamaciones, prevenir fraudes, mejorar la seguridad de la plataforma, realizar análisis estadísticos, cumplir obligaciones legales y enviar comunicaciones relacionadas con el servicio.',
      'El envío de comunicaciones comerciales o promocionales requiere autorización expresa e independiente del titular, la cual podrá revocarse en cualquier momento sin que ello afecte la prestación del servicio.',
      'Las finalidades específicas se desarrollan en la Política de Privacidad y Tratamiento de Datos Personales.',
    ],
  },
  {
    heading: 'Artículo 72. Derechos de los Titulares',
    paragraphs: [
      'Los titulares de los datos personales podrán conocer la información tratada, actualizarla, rectificarla, solicitar prueba de la autorización, solicitar la supresión de los datos en los casos legalmente permitidos, revocar la autorización cuando ello sea procedente, presentar consultas y reclamos y acudir ante la Superintendencia de Industria y Comercio cuando se cumplan los requisitos legales.',
      'El ejercicio de estos derechos se realizará conforme al procedimiento previsto en la Política de Privacidad y Tratamiento de Datos Personales, a través del correo mandaloputumayo@gmail.com.',
    ],
  },
  {
    heading: 'Artículo 73. Seguridad y Conservación de la Información',
    paragraphs: [
      'Mándalo implementará medidas técnicas, administrativas y organizacionales razonables destinadas a proteger la información personal contra pérdida, acceso no autorizado, alteración, destrucción, divulgación o tratamiento indebido. No obstante, ningún sistema informático ofrece seguridad absoluta.',
      'Los datos personales serán conservados durante el tiempo necesario para cumplir las finalidades que motivaron su tratamiento y las obligaciones legales aplicables, conforme a los plazos detallados en la Política de Privacidad y Tratamiento de Datos Personales. Una vez cumplidos dichos plazos, los datos serán eliminados de forma segura o anonimizados.',
    ],
  },
  { chapter: 'Capítulo XIII — Reclamaciones, Garantías y Reembolsos' },
  {
    heading: 'Artículo 74. Presentación de Reclamaciones',
    paragraphs: [
      'Los usuarios podrán presentar peticiones, quejas, reclamos, solicitudes o sugerencias mediante los canales oficiales habilitados por Mándalo: la sección de soporte dentro de la aplicación y el correo electrónico mandaloputumayo@gmail.com.',
      'Las reclamaciones deberán contener, cuando sea posible, la identificación del usuario, el número del pedido, la descripción de los hechos, la fecha de ocurrencia, las pruebas disponibles y la pretensión del reclamante.',
    ],
  },
  {
    heading: 'Artículo 75. Término de Respuesta',
    paragraphs: [
      'Mándalo dará respuesta a las peticiones, quejas y reclamos dentro de los quince (15) días hábiles siguientes a su recepción, conforme a lo previsto en el Estatuto del Consumidor.',
      'Cuando no sea posible atender la reclamación dentro de dicho término, se informará al interesado los motivos de la demora y la fecha en que se dará respuesta definitiva, la cual no podrá superar los términos máximos previstos en la ley.',
      'Cuando la reclamación corresponda exclusivamente al comercio o al repartidor, Mándalo la trasladará al responsable correspondiente e informará de ello al usuario, sin perjuicio del seguimiento que estime pertinente.',
      'La presentación de una reclamación ante Mándalo no limita ni condiciona el ejercicio de los derechos que la legislación colombiana reconoce a consumidores, comercios o repartidores, ni la facultad de acudir directamente ante la Superintendencia de Industria y Comercio.',
    ],
  },
  {
    heading: 'Artículo 76. Garantía Legal de los Productos',
    paragraphs: [
      'La garantía legal de los productos será asumida por el comercio que efectuó la venta, de conformidad con la Ley 1480 de 2011.',
      'Mándalo no asume la calidad de productor, fabricante o proveedor directo de los bienes comercializados mediante la plataforma, salvo disposición legal expresa en contrario, y colaborará con el consumidor en la canalización de la reclamación ante el comercio responsable.',
    ],
  },
  {
    heading: 'Artículo 77. Productos Alimenticios',
    paragraphs: [
      'Tratándose de alimentos preparados o productos perecederos, las reclamaciones relacionadas con calidad, preparación, ingredientes, contaminación, inocuidad, fechas de vencimiento o condiciones sanitarias serán de responsabilidad del comercio, sin perjuicio de la colaboración que preste Mándalo para la atención del caso.',
    ],
  },
  {
    heading: 'Artículo 78. Errores en el Pedido y Productos Dañados',
    paragraphs: [
      'Cuando el cliente reciba un producto distinto al solicitado, un pedido incompleto o un pedido correspondiente a otro usuario, deberá informar la situación a través de los canales oficiales dentro de un plazo razonable, aportando la evidencia disponible.',
      'Mándalo coordinará con el comercio y, cuando corresponda, con el repartidor, la revisión del caso y la adopción de las medidas procedentes.',
      'Cuando existan indicios razonables de que el deterioro del producto ocurrió durante el transporte y sea atribuible al repartidor, Mándalo podrá coordinar el análisis del caso y adoptar las medidas previstas en sus políticas internas, sin perjuicio de las responsabilidades legales que correspondan.',
    ],
  },
  {
    heading: 'Artículo 79. Reembolsos',
    paragraphs: [
      'Los reembolsos procederán cuando exista una obligación legal, cuando el comercio los autorice, cuando la responsabilidad corresponda a Mándalo, cuando así lo determinen las políticas vigentes de la plataforma o cuando exista una decisión emitida por autoridad competente.',
      'Los reembolsos se efectuarán utilizando, cuando resulte posible, el mismo medio de pago empleado por el cliente, dentro de los términos previstos por la legislación aplicable y por los tiempos de procesamiento de la entidad financiera correspondiente.',
    ],
  },
  {
    heading: 'Artículo 80. Reversión de Pagos',
    paragraphs: [
      'Cuando el pedido haya sido pagado mediante mecanismos electrónicos, el cliente podrá solicitar la reversión del pago en los casos expresamente previstos en la legislación colombiana, especialmente en el artículo 51 del Estatuto del Consumidor y las normas que lo reglamentan.',
      'La solicitud deberá cumplir los requisitos y procedimientos establecidos por la ley y presentarse dentro de los términos legales.',
    ],
  },
  {
    heading: 'Artículo 81. Derecho de Retracto',
    paragraphs: [
      'Cuando resulte aplicable conforme al artículo 47 de la Ley 1480 de 2011, el consumidor podrá ejercer el derecho de retracto dentro de los cinco (5) días hábiles siguientes a la entrega del bien, debiendo devolverlo en las mismas condiciones en que lo recibió. En tal caso, se resolverá el contrato y se reintegrará el dinero pagado.',
      'El derecho de retracto no será aplicable, entre otros supuestos legalmente previstos, respecto de bienes perecederos, alimentos preparados, productos confeccionados conforme a especificaciones del consumidor o claramente personalizados, y bienes de uso personal que por razones de higiene no puedan ser devueltos.',
      'Dada la naturaleza de los productos habitualmente comercializados mediante la plataforma, el derecho de retracto tendrá aplicación limitada; ello no afecta los derechos de garantía ni de reversión del pago.',
    ],
  },
  {
    heading: 'Artículo 82. Evidencia e Investigación de las Reclamaciones',
    paragraphs: [
      'Con el fin de verificar los hechos objeto de reclamación, Mándalo podrá solicitar fotografías, videos, comprobantes, registros electrónicos, comunicaciones o cualquier otro medio de prueba pertinente y legalmente admisible.',
      'Mándalo podrá recopilar y analizar la información necesaria para determinar el origen de la reclamación, incluyendo registros electrónicos, historial del pedido, registros de geolocalización asociados al pedido, comunicaciones realizadas a través de la plataforma y demás evidencias legalmente obtenidas.',
      'La investigación se desarrollará respetando el debido proceso, la confidencialidad de la información y la normativa sobre protección de datos personales.',
      'La negativa injustificada a suministrar la información razonablemente necesaria podrá ser tenida en cuenta al momento de evaluar la reclamación, sin perjuicio de los derechos que la ley reconoce al usuario.',
    ],
  },
  {
    heading: 'Artículo 83. Solución de las Reclamaciones',
    paragraphs: [
      'Concluida la revisión de la reclamación, Mándalo comunicará al usuario la decisión adoptada de manera motivada y, cuando corresponda, las medidas implementadas.',
      'Dependiendo de las circunstancias del caso, podrán adoptarse, entre otras, las siguientes medidas: reposición del pedido, devolución parcial o total de valores, otorgamiento de créditos o cupones promocionales cuando el usuario los acepte, traslado de la reclamación al comercio o al repartidor responsable, o rechazo motivado de la reclamación cuando no existan fundamentos suficientes.',
      'Las soluciones ofrecidas por Mándalo no limitarán los derechos que la legislación colombiana reconoce a los consumidores.',
    ],
  },
  {
    heading: 'Artículo 84. Conservación de Evidencias',
    paragraphs: [
      'Mándalo podrá conservar la información relacionada con reclamaciones durante el tiempo necesario para atender recursos, cumplir obligaciones legales, responder requerimientos de autoridades, prevenir fraudes y ejercer la defensa de sus derechos.',
      'La conservación de esta información se realizará conforme a la legislación sobre protección de datos personales y a los plazos establecidos en la Política de Privacidad.',
    ],
  },
  {
    heading: 'Artículo 85. Reclamaciones Reiteradas o Abusivas',
    paragraphs: [
      'Cuando existan indicios objetivos de que un usuario presenta reclamaciones falsas, temerarias, fraudulentas o manifiestamente abusivas con el propósito de obtener beneficios indebidos, Mándalo podrá realizar verificaciones adicionales, solicitar información complementaria, limitar temporalmente determinados beneficios, suspender la cuenta mientras se adelanta la investigación o adoptar las demás medidas previstas en estos Términos y Condiciones.',
      'La adopción de estas medidas respetará el debido proceso y no impedirá el ejercicio de los derechos reconocidos por la legislación colombiana.',
    ],
  },
  {
    heading: 'Artículo 86. Colaboración y Limitación de las Medidas Compensatorias',
    paragraphs: [
      'Los clientes, comercios y repartidores se comprometen a colaborar de buena fe en la atención de reclamaciones, suministrando la información y documentación razonablemente necesaria para esclarecer los hechos.',
      'Las medidas de compensación, créditos promocionales o beneficios comerciales que Mándalo conceda de manera voluntaria para resolver una reclamación no constituirán reconocimiento de responsabilidad jurídica ni precedente obligatorio, ni modificarán la distribución de responsabilidades prevista en estos Términos y Condiciones o en la legislación colombiana.',
    ],
  },
  { chapter: 'Capítulo XIV — Promociones, Cupones y Referidos' },
  {
    heading: 'Artículo 87. Promociones y sus Condiciones',
    paragraphs: [
      'Mándalo podrá ofrecer promociones, campañas comerciales, descuentos, incentivos o beneficios temporales dirigidos a clientes, comercios o repartidores.',
      'Las promociones tendrán carácter temporal, podrán estar sujetas a disponibilidad y se regirán por las condiciones específicas publicadas para cada campaña, las cuales podrán establecer vigencia, cobertura geográfica, comercios participantes, monto mínimo de compra, número máximo de usos, horarios de aplicación, restricciones por usuario, categorías de productos y demás condiciones particulares.',
      'En caso de discrepancia, prevalecerán las condiciones específicas de la promoción sobre las reglas generales contenidas en estos Términos y Condiciones, siempre que resulten más favorables al usuario.',
    ],
  },
  {
    heading: 'Artículo 88. Cupones Promocionales',
    paragraphs: [
      'Los cupones constituyen beneficios personales, gratuitos, intransferibles, revocables y de uso limitado. Salvo indicación expresa, no podrán venderse, intercambiarse, transferirse, convertirse en dinero, acumularse con otras promociones ni utilizarse después de su vencimiento.',
      'Mándalo podrá invalidar cualquier cupón obtenido mediante fraude o incumplimiento de estos Términos y Condiciones.',
    ],
  },
  {
    heading: 'Artículo 89. Programa de Referidos',
    paragraphs: [
      'Cuando Mándalo implemente programas de referidos, los incentivos únicamente serán otorgados cuando se cumplan todas las condiciones publicadas para la campaña correspondiente.',
      'La plataforma podrá verificar la autenticidad de las cuentas registradas y rechazar beneficios obtenidos mediante fraude, simulación, creación de cuentas múltiples o cualquier otra práctica contraria a la buena fe.',
    ],
  },
  {
    heading: 'Artículo 90. Modificación o Terminación de las Promociones',
    paragraphs: [
      'Mándalo podrá modificar, suspender o finalizar cualquier promoción por razones comerciales, operativas, técnicas o legales.',
      'Las modificaciones no afectarán los beneficios válidamente adquiridos antes de su entrada en vigencia, salvo cuando exista fraude o una disposición legal en contrario.',
    ],
  },
  { chapter: 'Capítulo XV — Propinas' },
  {
    heading: 'Artículo 91. Naturaleza y Destinación de la Propina',
    paragraphs: [
      'La propina constituye un reconocimiento voluntario que el cliente puede otorgar al repartidor o, cuando la plataforma lo permita, al comercio, como muestra de satisfacción por el servicio recibido.',
      'La propina no constituye un pago obligatorio, ni forma parte del precio de los productos, de la tarifa de servicio de Mándalo o del valor del servicio de entrega. Ningún usuario podrá ser obligado, presionado o condicionado a otorgar propinas.',
      'Las propinas otorgadas al repartidor corresponderán íntegramente a este. Cuando la plataforma habilite propinas para los comercios, estas serán entregadas conforme a las condiciones informadas al usuario al momento de efectuar el pago.',
      'Mándalo no utilizará las propinas para cubrir tarifas, comisiones, costos operativos o cualquier obligación propia.',
    ],
  },
  {
    heading: 'Artículo 92. Uso Indebido de las Propinas',
    paragraphs: [
      'Se prohíbe a comercios, repartidores y usuarios exigir propinas, condicionar la prestación del servicio a su pago, alterar su valor, apropiarse de propinas destinadas a terceros o utilizar mecanismos fraudulentos para obtenerlas.',
      'El incumplimiento de esta disposición podrá dar lugar a las medidas previstas en estos Términos y Condiciones.',
    ],
  },
  { chapter: 'Capítulo XVI — Productos con Restricciones Legales' },
  {
    heading: 'Artículo 93. Productos Sujetos a Restricciones',
    paragraphs: [
      'La comercialización de determinados productos mediante la plataforma estará sujeta a la legislación colombiana y a las políticas internas de Mándalo.',
      'La plataforma podrá restringir, suspender o prohibir la oferta de determinados productos cuando ello resulte necesario para cumplir la ley, proteger a los usuarios o atender requerimientos de las autoridades competentes.',
    ],
  },
  {
    heading: 'Artículo 94. Bebidas Alcohólicas',
    paragraphs: [
      'La venta y entrega de bebidas alcohólicas está permitida únicamente a personas mayores de dieciocho (18) años, conforme a la legislación colombiana y a las disposiciones municipales aplicables.',
      'El comercio y el repartidor deberán verificar, mediante la exhibición del documento de identidad, que el destinatario sea mayor de edad al momento de la entrega.',
      'Si existen dudas razonables sobre la identidad o la mayoría de edad del destinatario, o si este se niega a acreditarla, la entrega será rechazada. En tal caso el pedido se dará por finalizado y podrán causarse los costos operativos efectivamente incurridos.',
      'Igualmente se rechazará la entrega cuando el destinatario se encuentre en evidente estado de embriaguez o cuando la entrega contravenga restricciones horarias establecidas por la autoridad local.',
    ],
  },
  {
    heading: 'Artículo 95. Medicamentos y Productos Regulados',
    paragraphs: [
      'Los medicamentos y demás productos sujetos a regulación especial únicamente podrán comercializarse cuando su venta y entrega estén permitidas por la legislación colombiana.',
      'El comercio será exclusivamente responsable del cumplimiento de las obligaciones sanitarias, regulatorias y administrativas aplicables, incluida la exigencia de fórmula médica cuando corresponda.',
      'Mándalo no presta servicios farmacéuticos, no dispensa ni formula medicamentos y no ofrece asesoría de salud de ningún tipo.',
    ],
  },
  {
    heading: 'Artículo 96. Productos Prohibidos',
    paragraphs: [
      'Se encuentra prohibida la publicación, comercialización o entrega mediante la plataforma de productos cuya venta esté prohibida por la legislación colombiana, incluyendo sustancias psicoactivas ilegales, armas, municiones, explosivos, material que constituya delito y cualquier bien de comercio restringido sin la autorización correspondiente.',
      'Mándalo podrá retirar inmediatamente dichos productos, suspender las cuentas involucradas y poner los hechos en conocimiento de las autoridades competentes cuando resulte procedente.',
    ],
  },
  { chapter: 'Capítulo XVII — Calificaciones, Comentarios y Reseñas' },
  {
    heading: 'Artículo 97. Sistema de Calificaciones',
    paragraphs: [
      'La plataforma podrá permitir que los usuarios califiquen la experiencia relacionada con comercios, repartidores y los servicios de intermediación tecnológica prestados por Mándalo.',
      'Las calificaciones tendrán como finalidad contribuir al mejoramiento continuo de la calidad del servicio y podrán ser utilizadas como criterio para adoptar medidas de calidad, soporte y control.',
    ],
  },
  {
    heading: 'Artículo 98. Comentarios y Reseñas',
    paragraphs: [
      'Los comentarios publicados deberán corresponder a experiencias reales y expresarse de manera respetuosa. No podrán contener información falsa, expresiones injuriosas o calumniosas, lenguaje discriminatorio, amenazas, datos personales de terceros, publicidad no autorizada, contenido ilícito ni cualquier información que vulnere derechos de terceros.',
      'Cada usuario será responsable del contenido que publique, conforme a lo previsto en el Artículo 69.',
    ],
  },
  {
    heading: 'Artículo 99. Moderación del Contenido',
    paragraphs: [
      'Mándalo podrá ocultar, restringir o eliminar comentarios cuando existan razones objetivas para considerar que infringen la legislación colombiana, vulneran derechos de terceros, contienen información manifiestamente falsa, constituyen fraude, fueron generados mediante sistemas automatizados o incumplen estos Términos y Condiciones.',
      'La moderación se realizará procurando preservar la autenticidad de las opiniones de los usuarios y el derecho a la libertad de expresión dentro de los límites previstos por la ley. El usuario afectado será informado de la medida y podrá solicitar su revisión.',
    ],
  },
  { chapter: 'Capítulo XVIII — Prevención del Fraude y Servicios de Terceros' },
  {
    heading: 'Artículo 100. Verificación de Información y Medidas Preventivas',
    paragraphs: [
      'Mándalo podrá verificar la información suministrada por los usuarios cuando resulte razonablemente necesario para prevenir fraudes, proteger la seguridad de la plataforma, cumplir obligaciones legales, atender requerimientos de autoridades competentes o proteger los derechos de otros usuarios.',
      'Cuando existan indicios objetivos de fraude, suplantación de identidad o actividades irregulares, Mándalo podrá solicitar documentos o información adicional para verificar la identidad del usuario. La negativa injustificada a suministrar dicha información podrá dar lugar a la suspensión temporal o definitiva de la cuenta.',
      'Para proteger la seguridad de la plataforma y de sus usuarios, Mándalo podrá limitar determinadas operaciones, suspender temporalmente cuentas, bloquear transacciones, cancelar pedidos, restringir promociones, solicitar verificaciones adicionales y reportar hechos a las autoridades competentes cuando exista obligación legal o indicios razonables de actividades ilícitas.',
      'Las medidas deberán ser proporcionales a los riesgos identificados, respetar la legislación sobre protección de datos personales y permitir al usuario presentar las aclaraciones correspondientes.',
    ],
  },
  {
    heading: 'Artículo 101. Integraciones Tecnológicas y Servicios de Terceros',
    paragraphs: [
      'Para el funcionamiento de la plataforma, Mándalo utiliza servicios proporcionados por terceros, incluyendo servicios de infraestructura de servidores, servicios de mapas y cálculo de rutas, servicios de autenticación, servicios de envío de notificaciones y servicios de correo electrónico. El detalle de estos proveedores se encuentra en la Política de Privacidad y Tratamiento de Datos Personales.',
      'Cada proveedor conservará la responsabilidad que le corresponda respecto de los servicios bajo su control.',
      'Mándalo no responderá por interrupciones, fallas o limitaciones originadas exclusivamente en servicios prestados por terceros independientes, siempre que haya actuado con la diligencia exigida por la legislación colombiana. Lo anterior no limita la responsabilidad que legalmente pueda corresponder a Mándalo cuando el daño sea consecuencia de un incumplimiento propio.',
    ],
  },
  { chapter: 'Capítulo XIX — Protección al Consumidor' },
  {
    heading: 'Artículo 102. Derechos del Consumidor',
    paragraphs: [
      'Mándalo reconoce y respetará los derechos mínimos e irrenunciables previstos en el Estatuto del Consumidor y demás normas aplicables. En consecuencia, los clientes conservarán, entre otros, los derechos a:',
      [
        'Recibir información clara, suficiente, veraz, verificable, comprensible y oportuna.',
        'Recibir productos en condiciones de calidad e idoneidad cuando corresponda al proveedor.',
        'Presentar peticiones, quejas, reclamos y sugerencias, y obtener respuesta dentro de los términos legales.',
        'Ejercer los derechos de garantía cuando resulten procedentes.',
        'Solicitar la reversión del pago en los casos previstos por la ley.',
        'Ejercer el derecho de retracto cuando resulte aplicable.',
        'Acceder a mecanismos de protección administrativa y judicial.',
        'No ser objeto de cláusulas abusivas.',
      ],
    ],
  },
  {
    heading: 'Artículo 103. Información al Consumidor y Colaboración',
    paragraphs: [
      'Mándalo procurará que la información relevante sobre el funcionamiento de la plataforma sea fácilmente accesible para los usuarios.',
      'Los comercios serán responsables de suministrar información suficiente respecto de los productos que ofrecen, incluyendo precios, características, restricciones y condiciones especiales de venta.',
      'Cuando una reclamación involucre simultáneamente a Mándalo, al comercio y al repartidor, la plataforma facilitará los canales de comunicación y coordinación necesarios para procurar una atención eficiente del caso. Lo anterior no implica el reconocimiento automático de responsabilidad por parte de Mándalo.',
    ],
  },
  { chapter: 'Capítulo XX — Ley Aplicable y Solución de Controversias' },
  {
    heading: 'Artículo 104. Legislación Aplicable',
    paragraphs: [
      'Los presentes Términos y Condiciones se regirán e interpretarán de conformidad con la Constitución Política de Colombia, el Código Civil, el Código de Comercio, la Ley 527 de 1999, la Ley 1480 de 2011, la Ley 1581 de 2012, el Decreto 1074 de 2015 y las demás normas que resulten aplicables.',
    ],
  },
  {
    heading: 'Artículo 105. Atención de Controversias',
    paragraphs: [
      'Antes de acudir a instancias administrativas o judiciales, las partes procurarán resolver de buena fe cualquier diferencia mediante los mecanismos de atención al usuario habilitados por Mándalo.',
      'Este intento de arreglo directo no constituye requisito de procedibilidad ni limita el derecho del consumidor a acudir directamente ante las autoridades competentes.',
    ],
  },
  {
    heading: 'Artículo 106. Jurisdicción Competente',
    paragraphs: [
      'Toda controversia que no pueda resolverse de manera directa entre las partes será conocida por las autoridades competentes de la República de Colombia, conforme a las reglas de competencia establecidas por la legislación vigente.',
      'Nada de lo dispuesto en este artículo limita el derecho de los consumidores a acudir ante la Superintendencia de Industria y Comercio, los jueces competentes o cualquier otra autoridad facultada por la ley, ni el derecho a demandar en el domicilio del consumidor cuando la ley así lo permita.',
    ],
  },
  { chapter: 'Capítulo XXI — Disposiciones Finales' },
  {
    heading: 'Artículo 107. Aceptación Electrónica y Registros',
    paragraphs: [
      'La aceptación de los presentes Términos y Condiciones mediante la selección de la casilla correspondiente durante el registro constituirá una manifestación válida de voluntad y producirá los mismos efectos jurídicos que una firma manuscrita, de conformidad con la Ley 527 de 1999.',
      'Mándalo podrá generar, almacenar y conservar registros electrónicos relacionados con la aceptación de los presentes Términos y Condiciones, la creación de cuentas, las autenticaciones, los pedidos, los pagos, las comunicaciones, la geolocalización asociada a los servicios, el historial de actividad y los registros de seguridad.',
      'Estos registros podrán utilizarse como medio de prueba conforme a la legislación colombiana, sin perjuicio de los demás medios probatorios previstos en la ley.',
    ],
  },
  {
    heading: 'Artículo 108. Comunicaciones Electrónicas',
    paragraphs: [
      'El usuario autoriza a Mándalo para remitir comunicaciones relacionadas con la prestación del servicio mediante notificaciones dentro de la aplicación, correo electrónico, servicios de mensajería instantánea habilitados por la plataforma y llamadas telefónicas cuando resulte necesario.',
      'Las comunicaciones relacionadas con aspectos operativos, de seguridad, actualizaciones de la plataforma, cambios en los presentes Términos y Condiciones o cumplimiento de obligaciones legales no tendrán carácter publicitario y no requieren autorización adicional.',
      'Las comunicaciones de naturaleza comercial o promocional requieren autorización expresa e independiente, la cual podrá revocarse en cualquier momento desde la configuración de la aplicación o mediante solicitud a mandaloputumayo@gmail.com.',
    ],
  },
  {
    heading: 'Artículo 109. Cesión',
    paragraphs: [
      'Mándalo podrá ceder total o parcialmente los derechos y obligaciones derivados de los presentes Términos y Condiciones a la sociedad comercial que el titular llegue a constituir para continuar la operación de la plataforma, así como a sociedades vinculadas, adquirentes de activos, sucesores o terceros que continúen dicha operación, siempre que dicha cesión no implique una disminución de los derechos reconocidos a los usuarios por la legislación colombiana. La cesión será informada previamente a los usuarios mediante los canales oficiales.',
    ],
  },
  {
    heading: 'Artículo 110. Integridad Contractual',
    paragraphs: [
      'Los presentes Términos y Condiciones, junto con la Política de Privacidad y Tratamiento de Datos Personales, el Anexo I y las condiciones particulares que eventualmente resulten aplicables, constituyen el acuerdo integral entre Mándalo y los usuarios respecto de la utilización de la plataforma tecnológica.',
      'En caso de contradicción entre estos Términos y Condiciones y una condición particular expresamente aceptada por el usuario para un servicio específico, prevalecerá esta última únicamente respecto de dicho servicio y siempre que resulte más favorable al usuario.',
    ],
  },
  {
    heading: 'Artículo 111. No Renuncia',
    paragraphs: [
      'La falta de ejercicio o el retraso por parte de Mándalo en el ejercicio de cualquier derecho previsto en estos Términos y Condiciones no constituirá renuncia al mismo ni impedirá su ejercicio posterior.',
      'La renuncia únicamente será válida cuando conste por escrito y sea suscrita por un representante autorizado de Mándalo.',
    ],
  },
  {
    heading: 'Artículo 112. Independencia de las Cláusulas',
    paragraphs: [
      'Si cualquier disposición de estos Términos y Condiciones fuese declarada nula, ineficaz, inexequible o inaplicable por autoridad competente, dicha circunstancia afectará únicamente la disposición correspondiente y no comprometerá la validez de las demás cláusulas, las cuales continuarán produciendo plenos efectos jurídicos en la medida permitida por la legislación colombiana.',
    ],
  },
  {
    heading: 'Artículo 113. Entrada en Vigencia',
    paragraphs: [
      'Los presentes Términos y Condiciones entrarán en vigencia en la fecha indicada en la portada del documento y permanecerán vigentes hasta que sean modificados o sustituidos por una nueva versión publicada por Mándalo.',
      'Las versiones anteriores permanecerán archivadas para efectos de control documental y consulta histórica.',
    ],
  },
  { chapter: 'Anexo I — Tarifas del Servicio de Entrega' },
  {
    heading: 'Fórmula del valor del servicio de entrega',
    paragraphs: [
      'El presente Anexo hace parte integral de los Términos y Condiciones y detalla la forma de cálculo del valor del servicio de entrega a que se refiere el Artículo 39.',
      {
        table: {
          headers: ['Concepto', 'Valor', 'Observaciones'],
          rows: [
            ['Tarifa base (hasta 4 km)', '$6.000', 'Aplica a todo pedido dentro del radio base'],
            ['Valor por kilómetro adicional', '$3.000', 'Calculado sobre la distancia de la ruta'],
            ['Tarifa mínima', '$10.000', 'Valor mínimo por servicio'],
            ['Recargo nocturno', '$4.500', 'Aplicable entre 11:00 pm y 5:30 am'],
            ['Recargo por condiciones climáticas', '$2.500', 'Informado antes de confirmar el pedido'],
            ['Recargo por alta demanda', '$2.500', 'Informado antes de confirmar el pedido'],
            ['Segundo intento de entrega', '$6.000', 'Requiere aceptación previa del cliente (Art. 31)'],
            ['Tarifa de Servicio Mándalo', '7 % del valor de los productos', 'Conforme al Artículo 38'],
          ],
        },
      },
      'El valor total del servicio de entrega se informa siempre de manera desagregada y previa a la confirmación del pedido. Ningún recargo podrá cobrarse sin haber sido informado y aceptado por el cliente con anterioridad.',
      'Los valores anteriores podrán actualizarse conforme al procedimiento previsto en el Artículo 6 y no afectarán los pedidos ya confirmados.',
    ],
  },
  {
    heading: 'Aceptación de los Términos y Condiciones',
    paragraphs: [
      'Al seleccionar la casilla de aceptación durante el proceso de registro en la plataforma Mándalo, el usuario declara que:',
      [
        'Es mayor de dieciocho (18) años y cuenta con capacidad legal para contratar.',
        'Ha tenido acceso al texto íntegro de los presentes Términos y Condiciones.',
        'Comprende su contenido y alcance jurídico.',
        'Acepta libre y voluntariamente todas sus disposiciones.',
        'Se obliga a cumplirlas durante todo el tiempo que utilice la plataforma.',
        'Reconoce que la aceptación electrónica produce plenos efectos jurídicos conforme a la legislación colombiana.',
      ],
      'La autorización para el tratamiento de datos personales se solicita de manera separada e independiente, conforme a la Política de Privacidad y Tratamiento de Datos Personales.',
      'La utilización de la plataforma sin aceptar estos Términos y Condiciones no estará permitida.',
    ],
  },
];

export { meta, blocks };
