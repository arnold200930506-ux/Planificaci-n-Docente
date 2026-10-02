// Malla Curricular Oficial MINERD - Adecuación Curricular Vigente
// Organización por Grado y Área con Competencias Específicas, Ejes Temáticos,
// Contenidos (Conceptuales, Procedimentales, Actitudinales), e Indicadores de Logro.

import { SubjectArea, EducationalLevel } from '../types/minerd';

export interface AdecuacionCurricularItem {
  id: string;
  grade: string; // ej. "1er Grado", "2do Grado", "3er Grado", "4to Grado", "5to Grado", "6to Grado"
  cycle: 'Primer Ciclo' | 'Segundo Ciclo' | 'Secundaria Primer Ciclo';
  level: EducationalLevel;
  area: SubjectArea;
  unitTheme: string;
  period: 'Período 1' | 'Período 2' | 'Período 3' | 'Período 4';
  pedagogicalIntention: string;
  specificCompetencies: {
    title: string;
    description: string;
  }[];
  conceptualContents: string[];
  proceduralContents: string[];
  attitudinalContents: string[];
  achievementIndicators: string[];
  startSuggestions: string[];
  devSuggestions: string[];
  closeSuggestions: string[];
  evaluations: string[];
}

export const ADECUACION_CURRICULAR_DATA: AdecuacionCurricularItem[] = [
  // --- 1ER GRADO PRIMARIA ---
  {
    id: 'ade-1-le-1',
    grade: '1er Grado',
    cycle: 'Primer Ciclo',
    level: 'primario_primer_ciclo',
    area: 'Lengua Española',
    unitTheme: 'La Tarjeta de Identidad y Mi Nombre Propio',
    period: 'Período 1',
    pedagogicalIntention: 'Reconocer el nombre propio y de sus compañeros en tarjetas de identidad para afianzar la conciencia fonológica y el sentido de pertenencia.',
    specificCompetencies: [
      {
        title: 'Comprensión Escrita (Lectura Inicial)',
        description: 'Comprende su nombre propio y palabras sencillas y significativas en soportes visuales como etiquetas, listas y tarjetas de identidad.'
      },
      {
        title: 'Producción Escrita (Escritura No Convencional y Convencional)',
        description: 'Escribe su nombre y el de familiares respetando la linealidad, direccionalidad izquierda-derecha y correspondencia fonema-grafema.'
      }
    ],
    conceptualContents: [
      'El nombre propio y su función identificadora en la comunidad escolar.',
      'La tarjeta de identidad: fotografía, nombre, apellido y fecha de nacimiento.',
      'Vocales y consonantes iniciales en nombres significativos.'
    ],
    proceduralContents: [
      'Identificación visual del cartel de asistencia y tarjetas de presentación personal.',
      'Trazo del nombre propio utilizando modelado con masilla, arena y lápiz grueso.',
      'Comparación de nombres largos y nombres cortos en el aula.'
    ],
    attitudinalContents: [
      'Autoestima, orgullo por su identidad y respeto por los nombres de sus pares.',
      'Curiosidad por descubrir las letras del abecedario en los rótulos del aula.'
    ],
    achievementIndicators: [
      'Identifica su nombre escrito entre varios nombres de compañeros.',
      'Escribe su nombre con intención comunicativa legible y orientada de izquierda a derecha.',
      'Reconoce la letra inicial y final de su nombre y asocia con su sonido correspondiente.'
    ],
    startSuggestions: [
      'Canción de bienvenida pasando el "Micrófono de la Amistad" donde cada niño dice su nombre.',
      'Búsqueda de su tarjeta de identidad en la mesa de entrada del aula.'
    ],
    devSuggestions: [
      'Construcción de su nombre con letras móviles de foami o cartón.',
      'Elaboración del carné de explorador escolar pegando un autorretrato dibujado.',
      'Juego colectivo: "¿Quién tiene la letra que suena como la mía?"'
    ],
    closeSuggestions: [
      'Colocación del carné personal en el mural "Nuestra Familia del 1er Grado".',
      'Metacognición en círculo: ¿Qué letra aprendiste a trazar hoy?'
    ],
    evaluations: ['Guía de observación de lectura emergente', 'Lista de cotejo de trazo del nombre propio']
  },
  {
    id: 'ade-1-mat-1',
    grade: '1er Grado',
    cycle: 'Primer Ciclo',
    level: 'primario_primer_ciclo',
    area: 'Matemática',
    unitTheme: 'Los Números Naturales del 1 al 20 y Conteo Concreto',
    period: 'Período 1',
    pedagogicalIntention: 'Contar colecciones de objetos concretos del entorno hasta 20 para asociar cantidad con el símbolo numérico correspondiente.',
    specificCompetencies: [
      {
        title: 'Razonamiento y Argumentación Lógica',
        description: 'Comprende el concepto de número natural, orden y cantidad a partir de la manipulación de objetos de su entorno.'
      },
      {
        title: 'Comunicación y Representación Matemática',
        description: 'Representa cantidades con material no estructurado (chapas, semillas) y simbólicamente mediante cifras numéricas del 0 al 20.'
      }
    ],
    conceptualContents: [
      'Los números naturales del 0 al 20: secuencia verbal, conteo y cardinalidad.',
      'Relaciones de orden: mayor que, menor que, igual que, anterior y posterior.'
    ],
    proceduralContents: [
      'Conteo uno a uno de chapitas, bloques y lápices en la mesa de trabajo.',
      'Asociación de cantidad con tarjeta numeral correspondiente.',
      'Organización de colecciones en la recta numérica del piso del aula.'
    ],
    attitudinalContents: [
      'Gusto y perseverancia en las actividades de conteo lúdico.',
      'Cuidado y cooperación en el uso de materiales compartidos en el aula.'
    ],
    achievementIndicators: [
      'Cuenta colecciones de hasta 20 elementos asignando un solo número a cada elemento.',
      'Lee y escribe números naturales del 0 al 20 en contextos lúdicos y reales.',
      'Compara dos colecciones e indica cuál tiene más, menos o igual cantidad.'
    ],
    startSuggestions: [
      'Rima rítmica: "Los diez deditos de las manos" con palmadas guiadas.',
      'Conteo de cuántos niños y niñas asistieron hoy al aula.'
    ],
    devSuggestions: [
      'Llenado de cubetas con 15 tapitas usando pinzas de ropa para motricidad fina.',
      'El juego de la rayuela numérica dibujada en el piso para saltar del 1 al 20.',
      'Escritura del número en pizarras individuales borrables tras contar bloques.'
    ],
    closeSuggestions: [
      'Juego "El número secreto": el maestro muestra 7 dedos y los niños levantan su tarjeta.',
      'Pregunta de reflexión: ¿Dónde vemos números en nuestra casa y en la calle?'
    ],
    evaluations: ['Registro de observación del conteo uno a uno', 'Rúbrica de correspondencia número-cantidad']
  },

  // --- 2DO GRADO PRIMARIA ---
  {
    id: 'ade-2-le-1',
    grade: '2do Grado',
    cycle: 'Primer Ciclo',
    level: 'primario_primer_ciclo',
    area: 'Lengua Española',
    unitTheme: 'El Cuento Infantil y la Secuencia Narrativa',
    period: 'Período 1',
    pedagogicalIntention: 'Comprender y renarrar cuentos infantiles sencillos identificando la estructura de inicio, nudo y desenlace.',
    specificCompetencies: [
      {
        title: 'Comprensión Oral y Escrita',
        description: 'Reconstruye el sentido global de cuentos que escucha y lee guiándose por ilustraciones y vocabulario clave.'
      },
      {
        title: 'Producción Escrita',
        description: 'Escribe oraciones y secuencias narrativas breves para contar anécdotas o desenlaces alternativos de cuentos.'
      }
    ],
    conceptualContents: [
      'El cuento: función recreativa y estructura (inicio, conflicto o nudo, y desenlace).',
      'Fórmulas de inicio y cierre de cuentos ("Había una vez", "Colorín colorado").',
      'El punto y la mayúscula inicial en la oración.'
    ],
    proceduralContents: [
      'Anticipación del contenido a partir de la portada y título de la obra.',
      'Ordenamiento cronológico de viñetas ilustradas sobre la historia escuchada.',
      'Dramatización guiada de los personajes principales del cuento.'
    ],
    attitudinalContents: [
      'Disfrute y gozo por la lectura de fábulas y cuentos de la literatura infantil dominicana.',
      'Empatía con las emociones y dilemas de los personajes de ficción.'
    ],
    achievementIndicators: [
      'Identifica los personajes principales y secundarios en cuentos leídos.',
      'Reconstruye oralmente el argumento respetando el orden cronológico.',
      'Escribe oraciones con sentido completo usando mayúscula inicial y punto final.'
    ],
    startSuggestions: [
      'Apertura del "Cofre Mágico de Cuentos" con un títere que presenta el libro del día.',
      'Lluvia de predicciones a partir de la ilustración de la portada.'
    ],
    devSuggestions: [
      'Lectura dramatizada con entonación de voces por parte del docente.',
      'Trabajo en parejas: ordenar 4 tarjetas con momentos clave del cuento.',
      'Redacción en el cuaderno de una oración sobre su personaje favorito.'
    ],
    closeSuggestions: [
      'Dibuja el final del cuento y compártelo con tu compañero de banco.',
      'Pregunta metacognitiva: ¿Qué sentiste cuando el personaje resolvió su problema?'
    ],
    evaluations: ['Escala estimativa de comprensión lectora', 'Cuaderno del alumno (revisión de ortografía)']
  },
  {
    id: 'ade-2-mat-1',
    grade: '2do Grado',
    cycle: 'Primer Ciclo',
    level: 'primario_primer_ciclo',
    area: 'Matemática',
    unitTheme: 'Adición y Sustracción hasta el 100 sin y con Reagrupación',
    period: 'Período 1',
    pedagogicalIntention: 'Resolver problemas cotidianos del aula y del colmado que requieran sumar y restar con números hasta 99 utilizando el valor posicional.',
    specificCompetencies: [
      {
        title: 'Resolución de Problemas',
        description: 'Aplica algoritmos de adición y sustracción en situaciones contextualizadas de compra y venta simulada.'
      },
      {
        title: 'Uso de Herramientas Tecnológicas y Concretas',
        description: 'Utiliza el ábaco y la tabla de valor posicional (Unidades y Decenas) para descomponer cantidades.'
      }
    ],
    conceptualContents: [
      'Valor posicional: Unidad (U) y Decena (D) hasta el 99.',
      'La adición: juntar, agregar y avanzar en la recta numérica.',
      'La sustracción: quitar, comparar y retroceder.'
    ],
    proceduralContents: [
      'Descomposición aditiva de cantidades (ej. 45 = 40 + 5).',
      'Resolución de sumas en vertical alineando decenas con decenas y unidades con unidades.',
      'Cálculo mental de sumas dobles sencillas (ej. 10+10, 20+20).'
    ],
    attitudinalContents: [
      'Seguridad y entusiasmo al resolver retos matemáticos del entorno escolar.',
      'Honestidad al verificar cálculos en simulaciones de colmado.'
    ],
    achievementIndicators: [
      'Resuelve sumas y restas de hasta dos dígitos con y sin reagrupación.',
      'Explica el procedimiento seguido para resolver problemas de agregar o quitar.',
      'Aplica el valor posicional para ordenar y comparar números hasta el 99.'
    ],
    startSuggestions: [
      'Juego "El Banco de las Decenas": canjear 10 pajitas sueltas por un fajo atado.',
      'Planteamiento de un problema real: "¿Cuántas meriendas llegaron hoy para 2do A y 2do B?"'
    ],
    devSuggestions: [
      'Resolución con bloques de base diez organizando unidades y decenas en papelógrafo.',
      'Simulación de compras en la tiendita del aula con billetes escolares de fantasía.',
      'Ejercicios prácticos en el cuaderno con operaciones contextualizadas.'
    ],
    closeSuggestions: [
      'Plenaria de resolución colectiva: un estudiante explica su estrategia en la pizarra.',
      'Metacognición: ¿Por qué es más fácil sumar primero las unidades y luego las decenas?'
    ],
    evaluations: ['Prueba de desempeño con la tiendita', 'Lista de cotejo de valor posicional']
  },

  // --- 3ER GRADO PRIMARIA ---
  {
    id: 'ade-3-cn-1',
    grade: '3er Grado',
    cycle: 'Primer Ciclo',
    level: 'primario_primer_ciclo',
    area: 'Ciencias de la Naturaleza',
    unitTheme: 'El Cuerpo Humano, los Sentidos y Hábitos Saludables',
    period: 'Período 1',
    pedagogicalIntention: 'Reconocer la función de los cinco sentidos y los órganos vitales para adoptar hábitos de higiene y nutrición en la vida diaria.',
    specificCompetencies: [
      {
        title: 'Comprensión y Análisis Científico',
        description: 'Explica cómo interactúan los órganos de los sentidos con el cerebro para percibir estímulos del entorno escolar y comunitario.'
      },
      {
        title: 'Adopción de Medidas de Prevención y Salud',
        description: 'Práctica hábitos higiénicos, lavado de manos y consumo de agua potable para prevenir enfermedades comunes.'
      }
    ],
    conceptualContents: [
      'Los cinco órganos de los sentidos: ojos (visión), oídos (audición), nariz (olfato), lengua (gusto) y piel (tacto).',
      'Hábitos de higiene corporal y lavado correcto de manos.',
      'La alimentación balanceada: frutas locales dominicanas y proteínas.'
    ],
    proceduralContents: [
      'Observación guiada y experimentación sensorial con texturas, aromas y sonidos.',
      'Elaboración de un reloj de hábitos higiénicos diarios.',
      'Diferenciación entre alimentos nutritivos y comida chatarra ultraprocesada.'
    ],
    attitudinalContents: [
      'Valoración y cuidado del propio cuerpo y respeto a las diferencias físicas de los demás.',
      'Compromiso con la limpieza del aula y la manipulación higiénica de los alimentos.'
    ],
    achievementIndicators: [
      'Asocia cada órgano de los sentidos con su función receptora correspondiente.',
      'Describe y aplica la técnica correcta de lavado de manos con agua y jabón.',
      'Selecciona opciones alimenticias saludables para su lonchera escolar.'
    ],
    startSuggestions: [
      'Juego a oscuras: vendar los ojos a un voluntario e identificar objetos solo por tacto y olor.',
      'Pregunta orientadora: ¿Cómo sabe nuestro cuerpo si un plato de comida está muy caliente?'
    ],
    devSuggestions: [
      'Experimento en estaciones: estación 1 (texturas con lija y algodón), estación 2 (olores con canela y limón).',
      'Dibujo guiado del cuerpo humano rotulando los 5 sentidos.',
      'Práctica de lavado de manos en el lavamanos de la escuela cronometrando 20 segundos.'
    ],
    closeSuggestions: [
      'Compromiso personal firmado en el mural: "Hoy cuidaré mis ojos y mis oídos descansando de pantallas".',
      'Reflexión metacognitiva: ¿Cuál sentido te ayudó más en los juegos de hoy?'
    ],
    evaluations: ['Rúbrica de indagación sensorial', 'Lista de cotejo de lavado de manos']
  },
  {
    id: 'ade-3-cs-1',
    grade: '3er Grado',
    cycle: 'Primer Ciclo',
    level: 'primario_primer_ciclo',
    area: 'Ciencias Sociales',
    unitTheme: 'El Municipio, la Provincia y Nuestras Tradiciones',
    period: 'Período 1',
    pedagogicalIntention: 'Identificar las características geográficas, autoridades locales y fiestas patronales de la provincia La Altagracia y el municipio de Higüey.',
    specificCompetencies: [
      {
        title: 'Ubicación en el Tiempo y en el Espacio',
        description: 'Localiza en mapas sencillos su municipio, lugares históricos y límites territoriales provinciales.'
      },
      {
        title: 'Ciudadanía Democrática e Identidad Cultural',
        description: 'Reconoce las funciones de las autoridades municipales (Alcaldía, Regidores) y valora el patrimonio cultural dominicano.'
      }
    ],
    conceptualContents: [
      'El municipio y la provincia: límites, barrios, ríos y parajes.',
      'Las autoridades locales: el alcalde, la policía municipal y los regidores.',
      'Costumbres, gastronomía y festividades de la región este y de la comunidad local.'
    ],
    proceduralContents: [
      'Lectura de planos sencillos del barrio y croquis del trayecto de casa a la escuela.',
      'Entrevista simulada a una autoridad municipal sobre el cuidado de la basura en la comunidad.',
      'Elaboración de un mural con fotos de monumentos históricos (Basílica de Higüey, San Dionisio).'
    ],
    attitudinalContents: [
      'Sentido de orgullo y pertenencia a su comunidad y respeto por los símbolos locales.',
      'Cuidado y defensa de los espacios públicos y parques infantiles.'
    ],
    achievementIndicators: [
      'Describe las funciones elementales del Ayuntamiento y de las autoridades de su provincia.',
      'Señala en un croquis lugares de referencia de su entorno escolar.',
      'Relata aspectos destacados de la historia y costumbres de su comunidad.'
    ],
    startSuggestions: [
      'Muestra de fotografías antiguas y actuales del municipio de Higüey y su parque central.',
      'Pregunta de sondeo: ¿Quiénes se encargan de limpiar las calles y recoger la basura en nuestra ciudad?'
    ],
    devSuggestions: [
      'Trazado cooperativo en papelógrafo gigante del mapa del barrio de la escuela.',
      'Juego de roles: "Sesión del Consejo de Regidores Infantiles" debatiendo un parque con árboles.',
      'Investigación en casa con abuelos sobre leyendas y tradiciones locales.'
    ],
    closeSuggestions: [
      'Exposición relámpago de los croquis realizados por equipos.',
      'Pregunta metacognitiva: ¿Qué puedes hacer tú hoy para que tu municipio esté más limpio?'
    ],
    evaluations: ['Rúbrica de orientación espacial y croquis', 'Diario reflexivo de ciencias sociales']
  },

  // --- 4TO GRADO PRIMARIA ---
  {
    id: 'ade-4-le-1',
    grade: '4to Grado',
    cycle: 'Segundo Ciclo',
    level: 'primario_segundo_ciclo',
    area: 'Lengua Española',
    unitTheme: 'La Noticia Periodística: Estructura, Función y Ética',
    period: 'Período 1',
    pedagogicalIntention: 'Analizar la estructura canónica de la noticia (titular, lead, cuerpo, imagen y pie de foto) para redactar noticias verídicas sobre la comunidad educativa.',
    specificCompetencies: [
      {
        title: 'Comprensión Escrita (Noticia)',
        description: 'Comprende noticias impresas y digitales que lee, reconociendo la veracidad de los hechos y distinguiendo opinión de información objetiva.'
      },
      {
        title: 'Producción Escrita (Noticia)',
        description: 'Produce noticias escritas respetando su estructura piramidal inversa, la coherencia global y el uso adecuado de signos de puntuación.'
      }
    ],
    conceptualContents: [
      'La noticia: concepto, función social, objetividad y estructura piramidal.',
      'Las 6 preguntas clave del periodismo (¿Qué ocurrió?, ¿Quiénes participaron?, ¿Cuándo?, ¿Dónde?, ¿Cómo? y ¿Por qué?).',
      'El verbo en tiempo pretérito y conectores de causa y consecuencia.'
    ],
    proceduralContents: [
      'Selección de un hecho relevante en la escuela (torneo deportivo, inauguración de biblioteca, jornada de limpieza).',
      'Redacción del borrador periodístico distribuyendo la información según su importancia.',
      'Corrección ortográfica y gramatical entre pares mediante lista de cotejo.'
    ],
    attitudinalContents: [
      'Respeto irrestricto por la verdad y la dignidad de las personas al informar.',
      'Rechazo activo a las noticias falsas (fake news) y al sensacionalismo en redes sociales.'
    ],
    achievementIndicators: [
      'Identifica con exactitud las seis preguntas clave en noticias de periódicos nacionales.',
      'Escribe noticias coherentes respetando titular atractivo, entrada informativa y cuerpo ordenado.',
      'Emplea adecuadamente la concordancia de género y número y la acentuación de verbos en pasado.'
    ],
    startSuggestions: [
      'Análisis de un titular impactante de primera plana proyectado en el aula.',
      'Pregunta provocadora: ¿Es lo mismo lo que alguien opina que lo que realmente ocurrió?'
    ],
    devSuggestions: [
      'Taller en grupos de 4: repartir un artículo de prensa y recortar sus componentes para pegarlos en orden en una cartulina.',
      'Laboratorio de redacción: cada grupo asume la cobertura periodística de un evento del colegio.',
      'Entrevista en vivo a un maestro o conserje para recolectar datos reales.'
    ],
    closeSuggestions: [
      'Edición del periódico mural del aula con las noticias aprobadas.',
      'Rueda de metacognición: ¿Qué fue lo más retador al redactar como periodista?'
    ],
    evaluations: ['Rúbrica de producción escrita de textos periodísticos', 'Lista de cotejo de coevaluación']
  },
  {
    id: 'ade-4-mat-1',
    grade: '4to Grado',
    cycle: 'Segundo Ciclo',
    level: 'primario_segundo_ciclo',
    area: 'Matemática',
    unitTheme: 'Fracciones Comunes, Lectura, Gráfica y Fracciones Equivalentes',
    period: 'Período 1',
    pedagogicalIntention: 'Comprender el concepto de fracción como parte de una unidad o conjunto, representando fracciones propias e impropias en situaciones de reparto cotidiano.',
    specificCompetencies: [
      {
        title: 'Razonamiento y Demostración Matemática',
        description: 'Modela situaciones de la vida real que involucran particiones de un todo en partes iguales, reconociendo el numerador y denominador.'
      },
      {
        title: 'Resolución de Problemas con Números Racionales',
        description: 'Compara y halla fracciones equivalentes utilizando tiras de fracciones, gráficos circulares y multiplicación cruzada.'
      }
    ],
    conceptualContents: [
      'Fracción: concepto, numerador y denominador.',
      'Tipos de fracciones: propias, impropias y número mixto.',
      'Fracciones equivalentes: ampliación y simplificación.'
    ],
    proceduralContents: [
      'Doblado de tiras de cartulina para obtener medios, cuartos y octavos.',
      'Representación gráfica y simbólica de fracciones en la recta numérica.',
      'Resolución de situaciones de reparto justo (pizzas, bizcochos, terrenos).'
    ],
    attitudinalContents: [
      'Apreciación de la equidad y justicia en situaciones de distribución y reparto.',
      'Paciencia y rigurosidad al trazar divisiones de figuras geométricas.'
    ],
    achievementIndicators: [
      'Interpreta y lee correctamente fracciones con denominadores hasta 12.',
      'Grafica fracciones de forma precisa en rectángulos y círculos.',
      'Determina si dos fracciones son equivalentes mediante modelos visuales o cálculo.'
    ],
    startSuggestions: [
      'Dilema del bizcocho de cumpleaños: cómo repartirlo entre 8 invitados para que nadie se queje.',
      'Pregunta de partida: ¿Es 1/2 más grande o más pequeño que 1/4?'
    ],
    devSuggestions: [
      'Construcción del "Muro de Fracciones" con tiras de colores para comparar equivalencias.',
      'Juego de dominó de fracciones emparejando gráfica con cifra numérica.',
      'Resolución de problemas contextualizados en el cuaderno de trabajo.'
    ],
    closeSuggestions: [
      'Desafío relámpago con pizarras: "Dibuja 3/4 en 20 segundos".',
      'Metacognición: ¿Por qué cuando el denominador es más grande la porción se hace más chica?'
    ],
    evaluations: ['Rúbrica analítica de fracciones y modelado', 'Prueba escrita de cálculo con equivalencias']
  },

  // --- 5TO GRADO PRIMARIA ---
  {
    id: 'ade-5-le-1',
    grade: '5to Grado',
    cycle: 'Segundo Ciclo',
    level: 'primario_segundo_ciclo',
    area: 'Lengua Española',
    unitTheme: 'El Artículo Expositivo y la Divulgación Científica',
    period: 'Período 1',
    pedagogicalIntention: 'Comprender y producir artículos expositivos con estructura descriptiva o de causa-efecto para difundir descubrimientos científicos a la comunidad escolar.',
    specificCompetencies: [
      {
        title: 'Comprensión Lectora de Textos Expositivos',
        description: 'Identifica la tesis, explicaciones técnicas y recursos explicativos (definiciones, ejemplos, comparaciones) en artículos científicos.'
      },
      {
        title: 'Producción de Textos Informativos y Académicos',
        description: 'Redacta textos expositivos organizados en introducción, desarrollo y conclusión utilizando conectores de adición y causa.'
      }
    ],
    conceptualContents: [
      'El artículo expositivo: propósito informativo, claridad y lenguaje denotativo.',
      'Estructuras textuales: problema-solución, causa-efecto y comparación-contraste.',
      'Uso de subtítulos, esquemas y citas bibliográficas sencillas.'
    ],
    proceduralContents: [
      'Búsqueda y selección de fuentes confiables de información sobre un tema ambiental (cambio climático, manglares).',
      'Elaboración de mapas conceptuales previos a la redacción.',
      'Uso de la tercera persona gramatical y vocabulario técnico adecuado.'
    ],
    attitudinalContents: [
      'Curiosidad por los avances de la ciencia y el pensamiento crítico frente a la información.',
      'Honestidad académica citando las fuentes consultadas sin plagio.'
    ],
    achievementIndicators: [
      'Sintetiza la información esencial de un texto científico identificando su estructura.',
      'Redacta un artículo expositivo claro con adecuada jerarquía de ideas y subtítulos.',
      'Aplica correctamente las reglas ortográficas en palabras agudas, graves y esdrújulas.'
    ],
    startSuggestions: [
      'Proyección de un video breve sobre los manatíes de las costas dominicanas.',
      'Pregunta de debate: ¿Cómo convencer a la gente de cuidar una especie con datos científicos?'
    ],
    devSuggestions: [
      'Taller de fichaje bibliográfico a partir de enciclopedias y textos provistos por el docente.',
      'Elaboración de un borrador estructurado en 3 párrafos fundamentales.',
      'Revisión entre pares con rúbrica de estilo expositivo.'
    ],
    closeSuggestions: [
      'Simposio estudiantil: exposición de 2 minutos por autor sobre su artículo.',
      'Pregunta reflexiva: ¿Qué diferencia a un artículo expositivo de un cuento o un poema?'
    ],
    evaluations: ['Rúbrica de texto expositivo', 'Portafolio con versiones de borrador y versión final']
  },
  {
    id: 'ade-5-cn-1',
    grade: '5to Grado',
    cycle: 'Segundo Ciclo',
    level: 'primario_segundo_ciclo',
    area: 'Ciencias de la Naturaleza',
    unitTheme: 'La Célula: Unidad Fundamental de la Vida y Tejidos',
    period: 'Período 1',
    pedagogicalIntention: 'Identificar las estructuras celulares básicas (núcleo, citoplasma, membrana) y diferenciar la célula animal de la vegetal.',
    specificCompetencies: [
      {
        title: 'Indagación y Modelado Biológico',
        description: 'Utiliza modelos tridimensionales y microscopios ópticos o lupas para examinar células y tejidos vegetales.'
      },
      {
        title: 'Comprensión de los Niveles de Organización',
        description: 'Explica la jerarquía biológica: célula, tejido, órgano, sistema de órganos e individuo.'
      }
    ],
    conceptualContents: [
      'La célula: concepto, teoría celular básica y tipos (procariota y eucariota).',
      'Organelos celulares: membrana plasmática, núcleo, mitocondria, cloroplasto y pared celular.',
      'Diferencias morfológicas y funcionales entre célula vegetal y célula animal.'
    ],
    proceduralContents: [
      'Observación de epidermis de cebolla al microscopio o con aplicaciones de realidad aumentada.',
      'Construcción de maquetas de células con materiales reciclados o plastilina.',
      'Elaboración de cuadros comparativos de organelos y sus funciones.'
    ],
    attitudinalContents: [
      'Asombro y respeto ante la complejidad y belleza de la vida a nivel microscópico.',
      'Cuidado y responsabilidad en el uso del equipo de laboratorio escolar.'
    ],
    achievementIndicators: [
      'Describe la función de la membrana, el citoplasma y el núcleo celular.',
      'Distingue con precisión una célula animal de una vegetal señalando pared celular y cloroplastos.',
      'Relaciona el funcionamiento celular con los procesos vitales del ser humano.'
    ],
    startSuggestions: [
      'Observación de un ladrillo en una pared y analogía: ¿De qué ladrillos microscópicos estamos hechos los seres vivos?',
      'Preguntas previas: ¿Por qué las hojas de las plantas son verdes y nuestra piel no?'
    ],
    devSuggestions: [
      'Práctica de laboratorio: preparación de muestra de catáfilo de cebolla teñida con azul de metileno o yodo.',
      'Modelado cooperativo en grupos de una célula animal y otra vegetal en cartón con rotulado.',
      'Completar el mapa mental de organelos y sus equivalencias con una fábrica.'
    ],
    closeSuggestions: [
      '"La Feria Microscópica": cada equipo explica su maqueta a los demás.',
      'Metacognición: ¿Qué pasaría si las células vegetales no tuvieran cloroplastos?'
    ],
    evaluations: ['Rúbrica de maqueta y explicación científica', 'Informe de práctica de laboratorio']
  },

  // --- 6TO GRADO PRIMARIA ---
  {
    id: 'ade-6-mat-1',
    grade: '6to Grado',
    cycle: 'Segundo Ciclo',
    level: 'primario_segundo_ciclo',
    area: 'Matemática',
    unitTheme: 'Razones, Proporciones y Porcentajes en Finanzas Básicas',
    period: 'Período 1',
    pedagogicalIntention: 'Calcular razones, proporciones directas y porcentajes (ITBIS, descuentos e intereses simples) aplicados a situaciones del comercio y economía familiar.',
    specificCompetencies: [
      {
        title: 'Modelado y Resolución de Problemas Económicos',
        description: 'Resuelve problemas que involucran cálculo de porcentajes, descuentos comerciales y tasa del ITBIS en transacciones reales.'
      },
      {
        title: 'Razonamiento Crítico y Toma de Decisiones',
        description: 'Evalúa ofertas comerciales y presupuestos identificando la opción financieramente más ventajosa.'
      }
    ],
    conceptualContents: [
      'Concepto de razón y proporción.',
      'Proporcionalidad directa y regla de tres simple.',
      'El porcentaje: concepto de base 100, tanto por ciento y el 18% del ITBIS en República Dominicana.'
    ],
    proceduralContents: [
      'Cálculo del valor final con descuento del 10%, 15%, 25% y 50%.',
      'Lectura de facturas comerciales reconociendo subtotal, ITBIS y total a pagar.',
      'Resolución de situaciones de regla de tres directa en recetas y distancias.'
    ],
    attitudinalContents: [
      'Consumo consciente, ahorro responsable y verificación ética de precios y vueltas.',
      'Valoración de los impuestos para el financiamiento de escuelas y hospitales públicos.'
    ],
    achievementIndicators: [
      'Aplica la propiedad fundamental de las proporciones para hallar incógnitas.',
      'Calcula mentalmente y por escrito porcentajes frecuentes (10%, 25%, 50%).',
      'Determina el costo real con ITBIS y descuentos de productos de la canasta básica.'
    ],
    startSuggestions: [
      'Proyección de un anuncio de "Black Friday": 30% de descuento. ¿Cuánto pagamos realmente por unos tenis de RD$ 2,000?',
      'Análisis de un recibo real de supermercado identificando el renglón del ITBIS.'
    ],
    devSuggestions: [
      'Taller "Diseñando un Emprendimiento Escolar": calcular costos de ingredientes, ganancia deseada e impuestos.',
      'Simulación de compras comparando dos catálogos con diferentes promociones.',
      'Ejercicios en el cuaderno de proporcionalidad directa con regla de tres.'
    ],
    closeSuggestions: [
      'Juego Kahoot o tarjetas relámpago con cálculo mental de porcentajes.',
      'Pregunta metacognitiva: ¿Por qué aprender porcentajes te ayuda a no dejarte engañar en las tiendas?'
    ],
    evaluations: ['Rúbrica de proyectos de educación financiera', 'Prueba escrita de resolución de problemas']
  },
  {
    id: 'ade-6-cs-1',
    grade: '6to Grado',
    cycle: 'Segundo Ciclo',
    level: 'primario_segundo_ciclo',
    area: 'Ciencias Sociales',
    unitTheme: 'La Independencia Dominicana (1844), Juan Pablo Duarte y Los Trinitarios',
    period: 'Período 1',
    pedagogicalIntention: 'Analizar las causas políticas, sociales e ideológicas de la independencia nacional de 1844 valorando el ideario duartiano y la Constitución de San Cristóbal.',
    specificCompetencies: [
      {
        title: 'Pensamiento Crítico y Conciencia Histórica',
        description: 'Examina fuentes primarias y secundarias sobre la dominación haitiana (1822-1844) y la gesta del 27 de febrero de 1844.'
      },
      {
        title: 'Compromiso Ético y Ciudadanía Democrática',
        description: 'Reconoce la vigencia de los valores republicanos de Duarte: justicia social, honestidad y amor patrio.'
      }
    ],
    conceptualContents: [
      'El período de ocupación haitiana (1822-1844): medidas políticas y económicas de Jean Pierre Boyer.',
      'La sociedad secreta La Trinitaria: fundación, juramento y miembros destacados.',
      'La noche del 27 de febrero de 1844 en la Puerta del Conde: el trabucazo de Mella y la proclamación de Sánchez.'
    ],
    proceduralContents: [
      'Construcción de líneas de tiempo históricas con los hitos de 1838 a 1844.',
      'Análisis guiado del Juramento Trinitario y del proyecto de Constitución de Duarte.',
      'Dramatización histórica de las reuniones clandestinas de los trinitarios.'
    ],
    attitudinalContents: [
      'Orgullo por la dominicanidad, los símbolos patrios y el sacrificio de los héroes nacionales.',
      'Respeto por la soberanía nacional y la convivencia pacífica entre los pueblos.'
    ],
    achievementIndicators: [
      'Explica las causas internas y externas que hicieron posible la proclamación de 1844.',
      'Identifica a los Padres de la Patria y las mujeres heroínas (María Trinidad Sánchez, Concepción Bona).',
      'Argumenta con criterio propio sobre la importancia de defender la libertad y la democracia hoy.'
    ],
    startSuggestions: [
      'Audición del Himno a la Bandera o fragmento del Himno Nacional de Emilio Prud-Homme.',
      'Pregunta de apertura: ¿Qué estaban dispuestos a arriesgar muchachos de 25 años por fundar nuestra patria?'
    ],
    devSuggestions: [
      'Lectura comentada en equipos del texto del Juramento Trinitario.',
      'Elaboración en papelógrafo de un cuadro comparativo entre los aportes de Duarte, Sánchez y Mella.',
      'Debate dirigido sobre el papel fundamental de las mujeres en la independencia.'
    ],
    closeSuggestions: [
      'Puesta en común de cartas que los estudiantes le escriben a Duarte contándole cómo está su país hoy.',
      'Pregunta de reflexión: ¿Cómo eres tú un trinitario en tu escuela y con tus compañeros hoy?'
    ],
    evaluations: ['Rúbrica de análisis histórico y debate', 'Línea de tiempo ilustrada']
  }
];

export const GRADES_LIST = [
  '1er Grado',
  '2do Grado',
  '3er Grado',
  '4to Grado',
  '5to Grado',
  '6to Grado'
];

export const PERIODS_LIST = [
  'Todos los Períodos',
  'Período 1',
  'Período 2',
  'Período 3',
  'Período 4'
];
