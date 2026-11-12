import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '.data');
const MIRROR_FILE = path.join(DATA_DIR, 'school_storage_mirror.json');

function readMirrorStore(mirrorFile = MIRROR_FILE): Record<string, any> {
  try {
    if (fs.existsSync(mirrorFile)) {
      const raw = fs.readFileSync(mirrorFile, 'utf-8');
      return JSON.parse(raw) || {};
    }
  } catch (e) {
    console.warn('Error reading mirror store:', e);
  }
  return {};
}

function writeMirrorStore(store: Record<string, any>, mirrorFile = MIRROR_FILE): void {
  try {
    const dataDir = path.dirname(mirrorFile);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(mirrorFile, JSON.stringify(store, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Error writing mirror store:', e);
  }
}

function mergeArrayById<T extends { id?: string }>(existing: T[] = [], incoming: T[] = []): T[] {
  const map = new Map<string, T>();
  existing.forEach((item, idx) => {
    const key = item?.id || `idx_${idx}`;
    map.set(key, item);
  });
  incoming.forEach((item, idx) => {
    const key = item?.id || `in_${idx}`;
    map.set(key, item);
  });
  return Array.from(map.values());
}

interface ServerOptions {
  host?: string;
  port?: number;
  staticDir?: string;
  dataDir?: string;
  production?: boolean;
}

export async function startServer(options: ServerOptions = {}) {
  const app = express();
  const host = options.host ?? process.env.HOST ?? '0.0.0.0';
  const port = options.port ?? Number(process.env.PORT ?? 3000);
  const staticDir = options.staticDir ?? path.join(__dirname, 'dist');
  const dataDir = options.dataDir ?? DATA_DIR;
  const mirrorFile = path.join(dataDir, 'school_storage_mirror.json');

  app.use(express.json({ limit: '15mb' }));

  // --- Server-Side Persistent Storage Mirror (Protects data across compiles & quota limits) ---
  app.get('/api/storage/mirror', (req, res) => {
    const schoolCode = String(req.query.schoolCode || '14668').trim() || '14668';
    const store = readMirrorStore(mirrorFile);
    return res.json({
      schoolCode,
      data: store[schoolCode] || null
    });
  });

  app.post('/api/storage/mirror', (req, res) => {
    const { schoolCode = '14668', payload = {}, forceOverwrite = false } = req.body || {};
    const code = String(schoolCode).trim() || '14668';
    const store = readMirrorStore(mirrorFile);
    const prev = store[code] || {};

    if (forceOverwrite) {
      store[code] = {
        ...prev,
        ...payload,
        updatedAt: new Date().toISOString()
      };
    } else {
      store[code] = {
        config: payload.config ? { ...(prev.config || {}), ...payload.config } : prev.config,
        teachers: Array.isArray(payload.teachers)
          ? mergeArrayById(prev.teachers, payload.teachers)
          : prev.teachers || [],
        coordinators: Array.isArray(payload.coordinators)
          ? mergeArrayById(prev.coordinators, payload.coordinators)
          : prev.coordinators || [],
        orientators: Array.isArray(payload.orientators)
          ? mergeArrayById(prev.orientators, payload.orientators)
          : prev.orientators || [],
        students: Array.isArray(payload.students)
          ? mergeArrayById(prev.students, payload.students)
          : prev.students || [],
        dailyPlans: Array.isArray(payload.dailyPlans)
          ? mergeArrayById(prev.dailyPlans, payload.dailyPlans)
          : prev.dailyPlans || [],
        weeklyPlans: Array.isArray(payload.weeklyPlans)
          ? mergeArrayById(prev.weeklyPlans, payload.weeklyPlans)
          : prev.weeklyPlans || [],
        learningUnits: Array.isArray(payload.learningUnits)
          ? mergeArrayById(prev.learningUnits, payload.learningUnits)
          : prev.learningUnits || [],
        psychologyReports: Array.isArray(payload.psychologyReports)
          ? mergeArrayById(prev.psychologyReports, payload.psychologyReports)
          : prev.psychologyReports || [],
        updatedAt: new Date().toISOString()
      };
    }

    writeMirrorStore(store, mirrorFile);
    return res.json({ ok: true, schoolCode: code, data: store[code] });
  });

  // --- Server-Side Gemini AI Pedagogical Assistant Route ---
  app.post('/api/ai/generate-plan', async (req, res) => {
    const {
      planType = 'daily', // 'daily' | 'weekly' | 'unit'
      level = 'primario_segundo_ciclo',
      grade = '4to Grado',
      area = 'Lengua Española',
      topic = '',
      teacherPrompt = ''
    } = req.body || {};

    const isInicial = level === 'inicial' || String(grade).toLowerCase().includes('kínder') || String(grade).toLowerCase().includes('kinder') || String(grade).toLowerCase().includes('pre-primario') || String(grade).toLowerCase().includes('párvulo');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({
        source: 'fallback',
        data: buildCurricularFallback({ planType, isInicial, grade, area, topic, teacherPrompt })
      });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      if (planType === 'daily') {
        const prompt = `Actúa como un experto asesor pedagógico del Ministerio de Educación de la República Dominicana (MINERD), especialista en la Adecuación Curricular vigente.
Genera una Planificación Diaria de Clases completa, rica, práctica y contextualizada a la realidad escolar dominicana.
- Grado / Curso: ${grade}
- Modalidad: ${isInicial ? 'Nivel Inicial (Rutina Diaria por Momentos y Dominios de Desarrollo, SIN asignaturas)' : `Nivel Primario/Secundario - Área Curricular: ${area}`}
- Tema o Contenido central: ${topic || 'Tema fundamental del grado según la Adecuación Curricular'}
${teacherPrompt ? `- Instrucciones adicionales del docente: ${teacherPrompt}` : ''}

Devuelve exclusivamente el JSON estructurado solicitado.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                unitTheme: { type: Type.STRING },
                pedagogicalIntention: { type: Type.STRING },
                transversalAxis: { type: Type.STRING },
                specificCompetencies: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                contents: {
                  type: Type.OBJECT,
                  properties: {
                    conceptual: { type: Type.ARRAY, items: { type: Type.STRING } },
                    procedural: { type: Type.ARRAY, items: { type: Type.STRING } },
                    attitudinal: { type: Type.ARRAY, items: { type: Type.STRING } }
                  }
                },
                achievementIndicators: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                moments: {
                  type: Type.OBJECT,
                  properties: {
                    startActivities: { type: Type.STRING },
                    developmentActivities: { type: Type.STRING },
                    closeActivities: { type: Type.STRING },
                    metacognitionQuestions: { type: Type.ARRAY, items: { type: Type.STRING } }
                  }
                },
                inicialMoments: {
                  type: Type.OBJECT,
                  properties: {
                    encuentroDeGrupo: { type: Type.STRING },
                    actividadGrupalType: { type: Type.STRING },
                    actividadGrupalContent: { type: Type.STRING },
                    grupoPequeno: { type: Type.STRING },
                    grupoGrande: { type: Type.STRING },
                    juegoTrabajoRincones: { type: Type.STRING },
                    higieneAlimentacionDescanso: { type: Type.STRING }
                  }
                },
                resources: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                evaluationTechniques: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              }
            }
          }
        });

        const parsed = JSON.parse(response.text || '{}');
        return res.json({ source: 'gemini', data: parsed });
      }

      if (planType === 'weekly') {
        const prompt = `Actúa como coordinador pedagógico experto del MINERD (República Dominicana) en la Adecuación Curricular vigente.
Diseña una Matriz de Planificación Semanal de 5 días (Lunes a Viernes) coherente, progresiva y práctica.
- Grado: ${grade}
- Área Curricular: ${area}
- Unidad o Tema Semanal: ${topic || `Secuencia didáctica de ${area} para ${grade}`}
${teacherPrompt ? `- Enfoque solicitado por el docente: ${teacherPrompt}` : ''}

Devuelve exclusivamente el JSON estructurado con la secuencia completa de Lunes a Viernes.`;

        const daySchema = {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            pedagogicalIntention: { type: Type.STRING },
            startActivity: { type: Type.STRING },
            developmentActivity: { type: Type.STRING },
            closeActivity: { type: Type.STRING },
            resources: { type: Type.STRING },
            evaluation: { type: Type.STRING }
          }
        };

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                unitTitle: { type: Type.STRING },
                unitCompetency: { type: Type.STRING },
                achievementIndicators: { type: Type.ARRAY, items: { type: Type.STRING } },
                days: {
                  type: Type.OBJECT,
                  properties: {
                    lunes: daySchema,
                    martes: daySchema,
                    miercoles: daySchema,
                    jueves: daySchema,
                    viernes: daySchema
                  }
                }
              }
            }
          }
        });

        const parsed = JSON.parse(response.text || '{}');
        return res.json({ source: 'gemini', data: parsed });
      }

      // planType === 'unit'
      const prompt = `Actúa como especialista en Diseño y Adecuación Curricular del MINERD (República Dominicana).
Diseña una Unidad de Aprendizaje completa y rigurosa para el docente.
- Grado / Curso: ${grade}
- Modalidad: ${isInicial ? 'Nivel Inicial (Organizada por Dominios de Desarrollo y Cuadro de Anticipación)' : `Nivel Primario/Secundario - Área Curricular: ${area}`}
- Título o Eje Temático de la Unidad: ${topic || `Proyecto de Aprendizaje de ${isInicial ? 'Nivel Inicial' : area} (${grade})`}
${teacherPrompt ? `- Contexto o necesidad del aula: ${teacherPrompt}` : ''}

Incluye una Situación de Aprendizaje contextualizada a un centro educativo dominicano (punto de partida, reto, estrategia y producto final), competencias específicas, contenidos (conceptuales, procedimentales y actitudinales), indicadores de logro, resumen de secuencia didáctica por semanas, y si es Nivel Inicial, el Cuadro de Anticipación completo.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              learningSituation: { type: Type.STRING },
              teachingStrategy: { type: Type.STRING },
              transversalAxis: { type: Type.STRING },
              specificCompetencies: { type: Type.ARRAY, items: { type: Type.STRING } },
              contents: {
                type: Type.OBJECT,
                properties: {
                  conceptual: { type: Type.ARRAY, items: { type: Type.STRING } },
                  procedural: { type: Type.ARRAY, items: { type: Type.STRING } },
                  attitudinal: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              },
              achievementIndicators: { type: Type.ARRAY, items: { type: Type.STRING } },
              didacticalSequenceSummary: { type: Type.STRING },
              evaluationInstruments: { type: Type.ARRAY, items: { type: Type.STRING } },
              resources: { type: Type.ARRAY, items: { type: Type.STRING } },
              inicialData: {
                type: Type.OBJECT,
                properties: {
                  themeSelection: { type: Type.STRING },
                  whatTheyKnow: { type: Type.ARRAY, items: { type: Type.STRING } },
                  whatTheyWantToKnow: { type: Type.ARRAY, items: { type: Type.STRING } },
                  howTheyWillLearn: { type: Type.ARRAY, items: { type: Type.STRING } },
                  learningZonesResources: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            }
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({ source: 'gemini', data: parsed });
    } catch (error) {
      console.error('Error calling Gemini API, using structured curricular fallback:', error);
      return res.status(200).json({
        source: 'fallback',
        data: buildCurricularFallback({ planType, isInicial, grade, area, topic, teacherPrompt })
      });
    }
  });

  if (!options.production && process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(staticDir));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(staticDir, 'index.html'));
    });
  }

  const server = app.listen(port, host);
  await new Promise<void>((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });

  const address = server.address();
  const listeningPort = address && typeof address !== 'string' ? address.port : port;
  console.log(`Server running on http://${host}:${listeningPort}`);
  return server;
}

