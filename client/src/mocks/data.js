function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function datetimeAgo(n, h = 10, m = 0) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(h, m, 0, 0);
  return d.toISOString().slice(0, 16);
}

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export const MOCK_USER = {
  id: 1,
  name: 'María García López',
  email: 'maria.garcia@demo.com',
  birth_date: '1992-03-15',
  blood_type: 'O+',
  height_cm: 165,
  password_hash: null,
  created_at: '2026-01-01T00:00:00',
};

export const MOCK_PROFILES = [
  { ...MOCK_USER, is_dependent: 0, family_code: 'FAM-DEMO-001', claim_code: null, relation: null },
  {
    id: 2,
    name: 'Santiago García',
    email: null,
    birth_date: '2018-07-22',
    blood_type: 'A+',
    height_cm: 128,
    is_dependent: 1,
    family_code: 'FAM-DEMO-002',
    claim_code: 'CLM-DEMO-002',
    relation: 'hijo',
  },
];

export function generateDailyRecords() {
  const records = [];
  const baseWeight = 62.5;
  for (let i = 60; i >= 0; i--) {
    if (Math.random() < 0.15 && i > 0) continue;
    const date = daysAgo(i);
    const dayOfWeek = new Date(date + 'T12:00:00').getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const mood = i <= 3 ? 4 : [3, 4, 4, 5, 3, 4, 2, 4, 5, 4][i % 10];
    const sleep = +(6 + Math.random() * 2.5).toFixed(1);
    const weight = +(baseWeight - i * 0.03 + (Math.random() - 0.5) * 0.4).toFixed(1);
    const bp_sys = Math.round(115 + Math.random() * 15);
    const bp_dia = Math.round(72 + Math.random() * 10);
    const glucose = Math.round(88 + Math.random() * 22);
    const temp = +(36.2 + Math.random() * 0.5).toFixed(1);
    const hr = Math.round(65 + Math.random() * 20);
    const spo2 = Math.round(97 + Math.random() * 2);
    const activities = [
      '30 min caminata', '45 min yoga', '20 min trotar', 'Sin actividad',
      '1 hora natación', '30 min bicicleta', '60 min caminata', '15 min estiramientos',
    ];
    const activity = isWeekend ? 'Sin actividad' : activities[i % activities.length];
    const notes = i === 7 ? 'Me sentí muy bien después del ejercicio' : i === 21 ? 'Día tranquilo, buena recuperación' : '';

    records.push({
      id: i + 1,
      user_id: 1,
      date,
      mood,
      sleep_hours: sleep,
      activity,
      weight_kg: weight,
      bp_sys: bp_sys,
      bp_dia: bp_dia,
      glucose,
      temperature: temp,
      heart_rate: hr,
      spo2: spo2,
      notes,
      visible_in_pdf: 1,
      created_at: `${date}T12:00:00`,
      updated_at: `${date}T12:00:00`,
    });
  }
  return records;
}

export const MOCK_SYMPTOMS = [
  {
    id: 1, user_id: 1, occurred_at: datetimeAgo(3, 14, 30),
    body_locations: ['cabeza', 'ojos'], intensity: 6, kind: 'presion',
    duration: '3 horas', causes: 'Estrés del trabajo y falta de sueño',
    activity: 'Trabajando frente a la computadora', relief: 'Ibuprofeno y reposo en oscuridad',
    notes: 'Dolor de cabeza detrás de los ojos, pulsátil',
    tags: ['estrés', 'pantalla'], visible_in_pdf: 1,
  },
  {
    id: 2, user_id: 1, occurred_at: datetimeAgo(8, 9, 15),
    body_locations: ['espalda-baja'], intensity: 4, kind: 'calambre',
    duration: 'Todo el día', causes: 'Postura al sentarme demasiado tiempo',
    activity: 'Sentada en la oficina', relief: 'Estiramientos y calor',
    notes: 'Dolor lumbar leve que mejora con movimiento',
    tags: ['postura', 'oficina'], visible_in_pdf: 1,
  },
  {
    id: 3, user_id: 1, occurred_at: datetimeAgo(14, 20, 0),
    body_locations: ['rodilla-der'], intensity: 3, kind: 'inflamacion',
    duration: '2 días', causes: 'Correr sin calentar adecuadamente',
    activity: 'Trote en el parque', relief: 'Hielo y antiinflamatorio',
    notes: 'Leve inflamación en la rodilla derecha después de correr',
    tags: ['ejercicio', 'rodilla'], visible_in_pdf: 1,
  },
  {
    id: 4, user_id: 1, occurred_at: datetimeAgo(22, 11, 0),
    body_locations: ['cuello', 'hombro-izq'], intensity: 5, kind: 'presion',
    duration: '5 días', causes: 'Estrés acumulado',
    activity: 'Durmiendo mal desde hace una semana',
    relief: 'Masaje y exercises de movilidad',
    notes: 'Nudo en el cuello que irradia al hombro izquierdo',
    tags: ['estrés', 'sueño'], visible_in_pdf: 1,
  },
  {
    id: 5, user_id: 1, occurred_at: datetimeAgo(35, 16, 45),
    body_locations: ['mano-der', 'muneca-der'], intensity: 2, kind: 'hormigueo',
    duration: '1 semana', causes: 'Uso excesivo del mouse',
    activity: 'Trabajando en computadora todo el día',
    relief: 'Descanso y muñequera',
    notes: 'Hormigueo ocasional en dedos de la mano derecha',
    tags: ['repetitivo', 'mano'], visible_in_pdf: 1,
  },
  {
    id: 6, user_id: 1, occurred_at: datetimeAgo(45, 8, 30),
    body_locations: ['garganta'], intensity: 3, kind: 'otro',
    duration: '3 días', causes: 'Gripe leve',
    activity: 'Enfermedad viral', relief: 'Té con miel y paracetamol',
    notes: 'Garganta irritada, pasajero',
    tags: ['gripe', 'resfriado'], visible_in_pdf: 1,
  },
  {
    id: 7, user_id: 1, occurred_at: datetimeAgo(12, 15, 0),
    body_locations: ['cabeza'], intensity: 2, kind: 'fatiga',
    duration: 'Medio día', causes: 'Noche de mal sueño',
    activity: 'Desperté cansada',
    relief: 'Café y siesta corta',
    notes: 'Fatiga leve, mejoró por la tarde',
    tags: ['sueño', 'fatiga'], visible_in_pdf: 0,
  },
];

