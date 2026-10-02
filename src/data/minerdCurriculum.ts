import {
  FundamentalCompetency,
  SubjectArea,
  CurricularTopicSuggestion,
  DailyPlan,
  WeeklyPlan,
  LearningUnit,
  SchoolConfig,
  Teacher,
  Coordinator,
  PsychologyCaseReport,
  Student
} from '../types/minerd';

export const DEFAULT_SCHOOL_CONFIG: SchoolConfig = {
  schoolName: 'Escuela Dr. José Francisco Peña Gómez',
  schoolCode: '14668',
  regional: 'Regional 12 (Higüey)',
  district: 'Distrito Educativo 12-01 (Higüey)',
  schoolYear: '2024-2025',
  tanda: 'Ambas Tandas (Doble Tanda)',
  teacherName: '',
  teacherPhone: '',
  coordinatorName: '',
  coordinatorPhone: '',
  principalName: 'Licdo. Arnold Javier Sanchez (Director)',
  principalPhone: '',
  orientatorName: '',
  orientatorPhone: '',
  activeRole: 'coordinator',
  whatsAppConfig: {
    autoSendOnApproval: true,
    autoSendOnReturn: true,
    approvedTemplate: '✅ *NOTIFICACIÓN DE PLANIFICACIÓN APROBADA*\n\nEstimado/a *{{teacherName}}*,\n\nLe informamos que su *{{planType}}* para el curso *{{grade}}* ha sido *APROBADA* formalmente por la Coordinación Pedagógica de la {{schoolName}}.\n\nFecha/Período: {{dateOrWeek}}\n\n¡Felicitaciones por su labor pedagógica!',
    returnedTemplate: '⚠️ *REVISIÓN PEDAGÓGICA - AJUSTES REQUERIDOS*\n\nEstimado/a *{{teacherName}}*,\n\nSe requiere realizar algunos ajustes a su *{{planType}}* ({{grade}} - {{area}}):\n\n👉 *Observaciones:* {{feedback}}\n\nFavor ingresar al sistema para aplicar las correcciones.',
    reminderTemplate: '⏰ *RECORDATORIO DE ENTREGA*\n\nEstimado/a *{{teacherName}}*,\n\nLe recordamos la entrega de su planificación para el período {{dateOrWeek}} en la {{schoolName}}.',
    psychologyCitationTemplate: '🏛️ *{{schoolName}}*\n📋 *DEPARTAMENTO DE ORIENTACIÓN Y PSICOLOGÍA*\n\nEstimado/a padre/madre/tutor de *{{studentName}}*:\n\nLe invitamos cordialmente a un encuentro de acompañamiento escolar para tratar asuntos relacionados con el progreso de su hijo/a.\n\n📅 *Fecha de Cita:* {{citationDate}}\n⏰ *Hora:* {{citationTime}}\n📍 *Lugar:* Depto. de Orientación y Psicología\n\nEsperamos contar con su puntual asistencia.'
  }
};

export const DEFAULT_STUDENTS: Student[] = [];

export const INITIAL_DEMO_COORDINATORS: Coordinator[] = [];

export const INITIAL_DEMO_PSYCHOLOGY_REPORTS: PsychologyCaseReport[] = [];

export const INITIAL_DEMO_TEACHERS: Teacher[] = [];

export const FUNDAMENTAL_COMPETENCIES: FundamentalCompetency[] = [
  {
    key: 'etica_ciudadana',
    name: 'Ética y Ciudadana',
    shortName: 'Ética y Ciudadana',
    description: 'Se relaciona con los demás con respeto, justicia y equidad en los ámbitos personal, social e institucional, promoviendo la convivencia democrática y la cultura de paz.'
  },
  {
    key: 'comunicativa',
    name: 'Comunicativa',
    shortName: 'Comunicativa',
    description: 'Comprende y expresa ideas, sentimientos, valores y hechos en diferentes situaciones y contextos, empleando diversos lenguajes y códigos.'
  },
  {
    key: 'pensamiento_logico',
    name: 'Pensamiento Lógico, Creativo y Crítico',
    shortName: 'Pensamiento Lógico y Crítico',
    description: 'Procesa ideas, hechos y situaciones con rigor lógico, creatividad y sentido crítico para generar conocimientos y transformar realidades.'
  },
  {
    key: 'resolucion_problemas',
    name: 'Resolución de Problemas',
    shortName: 'Resolución de Problemas',
    description: 'Reconoce y analiza situaciones problemáticas del entorno, formula hipótesis, diseña planes de acción y aplica estrategias efectivas para su solución.'
  },
  {
    key: 'cientifica_tecnologica',
    name: 'Científica y Tecnológica',
    shortName: 'Científica y Tecnológica',
    description: 'Investiga y explica fenómenos naturales y sociales aplicando el método científico y las tecnologías de la información con responsabilidad.'
  },
  {
    key: 'ambiental_salud',
    name: 'Ambiental y de la Salud',
    shortName: 'Ambiental y de la Salud',
    description: 'Valora y cuida la salud integral propia y colectiva, y promueve el uso sostenible de los recursos naturales y la preservación del medio ambiente.'
  },
  {
    key: 'desarrollo_personal',
    name: 'Desarrollo Personal y Espiritual',
    shortName: 'Desarrollo Personal y Espiritual',
    description: 'Desarrolla una autoimagen equilibrada y un sentido de trascendencia, reconociendo su dignidad humana y cultivando valores éticos y espirituales.'
  }
];

