/**
 * WhatsApp Notification and Messaging Utilities
 * Formatted specifically for Dominican Republic Educational Institutions (MINERD)
 */

export interface WhatsAppNotificationPayload {
  teacherName: string;
  teacherPhone?: string;
  reviewerName: string;
  reviewerRole: 'Director/a' | 'Coordinador/a Pedagógico/a';
  schoolName: string;
  planTitle: string;
  planType: 'Planificación Diaria' | 'Planificación Semanal' | 'Unidad de Aprendizaje';
  grade: string;
  section: string;
  area: string;
  dateOrWeek: string;
  status: 'approved' | 'returned' | 'pending' | 'reminder';
  feedback?: string;
}

export function formatDominicanPhoneNumber(phone?: string): string {
  if (!phone) return '';
  // Remove non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  if (!digits) return '';

  // If starts with 1 and is 11 digits (e.g. 18091234567)
  if (digits.length === 11 && digits.startsWith('1')) {
    return digits;
  }

  // If it's a 10 digit DR number (809xxxxxxx, 829xxxxxxx, 849xxxxxxx)
  if (digits.length === 10) {
    return `1${digits}`;
  }

  // If already full international length > 11
  return digits;
}

export function generateWhatsAppMessage(payload: WhatsAppNotificationPayload): string {
  const {
    teacherName,
    reviewerName,
    reviewerRole,
    schoolName,
    planTitle,
    planType,
    grade,
    section,
    area,
    dateOrWeek,
    status,
    feedback
  } = payload;

  const header = `🏛️ *${schoolName.toUpperCase()}*\n📋 *Acompañamiento Pedagógico MINERD*\n─────────────────────`;

  let body = '';

  if (status === 'approved') {
    body = `✅ *NOTIFICACIÓN DE PLANIFICACIÓN APROBADA*\n\n` +
      `Estimado/a *${teacherName}*,\n\n` +
      `Le informamos que su *${planType}* ha sido revisada y *APROBADA* satisfactoriamente por el Equipo de Gestión Curricular.\n\n` +
      `📌 *Detalles del Plan:*\n` +
      `• *Tema/Título:* ${planTitle}\n` +
      `• *Área Curricular:* ${area}\n` +
      `• *Grado y Sección:* ${grade} "${section}"\n` +
      `• *Fecha/Período:* ${dateOrWeek}\n\n` +
      (feedback ? `💬 *Observaciones del Acompañante:* \n"${feedback}"\n\n` : '') +
      `🌟 Felicitaciones por su compromiso con la calidad del aprendizaje de nuestros estudiantes. Puede proceder a impartir la clase y archivar el documento en su portafolio docente.`;
  } else if (status === 'returned') {
    body = `⚠️ *REVISIÓN PEDAGÓGICA - AJUSTES REQUERIDOS*\n\n` +
      `Estimado/a *${teacherName}*,\n\n` +
      `Hemos realizado el acompañamiento a su *${planType}* y se requiere realizar algunas adecuaciones curriculares antes de su aprobación definitiva.\n\n` +
      `📌 *Detalles del Plan:*\n` +
      `• *Tema/Título:* ${planTitle}\n` +
      `• *Área:* ${area} | ${grade} "${section}"\n` +
      `• *Fecha/Período:* ${dateOrWeek}\n\n` +
      `📝 *Aspectos a Mejorar / Observaciones:* \n` +
      `👉 *${feedback || 'Favor revisar la congruencia entre la intención pedagógica, las actividades de los 3 momentos y los indicadores de logro.'}*\n\n` +
      `Favor ingresar al Sistema de Planificación Docente, aplicar las mejoras sugeridas y reenviar para su validación.`;
  } else if (status === 'pending') {
    body = `⏳ *NOTIFICACIÓN DE PLANIFICACIÓN EN REVISIÓN*\n\n` +
      `Estimado/a *${teacherName}*,\n\n` +
      `Confirmamos la recepción de su *${planType}*: "${planTitle}" (${grade} "${section}" - ${area}).\n\n` +
      `El Equipo de Coordinación Pedagógica se encuentra actualmente en proceso de validación curricular. Le notificaremos tan pronto finalice la revisión.`;
  } else {
    // Reminder
    body = `⏰ *RECORDATORIO DE ENTREGA DE PLANIFICACIÓN*\n\n` +
      `Estimado/a *${teacherName}*,\n\n` +
      `Le recordamos cordialmente realizar la entrega y registro de su *${planType}* correspondiente al período *${dateOrWeek}* en el Sistema Institucional.\n\n` +
      `Agradecemos su puntualidad para garantizar el acompañamiento y seguimiento oportuno.`;
  }

  const footer = `\n─────────────────────\n✍️ *Acompañado por:* ${reviewerName}\n🏷️ *Cargo:* ${reviewerRole}\n🏫 *${schoolName}*`;

  return `${header}\n\n${body}${footer}`;
}

export function createWhatsAppUrl(phone: string | undefined, message: string): string {
  const formattedPhone = formatDominicanPhoneNumber(phone);
  const encodedText = encodeURIComponent(message);
  
  if (formattedPhone) {
    return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`;
  }
  return `https://api.whatsapp.com/send?text=${encodedText}`;
}

export function openWhatsAppChat(phone: string | undefined, message: string): void {
  const url = createWhatsAppUrl(phone, message);
  window.open(url, '_blank', 'noopener,noreferrer');
}