export const MOCK_CONSULTATIONS = [
  {
    id: 1, user_id: 1, date: daysAgo(30),
    specialty: 'Medicina General', doctor: 'Dra. Ana Martínez',
    place: 'Clínica Santa María',
    reason: 'Revisión general anual',
    diagnosis: 'Buena salud general. Leve sobrepeso. Colesterol borderline.',
    treatment: 'Mantener actividad física. Dieta balanceada.',
    recommendations: 'Control de peso. Repetir análisis de sangre en 3 meses.',
    next_appointment: daysFromNow(60),
    notes: 'Seguimiento de colesterol',
    tags: ['anual', 'preventivo'], visible_in_pdf: 1,
  },
  {
    id: 2, user_id: 1, date: daysAgo(18),
    specialty: 'Traumatología', doctor: 'Dr. Carlos Ramírez',
    place: 'Hospital Ángeles',
    reason: 'Dolor lumbar persistente',
    diagnosis: 'Contractura muscular lumbar. Sin hallazgos preocupantes.',
    treatment: 'Fisioterapia 2 sesiones por semana por 4 semanas. Ibuprofeno 400mg.',
    recommendations: 'Evitar sentarse más de 1 hora seguida. Estiramientos diarios.',
    next_appointment: daysFromNow(14),
    notes: 'Traer resultados de la resonancia',
    tags: ['espalda', 'fisioterapia'], visible_in_pdf: 1,
  },
  {
    id: 3, user_id: 1, date: daysAgo(42),
    specialty: 'Dermatología', doctor: 'Dr. Luis Fernández',
    place: 'Centro Dermatológico',
    reason: 'Revisión de lunar en el brazo',
    diagnosis: 'Lunar benigno. Queratosis seborreica.',
    treatment: 'No requiere tratamiento.',
    recommendations: 'Vigilar cambios de color o tamaño. Usar protector solar.',
    next_appointment: daysFromNow(180),
    notes: 'Revisar en 6 meses',
    tags: ['piel', 'prevención'], visible_in_pdf: 1,
  },
  {
    id: 4, user_id: 1, date: daysAgo(55),
    specialty: 'Cardiología', doctor: 'Dra. Patricia López',
    place: 'Instituto Cardiovascular',
    reason: 'Chequeo cardíaco preventivo',
    diagnosis: 'Función cardíaca normal. ECG sin alteraciones.',
    treatment: 'Ninguno.',
    recommendations: 'Mantener ejercicio aeróbico regular. Controlar sodio.',
    next_appointment: daysFromNow(365),
    notes: 'Todo en orden',
    tags: ['corazón', 'preventivo'], visible_in_pdf: 1,
  },
];

