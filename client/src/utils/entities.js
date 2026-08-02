import {
  Activity,
  CalendarClock,
  FileText,
  HeartPulse,
  Pill,
  Stethoscope,
  Thermometer,
  Weight,
  Brain,
  User,
} from 'lucide-react';

export const ENTITY_META = {
  symptom: { label: 'Síntoma', icon: Activity, chip: 'bg-orange-50 text-orange-600 border-orange-200' },
  consultation: { label: 'Consulta', icon: Stethoscope, chip: 'bg-blue-50 text-blue-600 border-blue-200' },
  medication: { label: 'Medicamento', icon: Pill, chip: 'bg-violet-50 text-violet-600 border-violet-200' },
  study: { label: 'Estudio', icon: FileText, chip: 'bg-mint-50 text-mint-600 border-mint-200' },
  daily: { label: 'Salud diaria', icon: HeartPulse, chip: 'bg-rose-50 text-rose-600 border-rose-200' },
  note: { label: 'Nota', icon: FileText, chip: 'bg-ink-100 text-ink-600 border-ink-200' },
};

export const SYMPTOM_KINDS = [
  { value: 'inflamacion', label: 'Inflamación' },
  { value: 'ardor', label: 'Ardor' },
  { value: 'presion', label: 'Presión' },
  { value: 'hormigueo', label: 'Hormigueo' },
  { value: 'calambre', label: 'Calambre' },
  { value: 'fatiga', label: 'Fatiga' },
  { value: 'mareo', label: 'Mareo' },
  { value: 'otro', label: 'Otro' },
];

export const STUDY_CATEGORIES = [
  'Radiografía',
  'Tomografía',
  'Resonancia',
  'Ecografía',
  'Laboratorio',
  'Electrocardiograma',
  'Otro',
];

export const MED_STATUS = [
  { value: 'active', label: 'Activo' },
  { value: 'suspended', label: 'Suspendido' },
  { value: 'finished', label: 'Finalizado' },
];

export const MOODS = [
  { value: 1, label: 'Muy mal', emoji: '😞' },
  { value: 2, label: 'Mal', emoji: '😕' },
  { value: 3, label: 'Regular', emoji: '😐' },
  { value: 4, label: 'Bien', emoji: '🙂' },
  { value: 5, label: 'Muy bien', emoji: '😄' },
];

export const QUICK_ITEMS = [
  { type: 'symptom', label: 'Síntoma', icon: Activity, color: 'bg-orange-100 text-orange-600' },
  { type: 'medication', label: 'Medicamento', icon: Pill, color: 'bg-violet-100 text-violet-600' },
  { type: 'consultation', label: 'Consulta', icon: Stethoscope, color: 'bg-blue-100 text-blue-600' },
  { type: 'study', label: 'Estudio', icon: FileText, color: 'bg-mint-100 text-mint-600' },
  { type: 'note', label: 'Nota', icon: User, color: 'bg-ink-100 text-ink-600' },
  { type: 'weight', label: 'Peso', icon: Weight, color: 'bg-amber-100 text-amber-600' },
  { type: 'pressure', label: 'Presión', icon: Activity, color: 'bg-red-100 text-red-600' },
  { type: 'glucose', label: 'Glucosa', icon: Thermometer, color: 'bg-cyan-100 text-cyan-600' },
  { type: 'temperature', label: 'Temperatura', icon: Thermometer, color: 'bg-emerald-100 text-emerald-600' },
];

