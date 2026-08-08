import { useState, lazy, Suspense } from 'react';
import Modal from '../ui/Modal';
import CustomBodyPart from '../bodyMap/CustomBodyPart';
import ViewToggle from '../bodyMap/ViewToggle';
import { QUICK_ITEMS, BODY_PARTS, SYMPTOM_KINDS, STUDY_CATEGORIES } from '../../utils/entities';
import { api, friendlyError } from '../../api/client';
import { useUi } from '../../stores/ui';

const Body3D = lazy(() => import('../bodyMap/Body3D'));

function today() {
  return new Date().toISOString().slice(0, 10);
}

function nowLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

const EMPTY = {
  symptom: { occurred_at: nowLocal(), body_locations: [], intensity: null, kind: '', notes: '', visible_in_pdf: true },
  medication: { name: '', dosage: '', frequency: '', start_date: today(), visible_in_pdf: true },
  consultation: { date: today(), doctor: '', specialty: '', reason: '', visible_in_pdf: true },
  study: { date: today(), category: '', description: '', visible_in_pdf: true },
  note: { date: today(), title: '', content: '', visible_in_pdf: true },
  weight: { weight_kg: '', visible_in_pdf: true },
  pressure: { bp_sys: '', bp_dia: '', visible_in_pdf: true },
  glucose: { glucose: '', visible_in_pdf: true },
  temperature: { temperature: '', visible_in_pdf: true },
};

const VITALS_MAP = {
  weight: { url: '/api/daily', payload: (v) => ({ date: today(), weight_kg: v.weight_kg, visible_in_pdf: v.visible_in_pdf }) },
  pressure: { url: '/api/daily', payload: (v) => ({ date: today(), bp_sys: v.bp_sys, bp_dia: v.bp_dia, visible_in_pdf: v.visible_in_pdf }) },
  glucose: { url: '/api/daily', payload: (v) => ({ date: today(), glucose: v.glucose, visible_in_pdf: v.visible_in_pdf }) },
  temperature: { url: '/api/daily', payload: (v) => ({ date: today(), temperature: v.temperature, visible_in_pdf: v.visible_in_pdf }) },
};

const URLS = {
  symptom: '/api/symptoms',
  medication: '/api/medications',
  consultation: '/api/consultations',
  study: '/api/studies',
  note: '/api/notes',
};

