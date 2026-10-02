import * as XLSX from 'xlsx';
import { Teacher, TeacherLevel, SubjectArea, SchoolShift } from '../types/minerd';

export interface ParsedTeacherRow {
  rowNumber: number;
  idCard: string;
  name: string;
  phone: string;
  email: string;
  level: TeacherLevel | string;
  grades: string[];
  sections: string[];
  shift: SchoolShift;
  notes?: string;
  isValid: boolean;
  errors: string[];
}

export interface ImportResult {
  teachers: Teacher[];
  parsedRows: ParsedTeacherRow[];
  totalRows: number;
  validCount: number;
  invalidCount: number;
}

export function mapStringToTeacherLevel(raw: string): TeacherLevel {
  const clean = raw.toLowerCase().trim();
  if (clean.includes('auxiliar') || clean.includes('apoyo') || clean.includes('asistente')) {
    return 'Auxiliar';
  }
  if (clean.includes('inicial') || clean.includes('pre-primario') || clean.includes('kinder') || clean.includes('párvulo')) {
    return 'Nivel Inicial';
  }
  if (clean.includes('segundo ciclo') || clean.includes('2do ciclo') || clean.includes('4to') || clean.includes('5to') || clean.includes('6to')) {
    return 'Nivel Primario Segundo Ciclo';
  }
  if (clean.includes('primer ciclo') || clean.includes('1er ciclo') || clean.includes('1ro') || clean.includes('2do') || clean.includes('3ro')) {
    return 'Nivel Primario Primer Ciclo';
  }
  if (clean.includes('secundar') || clean.includes('bachiller') || clean.includes('media') || clean.includes('politecnico') || clean.includes('politécnico')) {
    return 'Secundaria';
  }
  return 'Nivel Primario Primer Ciclo';
}