export const MOCK_MEDICATIONS = [
  {
    id: 1, user_id: 1, name: 'Ibuprofeno', dosage: '400 mg',
    frequency: 'Cada 8 horas cuando sea necesario',
    start_date: daysAgo(60), end_date: null,
    prescribed_by: 'Dra. Ana Martínez', status: 'active',
    reminder_at: null,
    notes: 'Tomar con alimentos para proteger el estómago',
    tags: ['dolor', 'antiinflamatorio'], visible_in_pdf: 1,
  },
  {
    id: 2, user_id: 1, name: 'Omeprazol', dosage: '20 mg',
    frequency: '1 vez al día, en ayunas',
    start_date: daysAgo(45), end_date: null,
    prescribed_by: 'Dra. Ana Martínez', status: 'active',
    reminder_at: '08:00',
    notes: 'Protector gástrico mientras tomo ibuprofeno',
    tags: ['estómago', 'gástrico'], visible_in_pdf: 1,
  },
  {
    id: 3, user_id: 1, name: 'Paracetamol', dosage: '500 mg',
    frequency: 'Cada 6 horas',
    start_date: daysAgo(50), end_date: daysAgo(43),
    prescribed_by: 'Dra. Ana Martínez', status: 'finished',
    reminder_at: null,
    notes: 'Para la gripe. Ya finalizado.',
    tags: ['fiebre', 'gripe'], visible_in_pdf: 1,
  },
  {
    id: 4, user_id: 1, name: 'Vitamina D3', dosage: '2000 UI',
    frequency: '1 vez al semana',
    start_date: daysAgo(30), end_date: null,
    prescribed_by: 'Dra. Ana Martínez', status: 'active',
    reminder_at: '09:00',
    notes: 'Niveles bajos en análisis. Tomar los domingos.',
    tags: ['vitamina', 'suplemento'], visible_in_pdf: 1,
  },
];

export const MOCK_STUDIES = [
  {
    id: 1, user_id: 1, date: daysAgo(30),
    category: 'Laboratorio',
    description: 'Análisis de sangre completo',
    observations: 'Colesterol total: 210 mg/dL (borderline). Glucosa: 92 mg/dL (normal). Hemoglobina: 13.8 g/dL (normal). Triglicéridos: 160 mg/dL (leve elevation).',
    tags: ['sangre', 'colesterol'], visible_in_pdf: 1,
  },
  {
    id: 2, user_id: 1, date: daysAgo(20),
    category: 'Resonancia',
    description: 'Resonancia magnética de columna lumbar',
    observations: 'Sin hernias discales. Leve protrusión discal L4-L5. Canal medular permeable. Musculatura paraespinosa con signos de contractura.',
    tags: ['espalda', 'columna'], visible_in_pdf: 1,
  },
  {
    id: 3, user_id: 1, date: daysAgo(15),
    category: 'Electrocardiograma',
    description: 'ECG de reposo',
    observations: 'Ritmo sinusal. Frecuencia 72 lpm. Ejes normales. Sin alteraciones del segmento ST.',
    tags: ['corazón', 'ecg'], visible_in_pdf: 1,
  },
  {
    id: 4, user_id: 1, date: daysAgo(55),
    category: 'Radiografía',
    description: 'Radiografía de tórax',
    observations: 'Campos pulmonares limpios. Silueta cardíaca normal. Sin derrame pleural.',
    tags: ['pulmones', 'tórax'], visible_in_pdf: 1,
  },
];

export const MOCK_NOTES = [
  {
    id: 1, user_id: 1, date: daysAgo(5),
    title: 'Objetivos de salud este mes',
    content: '1. Caminar 30 min diarios\n2. Reducir café a 2 tazas\n3. Dormir 7+ horas\n4. Tomar vitamina D los domingos\n5. Repetir análisis de sangre en septiembre',
    tags: ['metas', 'salud'], visible_in_pdf: 1,
  },
  {
    id: 2, user_id: 1, date: daysAgo(25),
    title: 'Receta del Dr. Ramírez',
    content: 'Fisioterapia: 2x/semana por 4 semanas\nEjercicios: puente glúteo 3x15, rotación de tronco 3x10, gato-vaca 3x10\nIbuprofeno 400mg cada 8h si dolor',
    tags: ['fisioterapia', 'espalda'], visible_in_pdf: 1,
  },
  {
    id: 3, user_id: 1, date: daysAgo(40),
    title: 'Preguntas para el próximo médico',
    content: '¿Debería suplementar omega-3 para el colesterol?\n¿Cuánto ejercicio aeróbico me recomienda semanalmente?\n¿Hay algún examen adicional para el historial familiar de diabetes?',
    tags: ['pendiente', 'médico'], visible_in_pdf: 0,
  },
];

export const MOCK_SHARE_LINKS = [
  {
    id: 1, user_id: 1, token: 'demo-token-a1b2c3d4e5f6g7h8',
    password_hash: null,
    expires_at: daysFromNow(5),
    created_at: daysAgo(2),
    date_from: daysAgo(90),
    date_to: daysFromNow(0),
    types: '["symptom","consultation","study"]',
  },
];

let _nextId = 100;
export function nextId() { return ++_nextId; }