export const TRANSVERSAL_AXES = [
  'Educación para la Salud y el Bienestar Integral',
  'Medio Ambiente, Cambio Climático y Sostenibilidad',
  'Ciudadanía, Derechos Humanos y Cultura de Paz',
  'Educación Vial y Movilidad Segura',
  'Equidad de Género e Inclusión Social',
  'Identidad, Cultura Dominicana y Patrimonio',
  'Ciencia, Tecnología y Transformación Digital'
];

export const BLOOM_MINERD_VERBS = [
  { level: 'Nivel I: Conocimiento y Reconocimiento', verbs: ['Identificar', 'Reconocer', 'Nombrar', 'Enumerar', 'Señalar', 'Definir', 'Mencionar', 'Localizar'] },
  { level: 'Nivel II: Comprensión e Interpretación', verbs: ['Explicar', 'Interpretar', 'Resumir', 'Clasificar', 'Distinguir', 'Ejemplificar', 'Describir', 'Parafrasear'] },
  { level: 'Nivel III: Aplicación y Ejecución', verbs: ['Aplicar', 'Resolver', 'Construir', 'Demostrar', 'Calcular', 'Redactar', 'Utilizar', 'Ejecutar', 'Representar'] },
  { level: 'Nivel IV: Análisis y Razonamiento', verbs: ['Analizar', 'Comparar', 'Contrastar', 'Diferenciar', 'Relacionar', 'Inferir', 'Descomponer', 'Examinar'] },
  { level: 'Nivel V: Evaluación y Juicio Crítico', verbs: ['Evaluar', 'Argumentar', 'Justificar', 'Valorar', 'Criticar', 'Emitir juicio', 'Defender', 'Verificar'] },
  { level: 'Nivel VI: Creación y Producción', verbs: ['Diseñar', 'Elaborar', 'Proponer', 'Formular', 'Crear', 'Producir', 'Planificar', 'Idear', 'Construir'] }
];

export const METACOGNITION_QUESTIONS = [
  '¿Qué aprendimos en el día de hoy sobre este tema?',
  '¿Cómo lo aprendimos y qué actividades nos ayudaron más?',
  '¿Qué fue lo que más se te dificultó y cómo lograste superarlo?',
  '¿Para qué nos sirve este conocimiento en la vida diaria y en nuestra comunidad?',
  '¿Cómo podemos aplicar lo aprendido para resolver un problema de nuestro entorno?',
  '¿Qué preguntas o dudas me quedaron sobre el tema?'
];