// Zonas finas del cuerpo 3D (modo "Detalle" en Body3D). Son subdivisiones de
// las zonas de BODY_PARTS; el mapa 2D y los chips de QuickAdd siguen usando
// únicamente BODY_PARTS.
export const BODY_PARTS_DETAIL = [
  { id: 'cuero-cabelludo', label: 'Cuero cabelludo' },
  { id: 'frente', label: 'Frente' },
  { id: 'sienes-izq', label: 'Sien izquierda' },
  { id: 'sienes-der', label: 'Sien derecha' },
  { id: 'ojos-izq', label: 'Ojo izquierdo' },
  { id: 'ojos-der', label: 'Ojo derecho' },
  { id: 'nariz', label: 'Nariz' },
  { id: 'mejilla-izq', label: 'Mejilla izquierda' },
  { id: 'mejilla-der', label: 'Mejilla derecha' },
  { id: 'boca', label: 'Boca' },
  { id: 'mandibula', label: 'Mandíbula' },
  { id: 'menton', label: 'Mentón' },
  { id: 'oreja-izq', label: 'Oreja izquierda' },
  { id: 'oreja-der', label: 'Oreja derecha' },
  { id: 'espalda-cervical', label: 'Espalda cervical' },
  { id: 'espalda-toracica-alta', label: 'Espalda torácica alta' },
  { id: 'espalda-toracica-media', label: 'Espalda torácica media' },
  { id: 'espalda-toracica-baja', label: 'Espalda torácica baja' },
  { id: 'epigastrio', label: 'Epigastrio' },
  { id: 'hipocondrio-izq', label: 'Hipocondrio izquierdo' },
  { id: 'hipocondrio-der', label: 'Hipocondrio derecho' },
  { id: 'mesogastrio', label: 'Mesogastrio' },
  { id: 'fosa-iliaca-izq', label: 'Fosa ilíaca izquierda' },
  { id: 'fosa-iliaca-der', label: 'Fosa ilíaca derecha' },
  { id: 'hipogastrio', label: 'Hipogastrio' },
  { id: 'muneca-izq', label: 'Muñeca izquierda' },
  { id: 'muneca-der', label: 'Muñeca derecha' },
  { id: 'palma-izq', label: 'Palma izquierda' },
  { id: 'palma-der', label: 'Palma derecha' },
  { id: 'dedos-mano-izq', label: 'Dedos de la mano izquierda' },
  { id: 'dedos-mano-der', label: 'Dedos de la mano derecha' },
  { id: 'tobillo-izq', label: 'Tobillo izquierdo' },
  { id: 'tobillo-der', label: 'Tobillo derecho' },
  { id: 'empeine-izq', label: 'Empeine izquierdo' },
  { id: 'empeine-der', label: 'Empeine derecho' },
  { id: 'planta-izq', label: 'Planta izquierda' },
  { id: 'planta-der', label: 'Planta derecha' },
  { id: 'talon-izq', label: 'Talón izquierdo' },
  { id: 'talon-der', label: 'Talón derecho' },
  { id: 'dedos-pie-izq', label: 'Dedos del pie izquierdo' },
  { id: 'dedos-pie-der', label: 'Dedos del pie derecho' },
];

export const BODY_PARTS = [
  { id: 'cabeza', label: 'Cabeza' },
  { id: 'ojos', label: 'Ojos' },
  { id: 'garganta', label: 'Garganta' },
  { id: 'cuello', label: 'Cuello' },
  { id: 'hombro-izq', label: 'Hombro izquierdo' },
  { id: 'hombro-der', label: 'Hombro derecho' },
  { id: 'brazo-izq', label: 'Brazo izquierdo' },
  { id: 'brazo-der', label: 'Brazo derecho' },
  { id: 'codo-izq', label: 'Codo izquierdo' },
  { id: 'codo-der', label: 'Codo derecho' },
  { id: 'antebrazo-izq', label: 'Antebrazo izquierdo' },
  { id: 'antebrazo-der', label: 'Antebrazo derecho' },
  { id: 'mano-izq', label: 'Mano izquierda' },
  { id: 'mano-der', label: 'Mano derecha' },
  { id: 'pecho', label: 'Pecho' },
  { id: 'abdomen', label: 'Abdomen' },
  { id: 'espalda', label: 'Espalda' },
  { id: 'espalda-baja', label: 'Espalda baja' },
  { id: 'cadera', label: 'Cadera' },
  { id: 'muslo-izq', label: 'Muslo izquierdo' },
  { id: 'muslo-der', label: 'Muslo derecho' },
  { id: 'rodilla-izq', label: 'Rodilla izquierda' },
  { id: 'rodilla-der', label: 'Rodilla derecha' },
  { id: 'pierna-izq', label: 'Pierna izquierda' },
  { id: 'pierna-der', label: 'Pierna derecha' },
  { id: 'pie-izq', label: 'Pie izquierdo' },
  { id: 'pie-der', label: 'Pie derecho' },
];

export function bodyPartLabel(id) {
  const p = BODY_PARTS.find((b) => b.id === id) || BODY_PARTS_DETAIL.find((b) => b.id === id);
  return p ? p.label : id;
}