function buildCurricularFallback(params: {
  planType: string;
  isInicial: boolean;
  grade: string;
  area: string;
  topic: string;
  teacherPrompt?: string;
}) {
  const { planType, isInicial, grade, area, topic } = params;
  const cleanTopic = topic?.trim() || (isInicial ? 'Explorando nuestra comunidad y naturaleza' : `Aplicación práctica de ${area} en nuestro entorno`);

  if (planType === 'daily') {
    return {
      unitTheme: cleanTopic,
      pedagogicalIntention: isInicial
        ? `Propiciar experiencias lúdicas y sensoriales en los niños y niñas de ${grade} sobre "${cleanTopic}", fortaleciendo su expresión oral, convivencia armónica y autonomía.`
        : `Comprender y aplicar los conceptos fundamentales de "${cleanTopic}" en ${area} (${grade}), resolviendo situaciones prácticas del contexto escolar y comunitario según la Adecuación Curricular.`,
      transversalAxis: 'Ciudadanía y Convivencia (Cultura de Paz y Deberes/Derechos)',
      specificCompetencies: isInicial
        ? [
            `Comunica sus ideas, emociones y descubrimientos sobre ${cleanTopic} mediante el lenguaje oral, gestual y plástico.`,
            `Interactúa de manera cooperativa con sus pares en los rincones de juego-trabajo respetando turnos y acuerdos.`
          ]
        : [
            `Comprende y analiza informaciones y conceptos clave relacionados con ${cleanTopic} en situaciones reales de ${grade}.`,
            `Produce soluciones y evidencias prácticas aplicando los procedimientos propios de ${area} con pensamiento crítico y creativo.`
          ],
      contents: {
        conceptual: [
          `Concepto, características y elementos esenciales de: ${cleanTopic}.`,
          `Importancia y aplicación de ${cleanTopic} en la vida cotidiana escolar y familiar.`
        ],
        procedural: [
          `Observación guiada, indagación dialógica y análisis de casos prácticos sobre ${cleanTopic}.`,
          `Trabajo colaborativo en equipos para elaborar producciones y socializar hallazgos en el aula.`
        ],
        attitudinal: [
          'Participación activa, entusiasmo y respeto a las opiniones de sus compañeros.',
          'Responsabilidad, orden y valoración del aprendizaje colaborativo.'
        ]
      },
      achievementIndicators: [
        `Identifica y explica con sus propias palabras las características principales de ${cleanTopic}.`,
        `Realiza las actividades prácticas propuestas sobre ${cleanTopic} demostrando dominio y autonomía acorde a ${grade}.`,
        'Colabora activamente con su equipo respetando las normas de convivencia del aula.'
      ],
      moments: {
        startActivities: `Saludo afectivo, pase de asistencia y retroalimentación de la clase anterior. Exploración de saberes previos mediante lluvia de ideas y preguntas detonadoras sobre "${cleanTopic}". Presentación clara de la intención pedagógica del día.`,
        developmentActivities: `1. Socialización guiada por el docente utilizando recursos visuales y ejemplos del entorno dominicano sobre "${cleanTopic}".\n2. Actividad práctica en equipos colaborativos donde los estudiantes de ${grade} analizan, construyen o resuelven ejercicios guiados en sus cuadernos.\n3. Acompañamiento diferenciado del docente por las mesas de trabajo y puesta en común en plenaria.`,
        closeActivities: `Síntesis colectiva de los aprendizajes logrados. Evaluación formativa rápida mediante preguntas orales y revisión de producciones. Asignación de extensión para compartir en familia.`,
        metacognitionQuestions: [
          `¿Qué aprendimos hoy sobre ${cleanTopic}?`,
          '¿Cómo lo aprendimos y qué pasos nos resultaron más útiles?',
          '¿Para qué nos sirve este aprendizaje en nuestra vida diaria?'
        ]
      },
      inicialMoments: {
        encuentroDeGrupo: `Bienvenida con canción infantil, actualización de carteles fijos (asistencia, calendario y estado del tiempo). Diálogo en semicírculo mostrando objetos e imágenes sobre "${cleanTopic}" para despertar el asombro de los niños de ${grade}.`,
        actividadGrupalType: 'Expresión Plástica',
        actividadGrupalContent: `Experiencia artística y sensorial: creación colectiva con pintura dactilar, papel crepé y materiales del medio inspirada en "${cleanTopic}".`,
        grupoPequeno: `En una mesa con 5 niños, la docente guía la exploración directa de tarjetas, conteo y clasificación de elementos relacionados con "${cleanTopic}", apoyando el lenguaje y el trazo inicial.`,
        grupoGrande: `El resto del grupo modela figuras alusivas a "${cleanTopic}" con masilla y bloques de construcción en sus mesas, compartiendo materiales en armonía.`,
        juegoTrabajoRincones: 'Planificación (los niños eligen a qué zona ir: Dramatización, Construcción, Arte o Biblioteca), Desarrollo libre del juego, Orden y limpieza con canción, y Socialización de lo realizado.',
        higieneAlimentacionDescanso: 'Lavado correcto de manos en fila haciendo uso racional del agua, bendición y consumo de la merienda escolar practicando normas de cortesía, y descanso reparador.'
      },
      resources: ['Pizarra y marcadores', 'Láminas ilustrativas y recursos del medio', 'Cuadernos de trabajo y lápices de colores', 'Fascículo de la Adecuación Curricular MINERD'],
      evaluationTechniques: ['Lista de cotejo', 'Observación sistemática', 'Producciones de los estudiantes']
    };
  }

  if (planType === 'weekly') {
    return {
      unitTitle: cleanTopic,
      unitCompetency: `Desarrolla competencias integrales en ${area} (${grade}) a través del estudio y aplicación práctica de "${cleanTopic}", integrando el trabajo cooperativo y la resolución de problemas del entorno.`,
      achievementIndicators: [
        `Identifica los conceptos fundamentales de ${cleanTopic} en diversos contextos.`,
        `Aplica procedimientos de ${area} para resolver ejercicios y proyectos sobre ${cleanTopic}.`,
        `Expresa y expone con claridad sus producciones semanales respetando a sus compañeros.`
      ],
      days: {
        lunes: {
          topic: `Exploración e introducción a: ${cleanTopic}`,
          pedagogicalIntention: `Explorar los saberes previos y comprender los conceptos básicos de ${cleanTopic}.`,
          startActivity: 'Dinámica de motivación, presentación de lámina detonadora y lluvia de ideas en la pizarra.',
          developmentActivity: `Explicación interactiva de los conceptos esenciales de ${cleanTopic} y elaboración de un mapa conceptual en el cuaderno.`,
          closeActivity: 'Puesta en común de los conceptos aprendidos y pregunta metacognitiva del día.',
          resources: 'Pizarra, marcadores, láminas y cuadernos',
          evaluation: 'Registro de participación y revisión de cuadernos'
        },
        martes: {
          topic: `Características y estructura de ${cleanTopic}`,
          pedagogicalIntention: `Analizar los elementos y procedimientos que componen ${cleanTopic} en ${area}.`,
          startActivity: 'Retroalimentación dinámica de la clase del lunes mediante el juego "La Pelota Preguntona".',
          developmentActivity: `Trabajo en parejas para identificar y clasificar los elementos principales de ${cleanTopic} usando guías impresas.`,
          closeActivity: 'Socialización de respuestas en la pizarra y coevaluación entre compañeros.',
          resources: 'Guía impresa, libros de texto MINERD y lápices',
          evaluation: 'Lista de cotejo de trabajo en parejas'
        },
        miercoles: {
          topic: `Taller práctico de aplicación sobre ${cleanTopic}`,
          pedagogicalIntention: `Aplicar de forma práctica los procedimientos aprendidos sobre ${cleanTopic} en situaciones reales.`,
          startActivity: 'Breve repaso práctico y presentación del reto del día en equipos.',
          developmentActivity: `Taller colaborativo: resolución de ejercicios, casos o creación de borradores sobre ${cleanTopic} con acompañamiento docente.`,
          closeActivity: 'Presentación preliminar de los avances de cada equipo y retroalimentación formativa.',
          resources: 'Papelógrafo, marcadores, materiales concretos y fascículo',
          evaluation: 'Escala estimativa de desempeño práctico'
        },
        jueves: {
          topic: `Producción creativa y profundización en ${cleanTopic}`,
          pedagogicalIntention: `Elaborar producciones propias que evidencien el dominio de ${cleanTopic} en ${grade}.`,
          startActivity: 'Activación con acertijo o situación problematizadora vinculada al tema.',
          developmentActivity: `Elaboración final de la producción o proyecto corto sobre ${cleanTopic}, cuidando el orden, la creatividad y la precisión.`,
          closeActivity: 'Revisión guiada de las producciones mediante criterios de calidad.',
          resources: 'Cartulinas, colores, reglas y recursos del entorno',
          evaluation: 'Rúbrica de producción estudiantil'
        },
        viernes: {
          topic: `Socialización, evaluación formativa y cierre de la semana`,
          pedagogicalIntention: `Socializar los aprendizajes alcanzados durante la semana sobre ${cleanTopic} y valorar los logros.`,
          startActivity: 'Organización del aula en semicírculo y repaso general de la semana.',
          developmentActivity: `Exposición breve por equipos de sus trabajos sobre ${cleanTopic} y ejercicio integrador de comprobación.`,
          closeActivity: 'Autoevaluación estudiantil, felicitación por los logros de la semana y cierre reflexivo.',
          resources: 'Mural del aula, portafolio y rúbrica',
          evaluation: 'Rúbrica de exposición y portafolio semanal'
        }
      }
    };
  }

  // unit fallback
  return {
    title: cleanTopic,
    learningSituation: `En el centro educativo, los estudiantes de ${grade} han mostrado gran curiosidad e interés por comprender cómo influye "${cleanTopic}" en su vida cotidiana y en su comunidad. Ante esta necesidad formativa, mediante la estrategia de indagación dialógica y aprendizaje basado en proyectos, investigaremos, analizaremos y realizaremos talleres prácticos en ${isInicial ? 'los rincones de juego-trabajo' : `el área de ${area}`}, culminando con una feria y exposición escolar donde presentarán sus producciones y soluciones a toda la comunidad educativa.`,
    teachingStrategy: isInicial ? 'El Juego-Trabajo y Centros de Interés' : 'Aprendizaje Basado en Proyectos (ABP)',
    transversalAxis: 'Desarrollo Sostenible (Medioambiente y Gestión de Riesgos)',
    specificCompetencies: isInicial
      ? [
          `Expresa sus ideas, sentimientos y experiencias sobre ${cleanTopic} a través de múltiples lenguajes.`,
          `Descubre características de su entorno natural y social participando con entusiasmo en actividades de indagación.`,
          `Convive de forma armónica respetando acuerdos y normas en el aula.`
        ]
      : [
          `Comunicativa: Comprende y expresa ideas, conceptos y producciones sobre ${cleanTopic} con claridad y coherencia en ${grade}.`,
          `Pensamiento Lógico, Creativo y Crítico: Analiza situaciones y resuelve problemas vinculados a ${cleanTopic} aplicando conocimientos de ${area}.`,
          `Ética y Ciudadana: Trabaja de manera colaborativa aportando soluciones positivas para su escuela y comunidad.`
        ],
    contents: {
      conceptual: [
        `Fundamentos, definición y características de: ${cleanTopic}.`,
        `Elementos principales y clasificación dentro de ${isInicial ? 'su entorno cercano' : area}.`,
        `Relación de ${cleanTopic} con la comunidad y la vida diaria.`
      ],
      procedural: [
        `Indagación de saberes previos y formulación de preguntas sobre ${cleanTopic}.`,
        `Realización de actividades prácticas, lecturas guiadas y ejercicios colaborativos en ${grade}.`,
        `Elaboración y presentación del producto final de la unidad ante sus compañeros.`
      ],
      attitudinal: [
        'Curiosidad, apertura e interés por aprender y descubrir nuevos conocimientos.',
        'Respeto, empatía y colaboración en el trabajo en equipo.',
        'Valoración del esfuerzo propio y el de sus compañeros.'
      ]
    },
    achievementIndicators: [
      `Identifica con precisión los conceptos esenciales sobre ${cleanTopic} trabajados en la unidad.`,
      `Aplica los procedimientos aprendidos en ${isInicial ? 'la rutina diaria' : area} para crear producciones originales.`,
      `Demuestra actitudes de respeto, cooperación y responsabilidad durante el desarrollo de la unidad.`
    ],
    didacticalSequenceSummary: `Semana 1: Exploración de saberes previos, presentación de la Situación de Aprendizaje y conceptualización de "${cleanTopic}".\nSemana 2: Investigación guiada, talleres prácticos en equipos y desarrollo de actividades procedimentales.\nSemana 3: Elaboración de producciones, revisión formativa y preparación de recursos.\nSemana 4: Presentación del producto final, evaluación integral (autoevaluación, coevaluación y heteroevaluación) y metacognición.`,
    evaluationInstruments: ['Rúbrica analítica', 'Lista de cotejo', 'Portafolio de evidencias', 'Observación sistemática'],
    resources: ['Fascículos de la Adecuación Curricular MINERD', 'Pizarra, cartulinas y marcadores', 'Recursos manipulativos del entorno', 'Tecnología educativa / Audiovisuales'],
    inicialData: {
      themeSelection: cleanTopic,
      whatTheyKnow: [
        `Han visto elementos relacionados con ${cleanTopic} en su casa y camino a la escuela.`,
        'Reconocen colores, formas y nombres básicos asociados al tema.'
      ],
      whatTheyWantToKnow: [
        `¿Cómo funciona ${cleanTopic} y por qué es importante?`,
        '¿Cómo podemos construirlo o representarlo en nuestra aula?'
      ],
      howTheyWillLearn: [
        'Observando láminas, videos infantiles y explorando el patio escolar.',
        'Cantando canciones, escuchando cuentos y creando un mural artístico con pintura y collage.',
        'Jugando en las zonas de construcción, dramatización y biblioteca.'
      ],
      learningZonesResources: [
        'Zona de Arte: témperas, pinceles, hojas recicladas, masilla y papel crepé.',
        'Zona de Biblioteca: cuentos ilustrados, tarjetas de vocabulario y títeres.',
        'Zona de Construcción: bloques de madera, cajas decoradas y figuras geométricas.'
      ]
    }
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  startServer().catch((error) => {
    console.error('No se pudo iniciar el servidor de la aplicación:', error);
    process.exitCode = 1;
  });
}
