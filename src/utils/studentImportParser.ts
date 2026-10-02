import * as XLSX from 'xlsx';
import { Student, SchoolShift } from '../types/minerd';
import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker if available or disable worker for direct in-browser extraction
if (typeof window !== 'undefined' && 'Worker' in window) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.0.379'}/pdf.worker.min.mjs`;
  } catch {
    // Fallback
  }
}

export interface ParsedStudentCandidate {
  number?: number;
  name: string;
  gender?: 'M' | 'F' | 'Masculino' | 'Femenino';
  rne?: string;
  parentName?: string;
  parentPhone?: string;
  grade?: string;
  section?: string;
  shift?: SchoolShift;
}

/**
 * Parses an Excel or CSV file buffer and extracts student records
 */
export function parseStudentsFromExcel(
  dataBuffer: ArrayBuffer,
  defaultGrade: string = '1er Grado',
  defaultSection: string = 'A',
  defaultShift: SchoolShift = 'Tanda Matutina (8:00 AM - 12:00 PM)'
): ParsedStudentCandidate[] {
  const workbook = XLSX.read(dataBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // Convert to JSON array of objects
  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  if (!rawRows || rawRows.length === 0) return [];

  const candidates: ParsedStudentCandidate[] = [];

  // Find header row or analyze columns
  let headerIndex = -1;
  let nameCol = -1;
  let numberCol = -1;
  let rneCol = -1;
  let genderCol = -1;
  let parentCol = -1;
  let phoneCol = -1;
  let gradeCol = -1;
  let sectionCol = -1;

  for (let r = 0; r < Math.min(rawRows.length, 10); r++) {
    const row = rawRows[r];
    if (Array.isArray(row)) {
      row.forEach((cellVal: any, colIdx: number) => {
        const str = String(cellVal).trim().toLowerCase();
        if (str.includes('nombre') || str.includes('estudiante') || str.includes('alumno') || str.includes('nombres y apellidos')) {
          nameCol = colIdx;
          headerIndex = r;
        }
        if (str === 'no.' || str === 'no' || str === '#' || str.includes('numero') || str.includes('orden')) {
          numberCol = colIdx;
        }
        if (str.includes('rne') || str.includes('matricula') || str.includes('cedula') || str.includes('id')) {
          rneCol = colIdx;
        }
        if (str.includes('sexo') || str.includes('genero') || str === 's' || str === 'g') {
          genderCol = colIdx;
        }
        if (str.includes('padre') || str.includes('tutor') || str.includes('madre') || str.includes('representante')) {
          parentCol = colIdx;
        }
        if (str.includes('telefono') || str.includes('celular') || str.includes('contacto') || str.includes('whatsapp') || str.includes('tel')) {
          phoneCol = colIdx;
        }
        if (str.includes('grado') || str.includes('curso')) {
          gradeCol = colIdx;
        }
        if (str.includes('seccion') || str.includes('sección') || str === 'sec') {
          sectionCol = colIdx;
        }
      });
      if (nameCol >= 0) break;
    }
  }

  const startRow = headerIndex >= 0 ? headerIndex + 1 : 0;

  for (let r = startRow; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!Array.isArray(row) || row.length === 0) continue;

    let candidateName = '';
    let candidateNumber: number | undefined;
    let candidateRne = '';
    let candidateGender: 'M' | 'F' | undefined;
    let candidateParent = '';
    let candidatePhone = '';
    let candidateGrade = defaultGrade;
    let candidateSection = defaultSection;

    if (nameCol >= 0 && row[nameCol]) {
      candidateName = String(row[nameCol]).trim();
    } else {
      // Look for the longest text string in the row that resembles a person's name
      for (const cell of row) {
        const val = String(cell).trim();
        if (val.length > 3 && isNaN(Number(val)) && !val.includes('@') && !val.toLowerCase().includes('total')) {
          candidateName = val;
          break;
        }
      }
    }

    // Skip empty or header-like entries
    if (!candidateName || candidateName.length < 2 || candidateName.toLowerCase().includes('total estudiantes') || candidateName.toLowerCase().includes('firma')) {
      continue;
    }

    if (numberCol >= 0 && row[numberCol] && !isNaN(Number(row[numberCol]))) {
      candidateNumber = Number(row[numberCol]);
    } else {
      candidateNumber = candidates.length + 1;
    }

    if (rneCol >= 0 && row[rneCol]) {
      candidateRne = String(row[rneCol]).trim();
    }

    if (genderCol >= 0 && row[genderCol]) {
      const gStr = String(row[genderCol]).trim().toUpperCase();
      if (gStr.startsWith('M') || gStr === '1') candidateGender = 'M';
      else if (gStr.startsWith('F') || gStr === '2') candidateGender = 'F';
    }

    if (parentCol >= 0 && row[parentCol]) {
      candidateParent = String(row[parentCol]).trim();
    }

    if (phoneCol >= 0 && row[phoneCol]) {
      candidatePhone = String(row[phoneCol]).trim();
    }

    if (gradeCol >= 0 && row[gradeCol]) {
      const g = String(row[gradeCol]).trim();
      if (g) candidateGrade = g;
    }

    if (sectionCol >= 0 && row[sectionCol]) {
      const s = String(row[sectionCol]).trim().toUpperCase();
      if (s) candidateSection = s;
    }

    candidates.push({
      number: candidateNumber,
      name: candidateName,
      gender: candidateGender,
      rne: candidateRne || `RNE-${Math.floor(100000 + Math.random() * 900000)}`,
      parentName: candidateParent,
      parentPhone: candidatePhone,
      grade: candidateGrade,
      section: candidateSection,
      shift: defaultShift
    });
  }

  return candidates;
}