export const CURRICULAR_DATABASE: Record<SubjectArea, CurricularTopicSuggestion[]> = {
  'Lengua Española': [
    {
      name: 'La Noticia (Estructura y Redacción)',
      suggestedIntention: 'Analizar la estructura de una noticia periodística (titular, entrada, cuerpo y foto) para redactar una noticia comunitaria sobre el cuidado del agua.',
      specificCompetencies: [
        'Comprensión escrita: Comprende noticias que lee en soporte físico o digital para mantenerse informado sobre acontecimientos de interés local y nacional.',
        'Producción escrita: Produce noticias sobre sucesos de la comunidad educativa, respetando la estructura textual, la concordancia y la ortografía.'
      ],
      conceptual: [
        'La noticia: concepto, función y características.',
        'Estructura de la noticia: titular, entrada (lead), cuerpo, foto y pie de foto.',
        'Preguntas clave del periodismo: ¿Qué?, ¿Quién?, ¿Cuándo?, ¿Dónde?, ¿Cómo? y ¿Por qué?'
      ],
      procedural: [
        'Identificación de las partes de una noticia a partir de textos periodísticos dominicanos (Listín Diario, Periódico Hoy).',
        'Redacción del borrador de una noticia respondiendo a las preguntas informativas.',
        'Revisión y corrección ortográfica y sintáctica del texto producido.'
      ],
      attitudinal: [
        'Interés por mantenerse informado de los acontecimientos de su país y comunidad.',
        'Valoración de la veracidad y objetividad en la comunicación informativa.',
        'Respeto por las opiniones ajenas y el trabajo en equipo.'
      ],
      indicators: [
        'Identifica con precisión las seis preguntas básicas en noticias impresas y digitales.',
        'Redacta noticias breves cumpliendo con la estructura canónica y normas de concordancia.',
        'Utiliza signos de puntuación y mayúsculas de manera adecuada en sus producciones escritas.'
      ],
      startSuggestions: [
        'Lectura comentada de un titular de prensa reciente de un periódico nacional.',
        'Lluvia de ideas sobre qué hechos de la escuela merecen convertirse en noticia hoy.',
        'Preguntas exploratorias: ¿Por qué es importante estar bien informados?'
      ],
      devSuggestions: [
        'Análisis en parejas de un recorte periodístico identificando titular, cuerpo y fotografía.',
        'Taller de redacción guiada: cada equipo asume el rol de periodistas escolares redactando una noticia de su aula.',
        'Intercambio de borradores entre compañeros para coevaluación con lista de cotejo.'
      ],
      closeSuggestions: [
        'Socialización en plenaria: "El Noticiero del Aula", leyendo dos noticias destacadas.',
        'Rueda de metacognición: ¿Qué parte de la noticia fue más fácil de escribir y por qué?'
      ],
      resourceSuggestions: ['Periódicos nacionales', 'Papelógrafos', 'Marcadores', 'Fascículo MINERD de Lengua Española', 'Pizarra interactiva']
    },
    {
      name: 'La Carta de Solicitud de Permiso',
      suggestedIntention: 'Elaborar una carta formal de solicitud de permiso dirigida a la Dirección del centro, aplicando fórmulas de cortesía y estructura epistolar.',
      specificCompetencies: [
        'Comprensión escrita: Interpreta el propósito y requerimientos en cartas formales de solicitud.',
        'Producción escrita: Escribe cartas de solicitud utilizando el registro formal y respetando las convenciones sociales.'
      ],
      conceptual: [
        'La carta de solicitud: función y estructura (lugar y fecha, destinatario, saludo, cuerpo, despedida y firma).',
        'Fórmulas de cortesía y registro formal.'
      ],
      procedural: [
        'Diferenciación entre carta formal y carta informal o familiar.',
        'Organización lógica de los argumentos para sustentar una solicitud.'
      ],
      attitudinal: [
        'Valoración de las normas de cortesía en la comunicación escrita institucional.',
        'Responsabilidad y honestidad en las solicitudes expresadas.'
      ],
      indicators: [
        'Reconoce la intención comunicativa y los elementos de la carta de solicitud.',
        'Escribe una carta formal coherente con adecuada segmentación de párrafos y fórmulas de despedida.'
      ],
      startSuggestions: [
        'Conversación guiada: ¿Cómo le pedimos permiso formalmente al director para un torneo deportivo?',
        'Presentación de una carta desordenada para que los estudiantes organicen sus partes.'
      ],
      devSuggestions: [
        'Modelado en la pizarra de la plantilla institucional para cartas de solicitud.',
        'Redacción individual de una carta solicitando la reparación de un área verde escolar.',
        'Corrección entre pares verificando fecha, saludo, petición clara y firma.'
      ],
      closeSuggestions: [
        'Lectura de cartas seleccionadas y validación de su grado de formalidad.',
        'Metacognición: ¿Qué diferencia una carta dirigida a un amigo de una dirigida al director?'
      ],
      resourceSuggestions: ['Hojas de maquinilla', 'Guía MINERD de Redacción', 'Pizarra', 'Ejemplos de cartas auténticas']
    },
    {
      name: 'El Informe de Lectura',
      suggestedIntention: 'Construir un informe de lectura sobre un cuento dominicano seleccionado, sintetizando los hechos principales y valorando las acciones de los personajes.',
      specificCompetencies: [
        'Comprensión lectora: Analiza obras literarias identificando tema, personajes, ambiente y mensaje.',
        'Producción escrita: Redacta informes de lectura estructurados en introducción, desarrollo y conclusión.'
      ],
      conceptual: [
        'El informe de lectura: concepto, propósito y estructura básica.',
        'Conectores de orden, causalidad y consecuencia.'
      ],
      procedural: [
        'Extracción de ideas principales y secundarias de una lectura.',
        'Redacción de juicios de valor sustentados en el texto leído.'
      ],
      attitudinal: [
        'Apreciación de la literatura dominicana y universal.',
        'Desarrollo del pensamiento crítico y la argumentación fundamentada.'
      ],
      indicators: [
        'Elabora resúmenes coherentes sin distorsionar el sentido original del texto.',
        'Emite opiniones críticas fundamentadas sobre la conducta de los personajes.'
      ],
      startSuggestions: [
        'Preguntas de anticipación a partir de la portada y título del cuento "La Nochebuena de Encarnación Mendoza" o "El Chivo y el Lobo".',
        'Activación de conocimientos previos sobre el concepto de informe.'
      ],
      devSuggestions: [
        'Lectura compartida y guiada con paradas reflexivas.',
        'Elaboración de un esquema gráfico de los momentos de la narración.',
        'Redacción del informe siguiendo una guía estructurada paso a paso.'
      ],
      closeSuggestions: [
        'Mesa redonda: socialización de los juicios críticos elaborados por los estudiantes.',
        'Metacognición: ¿Cómo me ayuda hacer un informe a comprender mejor lo que leo?'
      ],
      resourceSuggestions: ['Antología de cuentos dominicanos', 'Cuadernos de trabajo', 'Ficha de análisis literario']
    }
  ],
  'Matemática': [
    {
      name: 'Operaciones con Fracciones y Números Decimales',
      suggestedIntention: 'Resolver problemas de la vida cotidiana que involucren suma y resta de fracciones con distinto denominador mediante el uso del mínimo común múltiplo.',
      specificCompetencies: [
        'Razona y argumenta: Justifica los procedimientos empleados en el cálculo de fracciones equivalentes.',
        'Resuelve problemas: Modela y resuelve situaciones del contexto comunitario utilizando operaciones fraccionarias.'
      ],
      conceptual: [
        'Fracciones propias, impropias y números mixtos.',
        'Fracciones equivalentes y mínimo común múltiplo (m.c.m.).',
        'Suma y resta de fracciones heterogéneas.'
      ],
      procedural: [
        'Representación gráfica y concreta de fracciones con regletas o material manipulativo.',
        'Cálculo del denominador común y conversión a fracciones homogéneas.',
        'Resolución de problemas contextualizados (recetas de cocina, repartición de terrenos, compras).'
      ],
      attitudinal: [
        'Perseverancia en la búsqueda de soluciones a problemas matemáticos.',
        'Valoración de la utilidad de las matemáticas en el presupuesto familiar y el comercio.'
      ],
      indicators: [
        'Calcula sumas y restas de fracciones con diferente denominador con precisión.',
        'Explica con claridad el procedimiento utilizado para simplificar el resultado.'
      ],
      startSuggestions: [
        'Problema detonante: "Si Doña María usó 1/2 libra de harina para un pastel y 3/4 libra para galletas, ¿cuánta harina usó en total?"',
        'Representación con tiras de papel plegadas de 1/2 y 3/4.'
      ],
      devSuggestions: [
        'Explicación modelada del cálculo del mínimo común múltiplo con participación en la pizarra.',
        'Trabajo en parejas resolviendo desafíos prácticos de compras en el colmado.',
        'Uso de rectas numéricas para verificar los resultados obtenidos.'
      ],
      closeSuggestions: [
        'Puesta en común: dos parejas exponen diferentes métodos de resolución para el mismo problema.',
        'Evaluación rápida (Ticket de salida): Resolver 2/3 + 1/4 en una tarjeta individual.'
      ],
      resourceSuggestions: ['Regletas de Cuisenaire', 'Fracciones circulares imantadas', 'Pizarra', 'Cuaderno del estudiante', 'Fichas de ejercicios']
    },
    {
      name: 'Cálculo de Área y Perímetro en Figuras Planas',
      suggestedIntention: 'Calcular el perímetro y área de polígonos regulares e irregulares presentes en el aula y patio escolar, aplicando fórmulas geométricas y unidades del Sistema Internacional.',
      specificCompetencies: [
        'Comunica: Expresa medidas de longitud y superficie utilizando unidades estandarizadas.',
        'Resuelve problemas: Aplica conceptos de geometría métrica para calcular costos de materiales en remodelaciones escolares.'
      ],
      conceptual: [
        'Concepto de perímetro y área: diferencias esenciales.',
        'Fórmulas de área del triángulo, cuadrado, rectángulo, rombo y trapecio.',
        'Unidades de medida de superficie: metro cuadrado (m²), centímetro cuadrado (cm²).'
      ],
      procedural: [
        'Medición directa con cinta métrica de superficies reales en el centro educativo.',
        'Descomposición de figuras compuestas en polígonos simples para calcular áreas totales.'
      ],
      attitudinal: [
        'Cuidado y precisión en el uso de instrumentos de medición.',
        'Apreciación de la presencia de la geometría en la arquitectura y la naturaleza dominicana.'
      ],
      indicators: [
        'Diferencia conceptual y operativamente el perímetro del área de una figura.',
        'Resuelve situaciones de cálculo de áreas compuestas con exactitud.'
      ],
      startSuggestions: [
        'Reto visual: ¿Cuántas baldosas del piso caben en esta zona delimitada con cinta adhesiva?',
        'Recuperación de saberes sobre la diferencia entre el borde (perímetro) y la superficie (área).'
      ],
      devSuggestions: [
        'Taller de campo en el aula: equipos miden mesas, puertas, ventanas y la pizarra.',
        'Registro de datos en una tabla y aplicación de las fórmulas correspondientes.',
        'Cálculo del costo de pintura necesaria para cubrir la pared frontal del aula.'
      ],
      closeSuggestions: [
        'Comparación de mediciones entre equipos y análisis de posibles márgenes de error.',
        'Pregunta metacognitiva: ¿Por qué no podemos medir el área en metros lineales?'
      ],
      resourceSuggestions: ['Cinta métrica', 'Reglas graduadas', 'Papel milimetrado', 'Plano del aula']
    }
  ],
  'Ciencias de la Naturaleza': [
    {
      name: 'El Sistema Circulatorio y la Salud Cardiovascular',
      suggestedIntention: 'Explicar el funcionamiento del sistema circulatorio humano y la importancia de hábitos saludables para prevenir enfermedades cardiovasculares en la familia.',
      specificCompetencies: [
        'Ofrece explicaciones científicas: Describe las funciones de los órganos del sistema circulatorio y la circulación mayor y menor.',
        'Aplica procedimientos científicos: Diseña modelos del corazón y registra la frecuencia cardíaca antes y después del ejercicio.'
      ],
      conceptual: [
        'El sistema circulatorio: corazón, vasos sanguíneos (arterias, venas y capilares) y la sangre.',
        'Circulación mayor (sistémica) y menor (pulmonar).',
        'Factores de riesgo: hipertensión, sedentarismo y mala alimentación.'
      ],
      procedural: [
        'Construcción de un modelo funcional del bombeo cardíaco con botellas y mangueras plásticas.',
        'Medición y tabulación del pulso cardíaco en reposo vs. tras dos minutos de actividad física.'
      ],
      attitudinal: [
        'Compromiso con la práctica regular de ejercicio y la alimentación balanceada.',
        'Solidaridad y empatía hacia personas con condiciones cardíacas.'
      ],
      indicators: [
        'Identifica y rotula correctamente los componentes principales del sistema circulatorio.',
        'Relaciona el aumento de la frecuencia cardíaca con el requerimiento de oxígeno en los músculos.'
      ],
      startSuggestions: [
        'Dinámica vivencial: colocar la mano en el pecho para sentir los latidos y luego hacer 20 saltos para comparar el ritmo.',
        'Pregunta generadora: ¿Cómo llega el oxígeno que respiramos hasta la punta de los dedos?'
      ],
      devSuggestions: [
        'Observación y análisis de una maqueta o lámina anatómica del corazón.',
        'Experimento guiado: medición del pulso radial con cronómetro y registro en gráfica de barras.',
        'Elaboración en equipos de un tríptico sobre "Decálogo para un corazón sano".'
      ],
      closeSuggestions: [
        'Exposición relámpago de los trípticos diseñados.',
        'Metacognición: ¿Qué hábito poco saludable descubrí hoy que debo cambiar en mi rutina?'
      ],
      resourceSuggestions: ['Estetoscopio casero o comercial', 'Cronómetro', 'Láminas anatómicas MINERD', 'Botellas plásticas y mangueritas']
    },
    {
      name: 'Ecosistemas Dominicanos y Conservación de la Biodiversidad',
      suggestedIntention: 'Identificar los principales ecosistemas de la República Dominicana (manglares, bosques nublados, arrecifes de coral) y proponer acciones para proteger especies endémicas en peligro.',
      specificCompetencies: [
        'Asume actitud crítica y preventiva: Evalúa el impacto de la deforestación y la contaminación en la flora y fauna dominicana.',
        'Ofrece explicaciones científicas: Clasifica los componentes bióticos y abióticos de un ecosistema local.'
      ],
      conceptual: [
        'Ecosistemas terrestres y acuáticos de la República Dominicana.',
        'Especies nativas, endémicas e introducidas (ej. Cotorra de la Española, Gavilán de la Hispaniola, Solenodonte).',
        'Áreas protegidas y Parques Nacionales de la RD.'
      ],
      procedural: [
        'Mapeo de los principales Parques Nacionales (Los Haitises, Jaragua, Valle Nuevo) en el mapa dominicano.',
        'Investigación sobre una especie en peligro de extinción y diseño de una campaña de concientización.'
      ],
      attitudinal: [
        'Orgullo por el patrimonio natural y ecológico de Quisqueya.',
        'Responsabilidad activa frente a la gestión de residuos y el ahorro del agua.'
      ],
      indicators: [
        'Distingue con ejemplos claros especies endémicas de especies invasoras.',
        'Propone medidas viables de conservación ecológica para su centro educativo y comunidad.'
      ],
      startSuggestions: [
        'Proyección de un breve video o galería de fotos del Parque Nacional Los Haitises y la bahía de Samaná.',
        'Pregunta orientadora: ¿Por qué se dice que República Dominicana tiene una biodiversidad única en el Caribe?'
      ],
      devSuggestions: [
        'Lectura de fichas informativas sobre el Solenodonte y la Jutía de la Española.',
        'Construcción de un mural colaborativo dividiendo el aula en 3 zonas ecológicas: Manglar, Bosque y Arrecife.',
        'Debate simulado entre ecologistas y desarrolladores urbanos sobre el cuidado de un área protegida.'
      ],
      closeSuggestions: [
        'Síntesis colectiva en el pizarrón: "Compromiso verde de la Escuela Dr. José Francisco Peña Gómez".',
        'Metacognición: ¿Qué aprendí hoy sobre mi país que desconocía por completo?'
      ],
      resourceSuggestions: ['Mapa físico de la República Dominicana', 'Fichas de fauna y flora nacional', 'Cartulinas', 'Marcadores']
    }
  ],
  'Ciencias Sociales': [
    {
      name: 'La Independencia Dominicana y los Padres de la Patria',
      suggestedIntention: 'Analizar los acontecimientos históricos del 27 de febrero de 1844 y el ideario de Juan Pablo Duarte para valorar la soberanía nacional y la identidad dominicana.',
      specificCompetencies: [
        'Pensamiento crítico-social: Interpreta las causas y consecuencias del proceso independentista dominicano a partir de fuentes primarias y secundarias.',
        'Ubicación en el tiempo y el espacio: Construye líneas del tiempo sobre las etapas de la formación de la República.'
      ],
      conceptual: [
        'La sociedad secreta La Trinitaria: fundación, miembros y juramento.',
        'El trabucazo de Matías Ramón Mella en la Puerta de la Misericordia y el izamiento de la bandera por Francisco del Rosario Sánchez.',
        'Los símbolos patrios: Bandera, Escudo y el Himno Nacional.'
      ],
      procedural: [
        'Lectura y análisis de fragmentos del Juramento Trinitario.',
        'Elaboración de una línea de tiempo desde 1838 hasta la proclamación de la primera Constitución de San Cristóbal en noviembre de 1844.'
      ],
      attitudinal: [
        'Respeto y fervor cívico hacia los símbolos patrios y los forjadores de la nacionalidad.',
        'Defensa de la soberanía, la justicia social y los valores democráticos.'
      ],
      indicators: [
        'Explica el rol específico de Juan Pablo Duarte, Francisco del Rosario Sánchez y Matías Ramón Mella en la gesta de 1844.',
        'Reconoce el significado de los colores y elementos del Escudo Nacional (la Biblia abierta en San Juan 8:32).'
      ],
      startSuggestions: [
        'Audición atenta de las estrofas del Himno Nacional Dominicano y reflexión sobre la frase "Quisqueyanos valientes, alcemos...".',
        'Pregunta activadora: ¿Qué sacrificios tuvieron que hacer los jóvenes trinitarios por nuestra libertad?'
      ],
      devSuggestions: [
        'Dramatización breve del juramento trinitario por un grupo de estudiantes.',
        'Trabajo con fuentes históricas: análisis guiado del Manifiesto del 16 de enero de 1844.',
        'Completar en equipos una matriz comparativa con las aportaciones de Duarte, Sánchez y Mella.'
      ],
      closeSuggestions: [
        'Plenaria reflexiva: "¿Cómo podemos los estudiantes de la Escuela Dr. José Francisco Peña Gómez honrar hoy a los Padres de la Patria?"',
        'Ticket de salida: Escribir una frase de Juan Pablo Duarte y explicar qué significa hoy.'
      ],
      resourceSuggestions: ['Biografías de los Padres de la Patria', 'Bandera y Escudo Nacional en lámina', 'Línea del tiempo gráfica', 'Constitución Dominicana']
    },
    {
      name: 'La Geografía y Relieve de la Isla de Santo Domingo',
      suggestedIntention: 'Localizar en mapas temáticos las principales cordilleras, sierras, valles y llanuras de la República Dominicana, relacionándolas con la actividad económica de cada región.',
      specificCompetencies: [
        'Ubicación espacial: Utiliza coordenadas y mapas para ubicar sistemas montañosos y cuencas hidrográficas del territorio nacional.',
        'Interacción socio-ambiental: Relaciona el relieve con la producción agrícola y los asentamientos humanos en el Valle del Cibao y la Llanura del Caribe.'
      ],
      conceptual: [
        'Sistemas montañosos: Cordillera Central, Cordillera Septentrional, Cordillera Oriental, Sierra de Neiba y Sierra de Bahoruco.',
        'Valles y llanuras: Valle del Cibao, Valle de San Juan, Llanura Costera del Caribe.',
        'El Pico Duarte: punto más alto de las Antillas.'
      ],
      procedural: [
        'Modelado en plastilina o masa de sal del relieve de la República Dominicana.',
        'Lectura e interpretación de mapas físicos con leyenda hipsométrica (alturas y colores).'
      ],
      attitudinal: [
        'Valoración de la riqueza geográfica de nuestra isla.',
        'Conciencia sobre el cuidado de las cuencas hidrográficas que nacen en la Cordillera Central.'
      ],
      indicators: [
        'Ubica sin error las cinco principales cadenas montañosas en un mapa mudo de la isla.',
        'Explica la importancia del Valle del Cibao como centro de producción agrícola del país.'
      ],
      startSuggestions: [
        'Pregunta motivadora: ¿Quién sabe cuál es el lugar más alto de toda la región del Caribe y dónde queda?',
        'Presentación de una imagen satelital de la isla de Santo Domingo resaltando sus elevaciones.'
      ],
      devSuggestions: [
        'Taller de cartografía: colorear mapa mudo según la clave de alturas (verde para llanuras, marrón para cordilleras).',
        'Investigación por regiones: Norte/Cibao, Sur y Este, anotando su principal actividad productiva.',
        'Puesta en común con el mapa mural del aula.'
      ],
      closeSuggestions: [
        'Juego interactivo "El Geógrafo veloz": señalar en el mapa la región mencionada por el docente.',
        'Metacognición: ¿Cómo influyen las montañas de nuestro país en el clima y en las lluvias?'
      ],
      resourceSuggestions: ['Mapas mudos de la República Dominicana', 'Atlas geográfico escolar', 'Lápices de colores', 'Plastilina']
    }
  ],
  'Educación Artística': [
    {
      name: 'El Folklore Dominicano y las Artes Visuales',
      suggestedIntention: 'Crear una máscara de Carnaval Dominicano (Diablo Cojuelo, Lechón o Roba la Gallina) reutilizando materiales reciclados y aplicando conceptos de volumen y color.',
      specificCompetencies: [
        'Expresión artística: Elabora creaciones plásticas tridimensionales valorando elementos de la identidad cultural dominicana.',
        'Apreciación estética: Reconoce las manifestaciones folklóricas y carnavalescas de diferentes provincias del país (La Vega, Santiago, Bonao, Santo Domingo).'
      ],
      conceptual: ['El Carnaval Dominicano: historia, personajes típicos y diversidad regional.', 'La máscara carnavalesca: diseño, volumen, simetría y color.'],
      procedural: ['Técnica de papel maché y ensamblaje de materiales reciclados.', 'Aplicación de pinturas acrílicas con contrastes cromáticos llamativos.'],
      attitudinal: ['Orgullo por las tradiciones populares dominicanas.', 'Cuidado y limpieza en el taller de arte.'],
      indicators: ['Elabora una máscara original utilizando adecuadamente la técnica de modelado.', 'Describe el significado cultural del personaje representado.'],
      startSuggestions: ['Audición de música tradicional de comparsa de carnaval.', 'Observación de imágenes de diablos cojuelos veganos vs. lechones santiagueros.'],
      devSuggestions: ['Boceto inicial del personaje en papel.', 'Modelado de la base de la máscara con cartón y papel periódico.', 'Pintura y decoración con lentejuelas, cintas y plumas.'],
      closeSuggestions: ['Exposición en el corredor escolar "El Carnaval de la Escuela Peña Gómez".', 'Autoevaluación con rúbrica artística.'],
      resourceSuggestions: ['Cartón', 'Papel periódico', 'Pegamento blanco', 'Témperas/Pinturas', 'Pinceles']
    }
  ],
  'Educación Física': [
    {
      name: 'Capacidades Físicas Básicas y Trabajo en Equipo',
      suggestedIntention: 'Desarrollar la resistencia cardiovascular y la coordinación motriz a través de circuitos de ejercicios cooperativos, respetando las reglas de juego y la seguridad colectiva.',
      specificCompetencies: [
        'Dominio motriz: Ejecuta patrones de movimiento complejos con equilibrio, agilidad y ritmo.',
        'Aptitud física: Mejora sus índices de resistencia, velocidad y flexibilidad mediante la práctica guiada.'
      ],
      conceptual: ['Capacidades físicas condicionales: fuerza, resistencia, velocidad y flexibilidad.', 'Higiene postural y calentamiento preventivo.'],
      procedural: ['Calentamiento articular y estiramiento muscular dinámico.', 'Recorrido en estaciones de circuito motriz con conos, aros y cuerdas.'],
      attitudinal: ['Espíritu de juego limpio (Fair Play) y apoyo mutuo.', 'Cuidado de la hidratación y descanso.'],
      indicators: ['Completa el circuito motriz manteniendo una técnica adecuada.', 'Demuestra respeto hacia sus compañeros en situaciones de competencia sana.'],
      startSuggestions: ['Calentamiento lúdico: "El semáforo motriz" con cambios de ritmo.', 'Charla breve sobre la importancia del calentamiento antes de la actividad.'],
      devSuggestions: ['Estación 1: Salto de cuerda coordinado.', 'Estación 2: Zig-zag entre conos en velocidad.', 'Estación 3: Desplazamiento lateral y flexiones.', 'Estación 4: Lanzamiento de precisión.'],
      closeSuggestions: ['Vuelta a la calma: ejercicios de respiración diafragmática y estiramiento.', 'Socialización: ¿Cómo nos sentimos físicamente y qué estación requirió mayor esfuerzo?'],
      resourceSuggestions: ['Conos', 'Cuerdas para saltar', 'Aros de psicomotricidad', 'Cronómetro', 'Silbato']
    }
  ],
  'Formación Integral Humana y Religiosa': [
    {
      name: 'Valores para la Convivencia y Cultura de Paz',
      suggestedIntention: 'Reflexionar sobre el valor del respeto, el diálogo y la empatía en la resolución pacífica de conflictos en el aula y en la familia.',
      specificCompetencies: [
        'Desarrollo moral y espiritual: Asume actitudes de perdón, reconciliación y solidaridad fundamentadas en principios éticos universales.',
        'Convivencia fraterna: Propone acuerdos de convivencia que garanticen un ambiente armónico y libre de violencia escolar.'
      ],
      conceptual: ['Los valores humanos: respeto, empatía, solidaridad, honestidad y perdón.', 'El diálogo como herramienta fundamental de la paz.'],
      procedural: ['Análisis de dilemas morales y casos de la vida real.', 'Construcción del "Decálogo de la Paz" para el aula.'],
      attitudinal: ['Disposición para escuchar activamente al compañero.', 'Rechazo a toda forma de acoso escolar (bullying) o discriminación.'],
      indicators: ['Identifica causas de desacuerdos cotidianos y propone soluciones basadas en el diálogo.', 'Participa activamente en la construcción de normas de convivencia justa.'],
      startSuggestions: ['Lectura de la parábola o fábula "El sol y el viento" sobre la fuerza de la amabilidad.', 'Dinámica "El espejo empático": ponerse en el lugar del otro.'],
      devSuggestions: ['Trabajo en grupos analizando tarjetas con situaciones conflictivas de recreo.', 'Dramatización de una solución pacífica vs. una reacción violenta.', 'Firma simbólica del compromiso de paz del grado.'],
      closeSuggestions: ['Oración o reflexión colectiva por la paz en el centro educativo.', 'Pregunta metacognitiva: ¿Qué haré hoy diferente cuando alguien tenga una opinión distinta a la mía?'],
      resourceSuggestions: ['Tarjetas de dilemas morales', 'Cartulina para el Decálogo', 'Caja de sugerencias de paz']
    }
  ],
  'Lenguas Extranjeras (Inglés)': [
    {
      name: 'Daily Routines and Time Expressions',
      suggestedIntention: 'Describir rutinas diarias y horarios habituales en inglés utilizando el presente simple y conectores temporales (first, then, after that, finally).',
      specificCompetencies: [
        'Comprensión oral y escrita: Comprende descripciones sencillas de hábitos y horarios cotidianos en inglés.',
        'Producción oral y escrita: Comunica sus actividades diarias con fluidez y pronunciación adecuada.'
      ],
      conceptual: ['Simple Present Tense (affirmative, negative, interrogative).', 'Time expressions and adverbs of frequency (always, usually, sometimes, never).'],
      procedural: ['Matching routine flashcards with correct verbs (wake up, brush teeth, have breakfast, go to school).', 'Writing a daily schedule timeline.'],
      attitudinal: ['Confidence and enthusiasm in speaking a foreign language.', 'Respect for different cultural daily habits.'],
      indicators: ['Uses simple present verbs accurately in sentences about daily life.', 'Asks and answers questions about class schedules.'],
      startSuggestions: ['Warm-up chant: "This is the way we go to school".', 'Miming game: Guess the morning routine action.'],
      devSuggestions: ['Teacher modeling of sentences on the board with time clocks.', 'Pair work: Student A interviews Student B about their weekend schedule.', 'Creating a mini-poster: "My Typical Day in Santo Domingo".'],
      closeSuggestions: ['Volunteers present 3 actions of their day to the class in English.', 'Exit ticket: Write one sentence with "I always..." and one with "I never...".'],
      resourceSuggestions: ['Routine flashcards', 'Toy clock for time practice', 'Worksheets', 'Audio speaker']
    }
  ],
  'Lenguas Extranjeras (Francés)': [
    {
      name: 'Les Salutations et la Présentation Personnelle',
      suggestedIntention: 'Presentarse a sí mismo y saludar formal e informalmente en francés empleando expresiones básicas de cortesía.',
      specificCompetencies: [
        'Compréhension et production orale: Salue, prend congé et se présente en français dans des situations simples de communication.'
      ],
      conceptual: ['Les salutations (Bonjour, Bonsoir, Salut, Au revoir).', 'Verbes s’appeler et être au présent.'],
      procedural: ['Jeux de rôle en binômes pour simuler une première rencontre.', 'Écoute et répétition phonétique des sons spécifiques du français.'],
      attitudinal: ['Curiosité pour la langue et les cultures francophones de la Caraïbe et du monde.'],
      indicators: ['Salue et se présente avec une prononciation compréhensible.', 'Demande et donne son prénom et son âge.'],
      startSuggestions: ['Chanson "Bonjour, Bonjour, comment ça va ?".'],
      devSuggestions: ['Dialogue guidé entre camarades.', 'Fiche de présentation personnelle (Je m’appelle..., J’ai... ans).'],
      closeSuggestions: ['Jeu de la balle: lancer la balle en posant la question "Comment tu t’appelles ?".'],
      resourceSuggestions: ['Cartes de vocabulaire', 'Enceinte audio', 'Fiches d’exercices']
    }
  ]
};

export const INITIAL_DEMO_DAILY_PLANS: DailyPlan[] = [];

export const INITIAL_DEMO_WEEKLY_PLANS: WeeklyPlan[] = [];

export const INITIAL_DEMO_LEARNING_UNITS: LearningUnit[] = [];