export function parseRawPastedText(text: string): ImportResult {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) {
    return { teachers: [], parsedRows: [], totalRows: 0, validCount: 0, invalidCount: 0 };
  }

  // Detect delimiter: tab (Excel copy/paste) or comma / semicolon
  const firstLine = lines[0];
  const delimiter = firstLine.includes('\t') ? '\t' : (firstLine.includes(';') ? ';' : ',');

  const rows: string[][] = lines.map(line => line.split(delimiter).map(cell => cell.trim().replace(/^["']|["']$/g, '')));

  // Check if first row is header
  const hasHeader = rows[0].some(cell => 
    /nombre|cedula|cédula|telefono|teléfono|whatsapp|grado|seccion|sección|nivel|ciclo|cargo|tanda|correo/i.test(cell)
  );

  const dataRows = hasHeader ? rows.slice(1) : rows;
  const headerRow = hasHeader ? rows[0].map(h => h.toLowerCase()) : [];

  return processMatrixRows(dataRows, headerRow);
}

export async function parseExcelFile(file: File): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert sheet to array of arrays
        const rawRows = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1, defval: '' });
        const cleanRows = rawRows.filter(r => r.some(c => String(c).trim().length > 0));

        if (cleanRows.length === 0) {
          resolve({ teachers: [], parsedRows: [], totalRows: 0, validCount: 0, invalidCount: 0 });
          return;
        }

        const firstRow = cleanRows[0].map(c => String(c).trim());
        const hasHeader = firstRow.some(cell => 
          /nombre|cedula|cédula|telefono|teléfono|whatsapp|grado|seccion|sección|nivel|ciclo|cargo|tanda|correo/i.test(cell)
        );

        const dataRows = (hasHeader ? cleanRows.slice(1) : cleanRows).map(row => row.map(c => String(c).trim()));
        const headerRow = hasHeader ? firstRow.map(h => h.toLowerCase()) : [];

        resolve(processMatrixRows(dataRows, headerRow));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

function processMatrixRows(dataRows: string[][], headerRow: string[]): ImportResult {
  const parsedRows: ParsedTeacherRow[] = [];
  const teachers: Teacher[] = [];

  // Determine column indexes if headers exist
  let colName = 0;
  let colIdCard = 1;
  let colPhone = 2;
  let colLevel = 3;
  let colGrade = 4;
  let colSection = 5;
  let colShift = 6;
  let colEmail = 7;

  if (headerRow.length > 0) {
    headerRow.forEach((h, idx) => {
      if (/nombre|maestro|docente|profesor/i.test(h)) colName = idx;
      else if (/cedula|cédula|id|identificacion/i.test(h)) colIdCard = idx;
      else if (/telefono|teléfono|whatsapp|celular|movil|móvil/i.test(h)) colPhone = idx;
      else if (/nivel|ciclo|cargo|categoria|categoría/i.test(h)) colLevel = idx;
      else if (/grado|curso/i.test(h)) colGrade = idx;
      else if (/seccion|sección|secc/i.test(h)) colSection = idx;
      else if (/tanda|jornada|horario/i.test(h)) colShift = idx;
      else if (/correo|email|e-mail/i.test(h)) colEmail = idx;
    });
  }

  dataRows.forEach((row, idx) => {
    if (!row || row.every(c => !c || c.trim() === '')) return;

    const rowNumber = idx + 1;
    const errors: string[] = [];

    const rawName = row[colName] || row[0] || '';
    const rawIdCard = row[colIdCard] || row[1] || '';
    const rawPhone = row[colPhone] || row[2] || '';
    const rawLevel = row[colLevel] || row[3] || 'Nivel Primario Primer Ciclo';
    const rawGrade = row[colGrade] || row[4] || '1er Grado';
    const rawSection = row[colSection] || row[5] || 'A';
    const rawShift = row[colShift] || row[6] || 'Ambas Tandas (Doble Tanda)';
    const rawEmail = row[colEmail] || row[7] || '';

    if (!rawName.trim()) {
      errors.push('El nombre del docente es obligatorio');
    }

    const name = rawName.trim();
    const idCard = rawIdCard.trim() || `001-${Math.floor(1000000 + Math.random() * 9000000)}-${Math.floor(Math.random() * 9)}`;
    const phone = rawPhone.trim() || '';
    const email = rawEmail.trim() || `${name.toLowerCase().replace(/[^a-z]/g, '')}@minerd.edu.do`;
    const level = mapStringToTeacherLevel(rawLevel);
    
    // Split multiple grades if comma separated
    const grades = rawGrade.split(/[,;/]/).map(g => g.trim()).filter(Boolean);
    const finalGrades = grades.length > 0 ? grades : ['1er Grado'];

    // Split multiple sections
    const sections = rawSection.split(/[,;/]/).map(s => s.trim().toUpperCase()).filter(Boolean);
    const finalSections = sections.length > 0 ? sections : ['A'];

    let shift: SchoolShift = 'Ambas Tandas (Doble Tanda)';
    if (/matutin/i.test(rawShift)) shift = 'Tanda Matutina (8:00 AM - 12:00 PM)';
    else if (/vespertin/i.test(rawShift)) shift = 'Tanda Vespertina (1:00 PM - 4:45 PM)';
    else if (/ambas|doble/i.test(rawShift)) shift = 'Ambas Tandas (Doble Tanda)';

    const isValid = errors.length === 0;

    const parsedRow: ParsedTeacherRow = {
      rowNumber,
      idCard,
      name,
      phone,
      email,
      level,
      grades: finalGrades,
      sections: finalSections,
      shift,
      isValid,
      errors
    };

    parsedRows.push(parsedRow);

    if (isValid) {
      teachers.push({
        id: `tch-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
        idCard,
        name,
        phone,
        email,
        level,
        grades: finalGrades,
        sections: finalSections,
        shift,
        status: 'active'
      });
    }
  });

  return {
    teachers,
    parsedRows,
    totalRows: parsedRows.length,
    validCount: teachers.length,
    invalidCount: parsedRows.length - teachers.length
  };
}

export function generateTemplateExcelWorkbook(): void {
  const sampleData = [
    {
      'Nombre Completo': 'Prof. Carmen Altagracia Rosario',
      'Cédula': '001-1827364-5',
      'WhatsApp / Teléfono': '809-555-0101',
      'Nivel / Ciclo / Cargo': 'Nivel Primario Primer Ciclo',
      'Grado(s)': '1er Grado, 2do Grado',
      'Sección(es)': 'A, B',
      'Tanda': 'Ambas Tandas (Doble Tanda)',
      'Correo Institucional': 'carmen.rosario@minerd.edu.do'
    },
    {
      'Nombre Completo': 'Prof. Manuel Emilio Peña',
      'Cédula': '001-0987654-3',
      'WhatsApp / Teléfono': '809-555-0102',
      'Nivel / Ciclo / Cargo': 'Nivel Primario Segundo Ciclo',
      'Grado(s)': '4to Grado, 5to Grado',
      'Sección(es)': 'A, B',
      'Tanda': 'Ambas Tandas (Doble Tanda)',
      'Correo Institucional': 'manuel.pena@minerd.edu.do'
    },
    {
      'Nombre Completo': 'Prof. Yaritza Mercedes Gómez',
      'Cédula': '223-0192837-1',
      'WhatsApp / Teléfono': '809-555-0103',
      'Nivel / Ciclo / Cargo': 'Nivel Inicial',
      'Grado(s)': 'Kínder, Pre-Primario',
      'Sección(es)': 'A',
      'Tanda': 'Tanda Matutina (8:00 AM - 12:00 PM)',
      'Correo Institucional': 'yaritza.gomez@minerd.edu.do'
    },
    {
      'Nombre Completo': 'Prof. Juan Carlos Santana',
      'Cédula': '001-5544332-9',
      'WhatsApp / Teléfono': '809-555-0104',
      'Nivel / Ciclo / Cargo': 'Secundaria',
      'Grado(s)': '1er Año Secundaria, 2do Año Secundaria',
      'Sección(es)': 'A',
      'Tanda': 'Ambas Tandas (Doble Tanda)',
      'Correo Institucional': 'juancarlos.santana@minerd.edu.do'
    },
    {
      'Nombre Completo': 'Licda. Rosaura Batista',
      'Cédula': '001-4433221-8',
      'WhatsApp / Teléfono': '809-555-0105',
      'Nivel / Ciclo / Cargo': 'Auxiliar',
      'Grado(s)': 'Varios Grados / Rotativo',
      'Sección(es)': 'A, B',
      'Tanda': 'Ambas Tandas (Doble Tanda)',
      'Correo Institucional': 'rosaura.batista@minerd.edu.do'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 34 }, // Nombre
    { wch: 18 }, // Cédula
    { wch: 22 }, // Teléfono
    { wch: 30 }, // Nivel / Cargo
    { wch: 24 }, // Grados
    { wch: 14 }, // Secciones
    { wch: 30 }, // Tanda
    { wch: 32 }  // Correo
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla_Docentes_MINERD');

  XLSX.writeFile(workbook, 'Plantilla_Docentes_Institucional.xlsx');
}