/**
 * Parses PDF text extracting student lines (supports MINERD SIGERD class lists)
 */
export async function parseStudentsFromPdf(
  pdfBuffer: ArrayBuffer,
  defaultGrade: string = '1er Grado',
  defaultSection: string = 'A',
  defaultShift: SchoolShift = 'Tanda Matutina (8:00 AM - 12:00 PM)'
): Promise<ParsedStudentCandidate[]> {
  try {
    const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer });
    const pdfDoc = await loadingTask.promise;
    let fullTextLines: string[] = [];

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const items = textContent.items as any[];
      
      // Group items roughly by line or collect strings
      let currentLine = '';
      let lastY: number | null = null;

      for (const item of items) {
        if (!item.str) continue;
        if (lastY === null || Math.abs(item.transform[5] - lastY) > 5) {
          if (currentLine.trim()) {
            fullTextLines.push(currentLine.trim());
          }
          currentLine = item.str;
          lastY = item.transform[5];
        } else {
          currentLine += ' ' + item.str;
        }
      }
      if (currentLine.trim()) {
        fullTextLines.push(currentLine.trim());
      }
    }

    // Process extracted lines
    return parseStudentsFromText(fullTextLines.join('\n'), defaultGrade, defaultSection, defaultShift);
  } catch (err) {
    console.error('Error parsing PDF for student roster', err);
    return [];
  }
}

/**
 * Parses raw text copied and pasted from Word, Excel, or WhatsApp
 */