function Field({ label, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function SymptomForm({ v, set }) {
  const [bodyView, setBodyView] = useState('2d');
  const toggle = (id) => {
    const next = v.body_locations.includes(id)
      ? v.body_locations.filter((x) => x !== id)
      : [...v.body_locations, id];
    set({ ...v, body_locations: next });
  };
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Fecha y hora">
          <input type="datetime-local" className="input" value={v.occurred_at} onChange={(e) => set({ ...v, occurred_at: e.target.value })} />
        </Field>
        <Field label="Tipo">
          <select className="input" value={v.kind} onChange={(e) => set({ ...v, kind: e.target.value })}>
            <option value="">Selecciona…</option>
            {SYMPTOM_KINDS.map((k) => (
              <option key={k.value} value={k.value}>{k.label}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="¿Dónde?">
        <div className="flex items-center justify-between mb-2">
          <ViewToggle value={bodyView} onChange={setBodyView} />
          {bodyView === '2d' && <span className="text-xs text-ink-400">Toca los que apliquen</span>}
        </div>
        {bodyView === '3d' ? (
          <Suspense fallback={<div className="h-64 flex items-center justify-center text-sm text-ink-400">Cargando cuerpo 3D…</div>}>
            <Body3D value={v.body_locations} onChange={(next) => set({ ...v, body_locations: next })} />
          </Suspense>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {BODY_PARTS.map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => toggle(p.id)}
                className={`chip border ${
                  v.body_locations.includes(p.id)
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-white text-ink-600 border-ink-200 hover:border-primary-300'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </Field>
      <CustomBodyPart value={v.body_locations} onChange={(next) => set({ ...v, body_locations: next })} />
      <Field label="Intensidad">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => set({ ...v, intensity: v.intensity === n ? null : n })}
              className={`flex-1 h-10 rounded-lg text-xs font-semibold transition ${
                v.intensity >= n ? 'bg-orange-400 text-white' : 'bg-ink-100 text-ink-400'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Notas">
        <textarea className="input min-h-[70px]" placeholder="Describe el síntoma…" value={v.notes} onChange={(e) => set({ ...v, notes: e.target.value })} />
      </Field>
    </div>
  );
}

export default function QuickAdd({ open }) {
  const { setQuickAddOpen, toast, bumpRefresh } = useUi();
  const [type, setType] = useState(null);
  const [v, setV] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function selectType(t) {
    setType(t);
    setV({ ...EMPTY[t] });
    setError('');
  }

  function close() {
    setQuickAddOpen(false);
    setTimeout(() => {
      setType(null);
      setV(null);
      setError('');
    }, 200);
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (VITALS_MAP[type]) {
        await api.put(VITALS_MAP[type].url, VITALS_MAP[type].payload(v));
      } else {
        await api.post(URLS[type], v);
      }
      toast('Registro guardado.', 'success');
      bumpRefresh();
      close();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={close} title={type ? QUICK_ITEMS.find((q) => q.type === type)?.label : 'Registrar'} wide>
      {!type ? (
        <div>
          <p className="text-sm text-ink-500 mb-4">¿Qué quieres registrar? Toma menos de un minuto.</p>
          <div className="grid grid-cols-3 gap-2.5">
            {QUICK_ITEMS.map(({ type: t, label, icon: Icon, color }) => (
              <button
                key={t}
                onClick={() => selectType(t)}
                className="flex flex-col items-center gap-2 rounded-2xl bg-ink-50 hover:bg-ink-100 active:scale-[0.97] transition p-4"
              >
                <div className={`w-11 h-11 rounded-2xl ${color} flex items-center justify-center`}>
                  <Icon size={20} />
                </div>
                <span className="text-xs font-medium text-ink-700">{label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          {type === 'symptom' && <SymptomForm v={v} set={setV} />}
          {type === 'medication' && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nombre *">
                <input className="input" autoFocus value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} placeholder="Ibuprofeno" />
              </Field>
              <Field label="Dosis">
                <input className="input" value={v.dosage} onChange={(e) => setV({ ...v, dosage: e.target.value })} placeholder="400 mg" />
              </Field>
              <Field label="Frecuencia">
                <input className="input" value={v.frequency} onChange={(e) => setV({ ...v, frequency: e.target.value })} placeholder="Cada 8 horas" />
              </Field>
              <Field label="Inicio">
                <input type="date" className="input" value={v.start_date} onChange={(e) => setV({ ...v, start_date: e.target.value })} />
              </Field>
            </div>
          )}
          {type === 'consultation' && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fecha">
                <input type="date" className="input" value={v.date} onChange={(e) => setV({ ...v, date: e.target.value })} />
              </Field>
              <Field label="Especialidad">
                <input className="input" value={v.specialty} onChange={(e) => setV({ ...v, specialty: e.target.value })} placeholder="Traumatología" />
              </Field>
              <div className="col-span-2">
                <Field label="Doctor">
                  <input className="input" value={v.doctor} onChange={(e) => setV({ ...v, doctor: e.target.value })} placeholder="Dr. Pérez" />
                </Field>
              </div>
              <div className="col-span-2">
                <Field label="Motivo">
                  <textarea className="input min-h-[60px]" value={v.reason} onChange={(e) => setV({ ...v, reason: e.target.value })} />
                </Field>
              </div>
            </div>
          )}
          {type === 'study' && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fecha">
                <input type="date" className="input" value={v.date} onChange={(e) => setV({ ...v, date: e.target.value })} />
              </Field>
              <Field label="Categoría">
                <select className="input" value={v.category} onChange={(e) => setV({ ...v, category: e.target.value })}>
                  <option value="">Selecciona…</option>
                  {STUDY_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <div className="col-span-2">
                <Field label="Descripción">
                  <textarea className="input min-h-[60px]" value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} placeholder="Radiografía de pie derecho…" />
                </Field>
              </div>
            </div>
          )}
          {type === 'note' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Fecha">
                  <input type="date" className="input" value={v.date} onChange={(e) => setV({ ...v, date: e.target.value })} />
                </Field>
                <Field label="Título">
                  <input className="input" value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} placeholder="Título de la nota" />
                </Field>
              </div>
              <Field label="Contenido">
                <textarea className="input min-h-[80px]" autoFocus value={v.content} onChange={(e) => setV({ ...v, content: e.target.value })} />
              </Field>
            </div>
          )}
          {type === 'weight' && (
            <Field label="Peso (kg)">
              <input type="number" step="0.1" className="input" autoFocus value={v.weight_kg} onChange={(e) => setV({ ...v, weight_kg: e.target.value })} placeholder="72.5" />
            </Field>
          )}
          {type === 'pressure' && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Sistólica">
                <input type="number" className="input" autoFocus value={v.bp_sys} onChange={(e) => setV({ ...v, bp_sys: e.target.value })} placeholder="120" />
              </Field>
              <Field label="Diastólica">
                <input type="number" className="input" value={v.bp_dia} onChange={(e) => setV({ ...v, bp_dia: e.target.value })} placeholder="80" />
              </Field>
            </div>
          )}
          {type === 'glucose' && (
            <Field label="Glucosa (mg/dL)">
              <input type="number" className="input" autoFocus value={v.glucose} onChange={(e) => setV({ ...v, glucose: e.target.value })} placeholder="95" />
            </Field>
          )}
          {type === 'temperature' && (
            <Field label="Temperatura (°C)">
              <input type="number" step="0.1" className="input" autoFocus value={v.temperature} onChange={(e) => setV({ ...v, temperature: e.target.value })} placeholder="36.6" />
            </Field>
          )}

          <label className="flex items-start gap-2.5 rounded-xl border border-ink-200 bg-ink-50 p-3 cursor-pointer select-none">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-primary-500"
              checked={Boolean(v.visible_in_pdf)}
              onChange={(e) => setV({ ...v, visible_in_pdf: e.target.checked })}
            />
            <span>
              <span className="block text-sm font-medium text-ink-800">Visible en PDF médico</span>
              <span className="block text-xs text-ink-500">Este registro aparecerá en el PDF médico. Desmárcalo para ocultarlo.</span>
            </span>
          </label>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={close} className="btn-ghost flex-1">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
