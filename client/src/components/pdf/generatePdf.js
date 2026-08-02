import { jsPDF } from 'jspdf';
import { APP_NAME } from '../../utils/app';
import { SYMPTOM_KINDS, MED_STATUS, bodyPartLabel } from '../../utils/entities';
import { formatDate } from '../../utils/format';

const BLUE = [59, 130, 246];
const MINT = [16, 185, 129];
const INK = [15, 23, 42];
const GRAY = [100, 116, 139];

function kindLabel(kind) {
  const f = SYMPTOM_KINDS.find((k) => k.value === kind);
  return f ? f.label : kind;
}

function statusLabel(status) {
  const s = MED_STATUS.find((m) => m.value === status);
  return s ? s.label : status;
}

function rgb(color, alpha = 1) {
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
}

export function generateMedicalPdf({ user, items }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210;
  const M = 16;
  const CW = W - M * 2;
  let y = 0;

  function ensureY(height = 24) {
    if (y + height > 277) {
      doc.addPage();
      y = 18;
    }
  }

  function sectionTitle(text) {
    ensureY(20);
    doc.setFillColor(...BLUE);
    doc.rect(M, y, 2.2, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...INK);
    doc.text(text, M + 5, y + 4.5);
    y += 11;
  }

  function text(label, value, opts = {}) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    doc.text(label, M, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...INK);
    const valueStr = String(value ?? '—');
    const lines = doc.splitTextToSize(valueStr, CW - 40);
    doc.text(lines, M + 40, y);
    y += lines.length * 4 + 1.5;
  }

  function paragraph(textStr, indent = 0) {
    const lines = doc.splitTextToSize(String(textStr ?? ''), CW - indent);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    doc.text(lines, M + indent, y);
    y += lines.length * 4 + 1;
  }

  // Header
  doc.setFillColor(...BLUE);
  doc.rect(0, 0, W, 34, 'F');
  doc.setFillColor(...MINT);
  doc.rect(0, 34, W, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text(APP_NAME, M, 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('Resumen de historial de salud', M, 23);
  doc.setFontSize(9);
  doc.text(`Generado el ${new Date().toLocaleDateString('es')} · Documento de solo lectura`, M, 29);
  y = 42;

  // Personal data
  sectionTitle('Datos personales');
  if (user) {
    text('Nombre', user.name || '—');
    text('Correo', user.email || '—');
    text('Nacimiento', formatDate(user.birth_date));
    text('Tipo de sangre', user.blood_type || '—');
    text('Altura', user.height_cm ? `${user.height_cm} cm` : '—');
  }
  y += 2;

  // Summary counts
  const count = (type) => items.filter((i) => i.type === type).length;
  sectionTitle('Resumen general');
  paragraph(
    `Este historial contiene ${count('symptom')} síntomas, ${count('consultation')} consultas, ` +
      `${count('medication')} medicamentos, ${count('study')} estudios, ${count('daily')} registros de salud diaria y ${count('note')} notas.`
  );
  y += 2;

  // Active medications
  const active = items.filter((i) => i.type === 'medication' && i.status === 'active');
  if (active.length > 0) {
    sectionTitle('Medicamentos actuales');
    for (const m of active) {
      paragraph(`• ${m.name} — ${[m.dosage, m.frequency].filter(Boolean).join(' · ')}`, 2);
      text('Indicado por', m.prescribed_by || '—');
      text('Inicio', m.start_date || '—');
      y += 1;
    }
    y += 1;
  }

  // Recent consultations
  const consults = items.filter((i) => i.type === 'consultation').slice(0, 12);
  if (consults.length > 0) {
    sectionTitle('Consultas recientes');
    for (const c of consults) {
      paragraph(`• [${c.date}] ${c.specialty || 'Consulta'}${c.doctor ? ` · ${c.doctor}` : ''}`, 2);
      if (c.reason) paragraph(`   Motivo: ${c.reason}`, 4);
      if (c.diagnosis) paragraph(`   Diagnóstico: ${c.diagnosis}`, 4);
      if (c.treatment) paragraph(`   Tratamiento: ${c.treatment}`, 4);
      y += 1;
    }
    y += 1;
  }

  // Timeline
  sectionTitle('Línea de tiempo');
  const timeline = [...items].sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0)).slice(0, 60);
  for (const it of timeline) {
    const date = it.type === 'symptom' ? (it.occurred_at || it.date) : it.date;
    let title = '';
    let detail = '';
    switch (it.type) {
      case 'symptom':
        title = `${kindLabel(it.kind) || 'Síntoma'}${it.intensity ? ` (${it.intensity}/10)` : ''}`;
        detail = [it.body_locations && it.body_locations.map(bodyPartLabel).join(', '), it.notes].filter(Boolean).join(' — ');
        break;
      case 'consultation':
        title = `Consulta${it.specialty ? `: ${it.specialty}` : ''}`;
        detail = [it.doctor, it.diagnosis].filter(Boolean).join(' — ');
        break;
      case 'medication':
        title = `Medicamento: ${it.name}`;
        detail = [it.dosage, it.frequency, statusLabel(it.status)].filter(Boolean).join(' — ');
        break;
      case 'study':
        title = `Estudio: ${it.category || 'Estudio'}`;
        detail = it.description || '';
        break;
      case 'note':
        title = `Nota: ${it.title || 'Nota'}`;
        detail = it.content || '';
        break;
      case 'daily':
        title = 'Registro diario';
        detail = [it.weight_kg && `Peso ${it.weight_kg} kg`, it.bp_sys && `PA ${it.bp_sys}/${it.bp_dia}`, it.glucose && `Glucosa ${it.glucose}`, it.temperature && `Temp ${it.temperature}°C`]
          .filter(Boolean)
          .join(' · ');
        break;
      default:
        break;
    }
    paragraph(`• [${date}] ${title}`, 2);
    if (detail) paragraph(`   ${detail}`, 4);
  }

  // Charts
  const daily = items.filter((i) => i.type === 'daily').sort((a, b) => (a.date > b.date ? 1 : -1));
  const series = [
    { key: 'weight_kg', label: 'Peso (kg)', color: MINT },
    { key: 'glucose', label: 'Glucosa (mg/dL)', color: BLUE },
    { key: 'temperature', label: 'Temperatura (°C)', color: MINT },
    { key: 'heart_rate', label: 'Frecuencia cardíaca (lpm)', color: [139, 92, 246] },
  ];

  const drawable = series.filter((s) => daily.some((d) => d[s.key] != null));
  if (drawable.length > 0 && daily.length > 1) {
    ensureY(50);
    sectionTitle('Gráficas de salud');
    const chartW = CW;
    for (let i = 0; i < drawable.length; i += 1) {
      const s = drawable[i];
      ensureY(45);
      const ch = 32;
      const data = daily.filter((d) => d[s.key] != null);
      const values = data.map((d) => d[s.key]);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const span = max - min || 1;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...INK);
      doc.text(s.label, M, y);
      y += 3;

      const cx = M;
      const cy = y;
      doc.setDrawColor(...GRAY, 0.35);
      doc.line(cx, cy + ch, cx + chartW, cy + ch);
      doc.setFillColor(240, 245, 255);
      doc.rect(cx, cy, chartW, ch, 'F');
      doc.setDrawColor(255, 255, 255);
      for (let g = 1; g < 3; g += 1) {
        doc.line(cx, cy + (ch / 3) * g, cx + chartW, cy + (ch / 3) * g);
      }
      doc.setStrokeColor(...s.color);
      doc.setLineWidth(1.2);
      const step = chartW / Math.max(1, data.length - 1);
      const pts = data.map((d, i) => ({
        x: cx + i * step,
        y: cy + ch - ((d[s.key] - min) / span) * (ch - 4) - 2,
      }));
      doc.lines(
        pts.map((p) => [p.x - pts[0].x, p.y - pts[0].y]).slice(1),
        pts[0].x,
        pts[0].y
      );
      doc.setLineWidth(0.3);
      doc.setDrawColor(...GRAY, 0.3);
      pts.forEach((p) => {
        doc.circle(p.x, p.y, 0.6, 'F');
      });
      doc.setFontSize(7);
      doc.setTextColor(...GRAY);
      doc.text(String(max), cx + chartW - 8, cy + 4);
      doc.text(String(min), cx + chartW - 8, cy + ch - 2);
      doc.setFontSize(6.5);
      doc.text(data[0].date, cx, cy + ch + 4);
      doc.text(data[data.length - 1].date, cx + chartW - 16, cy + ch + 4);
      y += ch + 8;
    }
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p += 1) {
    doc.setPage(p);
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);
    doc.text(
      `${APP_NAME} · Documento confidencial generado por el usuario · Página ${p} de ${pageCount}`,
      M,
      288
    );
  }

  doc.save(`historial-salud-${new Date().toISOString().slice(0, 10)}.pdf`);
}