export function parseStudentsFromText(
  rawText: string,
  defaultGrade: string = '1er Grado',
  defaultSection: string = 'A',
  defaultShift: SchoolShift = 'Tanda Matutina (8:00 AM - 12:00 PM)'
): ParsedStudentCandidate[] {
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const candidates: ParsedStudentCandidate[] = [];

  const ignoreWords = [
    'ministerio de educacion', 'minerd', 'distrito', 'regional', 'escuela', 
    'centro educativo', 'listado de estudiantes', 'matricula', 'nomina',
    'profesor', 'maestro', 'ano escolar', 'tanda', 'total', 'firma', 'pagina'
  ];

  let orderCounter = 1;

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (ignoreWords.some(w => lower.includes(w))) continue;

    // Pattern 1: Numbered like "1. Juan Perez" or "1 - Maria Santos" or "01. Gomez Perez, Ana"
    const numberedMatch = line.match(/^(\d{1,3})[\s.\-–)]+(.+)$/);
    let nameStr = line;
    let orderNum = orderCounter;

    if (numberedMatch) {
      orderNum = parseInt(numberedMatch[1], 10) || orderCounter;
      nameStr = numberedMatch[2].trim();
    }

    // Pattern 2: Tab or comma separated with RNE, Phone, etc.
    const parts = nameStr.split(/[\t,|;]+/).map(p => p.trim()).filter(Boolean);
    let cleanName = parts[0];
    let candidateRne = '';
    let candidateGender: 'M' | 'F' | undefined;
    let candidatePhone = '';
    let candidateParent = '';

    if (parts.length > 1) {
      for (let i = 1; i < parts.length; i++) {
        const p = parts[i];
        if (p.toUpperCase() === 'M' || p.toUpperCase() === 'F') {
          candidateGender = p.toUpperCase() as 'M' | 'F';
        } else if (/\d{3}[-\s]?\d{3}[-\s]?\d{4}/.test(p) || /^\d{8,12}$/.test(p)) {
          candidatePhone = p;
        } else if (/^[A-Z0-9-]{6,15}$/i.test(p)) {
          candidateRne = p;
        } else if (p.length > 3 && isNaN(Number(p))) {
          candidateParent = p;
        }
      }
    }

    // Clean up name
    cleanName = cleanName.replace(/^\d+[\s.-]*/, '').trim();

    if (cleanName.length >= 3 && isNaN(Number(cleanName))) {
      candidates.push({
        number: orderNum,
        name: cleanName,
        gender: candidateGender,
        rne: candidateRne || `RNE-${Math.floor(100000 + Math.random() * 900000)}`,
        parentName: candidateParent,
        parentPhone: candidatePhone,
        grade: defaultGrade,
        section: defaultSection,
        shift: defaultShift
      });
      orderCounter++;
    }
  }

  return candidates;
}

/**
 * Generates an Excel template file and triggers browser download
 */
export function downloadExcelTemplate(): void {
  const headers = [
    'No.',
    'Nombre Completo del Estudiante',
    'Sexo (M/F)',
    'RNE (Matrícula)',
    'Grado',
    'Sección',
    'Nombre del Padre o Tutor',
    'Teléfono WhatsApp del Tutor',
    'Notas / Alergias'
  ];

  const sampleRows = [
    [1, 'Almonte González, Kevin Alexander', 'M', 'RNE-2025-001', '4to Grado', 'A', 'Dania González (Madre)', '809-555-0111', 'Ninguna'],
    [2, 'Batista Rosario, Camila Sofía', 'F', 'RNE-2025-002', '4to Grado', 'A', 'Carlos Batista (Padre)', '829-555-0122', 'Acompañamiento lectoescritura'],
    [3, 'Castillo Peña, Ángel David', 'M', 'RNE-2025-003', '4to Grado', 'A', 'Rosa Peña (Madre)', '849-555-0133', 'Participativo en matemáticas'],
    [4, 'Díaz Méndez, Valentina María', 'F', 'RNE-2025-004', '4to Grado', 'A', 'Marcos Díaz (Padre)', '809-555-0144', 'Excelente asistencia'],
    [5, 'Encarnación Ruiz, Samuel Elías', 'M', 'RNE-2025-005', '4to Grado', 'A', 'Elena Ruiz (Madre)', '829-555-0155', 'Requiere refuerzo ortografía']
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);

  // Adjust column widths
  ws['!cols'] = [
    { wch: 6 },
    { wch: 38 },
    { wch: 12 },
    { wch: 16 },
    { wch: 14 },
    { wch: 10 },
    { wch: 28 },
    { wch: 24 },
    { wch: 32 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Matrícula Estudiantil');

  XLSX.writeFile(wb, 'Plantilla_Matricula_Estudiantes_MINERD.xlsx');
}
