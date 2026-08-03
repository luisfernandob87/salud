import { useEffect, useState, lazy, Suspense } from 'react';
import Modal from '../ui/Modal';
import BodyMap from '../bodyMap/BodyMap';
import ViewToggle from '../bodyMap/ViewToggle';
import FileUploader from './FileUploader';

const Body3D = lazy(() => import('../bodyMap/Body3D'));
import { SYMPTOM_KINDS, STUDY_CATEGORIES, MED_STATUS } from '../../utils/entities';
import { api, friendlyError } from '../../api/client';
import { useUi } from '../../stores/ui';

const ENDPOINTS = {
  symptom: '/api/symptoms',
  consultation: '/api/consultations',
  medication: '/api/medications',
  study: '/api/studies',
  note: '/api/notes',
};

function toLocalDateTime(v) {
  if (!v) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return `${v}T00:00`;
  if (v.includes('T')) return v.slice(0, 16);
  return v.slice(0, 16);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function defaultValues(type) {
  switch (type) {
    case 'symptom':
      return { occurred_at: toLocalDateTime(new Date().toISOString()), body_locations: [], intensity: null, kind: '', duration: '', causes: '', activity: '', relief: '', notes: '', tags: [] };
    case 'consultation':
      return { date: today(), specialty: '', doctor: '', place: '', reason: '', diagnosis: '', treatment: '', recommendations: '', next_appointment: '', notes: '', tags: [] };
    case 'medication':
      return { name: '', dosage: '', frequency: '', start_date: today(), end_date: '', prescribed_by: '', status: 'active', reminder_at: '', notes: '', tags: [] };
    case 'study':
      return { date: today(), category: '', description: '', observations: '', tags: [] };
    case 'note':
      return { date: today(), title: '', content: '', tags: [] };
    default:
      return {};
  }
}

function Field({ label, children, className }) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function TagsInput({ value, onChange }) {
  const text = value.join(', ');
  return (
    <input
      className="input"
      placeholder="etiquetas separadas por coma"
      value={text}
      onChange={(e) =>
        onChange(
          e.target.value
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        )
      }
    />
  );
}

export default function EntityForm({ open, type, initial, onClose, onSaved }) {
  const { toast, bumpRefresh } = useUi();
  const [v, setV] = useState(defaultValues(type));
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [bodyView, setBodyView] = useState('2d');
  const isEdit = Boolean(initial && initial.id);

  useEffect(() => {
    if (!open) return;
    setError('');
    if (initial && initial.id) {
      const copy = { ...defaultValues(type), ...initial };
      for (const k of Object.keys(copy)) {
        if (copy[k] === null || copy[k] === undefined) copy[k] = '';
      }
      copy.body_locations = Array.isArray(copy.body_locations) ? copy.body_locations : [];
      copy.tags = Array.isArray(copy.tags) ? copy.tags : [];
      if (copy.occurred_at) copy.occurred_at = toLocalDateTime(copy.occurred_at);
      setV(copy);
      setFiles(initial.files || []);
    } else {
      setV(defaultValues(type));
      setFiles([]);
    }
  }, [open, initial, type]);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const url = isEdit ? `${ENDPOINTS[type]}/${initial.id}` : ENDPOINTS[type];
      const method = isEdit ? api.put : api.post;
      const data = await method(url, v);
      toast(isEdit ? 'Cambios guardados.' : 'Registro creado.', 'success');
      bumpRefresh();
      onSaved && onSaved(data.item);
      onClose();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem() {
    if (!initial || !initial.id) return;
    if (!window.confirm('¿Eliminar este registro? Esta acción no se puede deshacer.')) return;
    setSaving(true);
    try {
      await api.del(`${ENDPOINTS[type]}/${initial.id}`);
      toast('Registro eliminado.', 'success');
      bumpRefresh();
      onSaved && onSaved(null);
      onClose();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  const set = (k, val) => setV((s) => ({ ...s, [k]: val }));

  async function refreshFiles() {
    if (!v.id) return;
    try {
      const data = await api.get(`${ENDPOINTS[type]}/${v.id}`);
      setFiles(data.item.files || []);
    } catch (err) {
      /* ignore */
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Editar ${type === 'symptom' ? 'síntoma' : type}` : `Nuevo ${type === 'symptom' ? 'síntoma' : type}`}
      wide
      footer={
        <div className="flex gap-2">
          {isEdit && (
            <button type="button" onClick={deleteItem} disabled={saving} className="btn-danger">
              Eliminar
            </button>
          )}
          <button type="button" onClick={onClose} className="btn-ghost flex-1">
            Cancelar
          </button>
          <button type="submit" form="entity-form" disabled={saving} className="btn-primary flex-1">
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      }
    >
      <form id="entity-form" onSubmit={submit} className="space-y-4">
        {type === 'symptom' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fecha y hora *">
                <input type="datetime-local" className="input" value={v.occurred_at} onChange={(e) => set('occurred_at', e.target.value)} required />
              </Field>
              <Field label="Tipo">
                <select className="input" value={v.kind} onChange={(e) => set('kind', e.target.value)}>
                  <option value="">Selecciona…</option>
                  {SYMPTOM_KINDS.map((k) => (
                    <option key={k.value} value={k.value}>{k.label}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div>
              <label className="label mb-2">Ubicación del cuerpo</label>
              <div className="flex items-center justify-between mb-2">
                <ViewToggle value={bodyView} onChange={setBodyView} />
                <span className="text-xs text-ink-400">Toca para marcar zonas</span>
              </div>
              <div className="card p-3">
                {bodyView === '3d' ? (
                  <Suspense
                    fallback={<div className="h-64 flex items-center justify-center text-sm text-ink-400">Cargando cuerpo 3D…</div>}
                  >
                    <Body3D value={v.body_locations} onChange={(val) => set('body_locations', val)} />
                  </Suspense>
                ) : (
                  <BodyMap value={v.body_locations} onChange={(val) => set('body_locations', val)} />
                )}
              </div>
            </div>

            <Field label="Intensidad (1-10)">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <button
                    type="button"
                    key={n}
                    onClick={() => set('intensity', v.intensity === n ? null : n)}
                    className={`flex-1 h-10 rounded-lg text-xs font-semibold transition ${
                      v.intensity >= n ? 'bg-orange-400 text-white' : 'bg-ink-100 text-ink-400'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Duración">
                <input className="input" placeholder="ej. 2 días" value={v.duration} onChange={(e) => set('duration', e.target.value)} />
              </Field>
              <Field label="Qué ayudó">
                <input className="input" placeholder="ej. reposo, calor" value={v.relief} onChange={(e) => set('relief', e.target.value)} />
              </Field>
            </div>
            <Field label="Posibles causas">
              <textarea className="input min-h-[60px]" value={v.causes} onChange={(e) => set('causes', e.target.value)} />
            </Field>
            <Field label="Qué estaba haciendo cuando comenzó">
              <textarea className="input min-h-[60px]" value={v.activity} onChange={(e) => set('activity', e.target.value)} />
            </Field>
          </>
        )}

        {type === 'consultation' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fecha *">
                <input type="date" className="input" value={v.date} onChange={(e) => set('date', e.target.value)} required />
              </Field>
              <Field label="Especialidad">
                <input className="input" placeholder="Traumatología" value={v.specialty} onChange={(e) => set('specialty', e.target.value)} />
              </Field>
              <Field label="Doctor">
                <input className="input" placeholder="Dr. Pérez" value={v.doctor} onChange={(e) => set('doctor', e.target.value)} />
              </Field>
              <Field label="Lugar">
                <input className="input" placeholder="Clínica, hospital…" value={v.place} onChange={(e) => set('place', e.target.value)} />
              </Field>
            </div>
            <Field label="Motivo">
              <textarea className="input min-h-[60px]" value={v.reason} onChange={(e) => set('reason', e.target.value)} />
            </Field>
            <Field label="Diagnóstico">
              <textarea className="input min-h-[60px]" value={v.diagnosis} onChange={(e) => set('diagnosis', e.target.value)} />
            </Field>
            <Field label="Tratamiento">
              <textarea className="input min-h-[60px]" value={v.treatment} onChange={(e) => set('treatment', e.target.value)} />
            </Field>
            <Field label="Recomendaciones">
              <textarea className="input min-h-[60px]" value={v.recommendations} onChange={(e) => set('recommendations', e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Próxima cita">
                <input type="date" className="input" value={v.next_appointment} onChange={(e) => set('next_appointment', e.target.value)} />
              </Field>
              <Field label="Notas">
                <input className="input" value={v.notes} onChange={(e) => set('notes', e.target.value)} />
              </Field>
            </div>
          </>
        )}

        {type === 'medication' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nombre *">
                <input className="input" value={v.name} onChange={(e) => set('name', e.target.value)} required placeholder="Ibuprofeno" />
              </Field>
              <Field label="Dosis">
                <input className="input" placeholder="400 mg" value={v.dosage} onChange={(e) => set('dosage', e.target.value)} />
              </Field>
              <Field label="Frecuencia">
                <input className="input" placeholder="Cada 8 horas" value={v.frequency} onChange={(e) => set('frequency', e.target.value)} />
              </Field>
              <Field label="Estado">
                <select className="input" value={v.status} onChange={(e) => set('status', e.target.value)}>
                  {MED_STATUS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Inicio">
                <input type="date" className="input" value={v.start_date} onChange={(e) => set('start_date', e.target.value)} />
              </Field>
              <Field label="Fin">
                <input type="date" className="input" value={v.end_date} onChange={(e) => set('end_date', e.target.value)} />
              </Field>
              <Field label="Indicado por">
                <input className="input" placeholder="Dr. García" value={v.prescribed_by} onChange={(e) => set('prescribed_by', e.target.value)} />
              </Field>
              <Field label="Recordatorio (hora)">
                <input type="time" className="input" value={v.reminder_at} onChange={(e) => set('reminder_at', e.target.value)} />
              </Field>
            </div>
            <Field label="Notas">
              <textarea className="input min-h-[60px]" value={v.notes} onChange={(e) => set('notes', e.target.value)} />
            </Field>
          </>
        )}

        {type === 'study' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fecha *">
                <input type="date" className="input" value={v.date} onChange={(e) => set('date', e.target.value)} required />
              </Field>
              <Field label="Categoría">
                <select className="input" value={v.category} onChange={(e) => set('category', e.target.value)}>
                  <option value="">Selecciona…</option>
                  {STUDY_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Descripción *">
              <textarea className="input min-h-[60px]" value={v.description} onChange={(e) => set('description', e.target.value)} placeholder="Radiografía de pie derecho" required />
            </Field>
            <Field label="Observaciones">
              <textarea className="input min-h-[60px]" value={v.observations} onChange={(e) => set('observations', e.target.value)} />
            </Field>
          </>
        )}

        {type === 'note' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fecha *">
                <input type="date" className="input" value={v.date} onChange={(e) => set('date', e.target.value)} required />
              </Field>
              <Field label="Título">
                <input className="input" value={v.title} onChange={(e) => set('title', e.target.value)} />
              </Field>
            </div>
            <Field label="Contenido">
              <textarea className="input min-h-[100px]" value={v.content} onChange={(e) => set('content', e.target.value)} />
            </Field>
          </>
        )}

        <Field label="Etiquetas">
          <TagsInput value={v.tags} onChange={(val) => set('tags', val)} />
        </Field>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {(isEdit || type === 'note' || type === 'study') && v.id && (
          <FileUploader entityType={type} entityId={v.id} files={files} onChanged={refreshFiles} />
        )}
        {!isEdit && <p className="text-xs text-ink-400">Guarda primero y luego podrás adjuntar fotos, videos o PDF.</p>}
      </form>
    </Modal>
  );
}
