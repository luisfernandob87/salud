import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Loader2, HeartPulse, Save } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { api, friendlyError } from '../api/client';
import { useUi } from '../stores/ui';
import HealthCharts from '../components/charts/HealthCharts';
import { MOODS } from '../utils/entities';
import EmptyState from '../components/ui/EmptyState';
import DateRangeFilter from '../components/ui/DateRangeFilter';
import { useDateFilter } from '../hooks/useDateFilter';

function Field({ label, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

const EMPTY = {
  mood: null,
  sleep_hours: '',
  activity: '',
  weight_kg: '',
  bp_sys: '',
  bp_dia: '',
  glucose: '',
  temperature: '',
  heart_rate: '',
  spo2: '',
  notes: '',
  visible_in_pdf: true,
};

export default function Health() {
  const { refreshKey, toast, bumpRefresh } = useUi();
  const location = useLocation();
  const [all, setAll] = useState(null);
  const [date, setDate] = useState(location.state?.date || new Date().toISOString().slice(0, 10));
  const [v, setV] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const { range, setRange, filterItems, ranges } = useDateFilter();

  useEffect(() => {
    let active = true;
    api
      .get('/api/daily')
      .then((data) => active && setAll(data.items))
      .catch((err) => toast(friendlyError(err), 'error'));
    return () => {
      active = false;
    };
  }, [refreshKey, toast]);

  const current = useMemo(() => (all || []).find((d) => d.date === date), [all, date]);
  const filteredAll = useMemo(() => filterItems(all || []), [all, filterItems]);

  useEffect(() => {
    if (current) {
      setV({
        mood: current.mood ?? null,
        sleep_hours: current.sleep_hours ?? '',
        activity: current.activity ?? '',
        weight_kg: current.weight_kg ?? '',
        bp_sys: current.bp_sys ?? '',
        bp_dia: current.bp_dia ?? '',
        glucose: current.glucose ?? '',
        temperature: current.temperature ?? '',
        heart_rate: current.heart_rate ?? '',
        spo2: current.spo2 ?? '',
        notes: current.notes ?? '',
        visible_in_pdf: current.visible_in_pdf !== 0 && current.visible_in_pdf !== false && current.visible_in_pdf !== '0' && current.visible_in_pdf !== 'false',
      });
    } else {
      setV(EMPTY);
    }
  }, [current, date]);

  function set(k, val) {
    setV((s) => ({ ...s, [k]: val }));
  }

  async function save(e) {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      await api.put('/api/daily', { ...v, date });
      toast('Registro de salud guardado.', 'success');
      bumpRefresh();
    } catch (err) {
      toast(friendlyError(err), 'error');
    } finally {
      setLoading(false);
    }
  }

  async function remove() {
    if (!window.confirm('¿Eliminar este registro de salud diaria? Esta acción no se puede deshacer.')) return;
    setLoading(true);
    try {
      await api.del(`/api/daily/${date}`);
      toast('Registro eliminado.', 'success');
      bumpRefresh();
    } catch (err) {
      toast(friendlyError(err), 'error');
    } finally {
      setLoading(false);
    }
  }

  if (!all) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-primary-500" size={28} />
      </div>
    );
  }

  const filledCount = Object.entries(v)
    .filter(([k, x]) => k !== 'visible_in_pdf')
    .filter(([, x]) => x !== '' && x !== null && x !== undefined).length;
  const hasAny = all.length > 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Salud diaria</h1>
          <p className="text-sm text-ink-500">Tu bienestar, día a día. Todo genera gráficas.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setDate(subDays(new Date(date), 1).toISOString().slice(0, 10))} className="p-2 rounded-xl text-ink-500 hover:bg-ink-100">
                <ChevronLeft size={18} />
              </button>
              <div className="text-center">
                <p className="font-semibold text-ink-900">{format(new Date(date + 'T00:00:00'), "d 'de' MMMM", { locale: es })}</p>
                <button
                  onClick={() => setDate(new Date().toISOString().slice(0, 10))}
                  className="text-xs text-primary-600 hover:underline"
                >
                  Ir a hoy
                </button>
              </div>
              <button onClick={() => setDate(addDays(new Date(date), 1).toISOString().slice(0, 10))} className="p-2 rounded-xl text-ink-500 hover:bg-ink-100">
                <ChevronRight size={18} />
              </button>
            </div>

            <form onSubmit={save} className="space-y-3">
              <Field label="Estado de ánimo">
                <div className="flex gap-1.5">
                  {MOODS.map((m) => (
                    <button
                      type="button"
                      key={m.value}
                      onClick={() => set('mood', v.mood === m.value ? null : m.value)}
                      className={`flex-1 rounded-xl py-2 text-center transition border ${
                        v.mood === m.value ? 'bg-rose-50 border-rose-300 scale-105' : 'bg-ink-50 border-transparent hover:bg-ink-100'
                      }`}
                    >
                      <span className="text-xl">{m.emoji}</span>
                    </button>
                  ))}
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Sueño (horas)">
                  <input type="number" step="0.5" className="input" value={v.sleep_hours} onChange={(e) => set('sleep_hours', e.target.value)} />
                </Field>
                <Field label="Peso (kg)">
                  <input type="number" step="0.1" className="input" value={v.weight_kg} onChange={(e) => set('weight_kg', e.target.value)} />
                </Field>
                <Field label="Presión sistólica">
                  <input type="number" className="input" placeholder="120" value={v.bp_sys} onChange={(e) => set('bp_sys', e.target.value)} />
                </Field>
                <Field label="Presión diastólica">
                  <input type="number" className="input" placeholder="80" value={v.bp_dia} onChange={(e) => set('bp_dia', e.target.value)} />
                </Field>
                <Field label="Glucosa (mg/dL)">
                  <input type="number" className="input" value={v.glucose} onChange={(e) => set('glucose', e.target.value)} />
                </Field>
                <Field label="Temperatura (°C)">
                  <input type="number" step="0.1" className="input" value={v.temperature} onChange={(e) => set('temperature', e.target.value)} />
                </Field>
                <Field label="Frecuencia cardíaca (lpm)">
                  <input type="number" className="input" value={v.heart_rate} onChange={(e) => set('heart_rate', e.target.value)} />
                </Field>
                <Field label="Saturación de O₂ (%)">
                  <input type="number" className="input" value={v.spo2} onChange={(e) => set('spo2', e.target.value)} />
                </Field>
              </div>

              <Field label="Actividad física">
                <input className="input" placeholder="ej. 30 min caminata" value={v.activity} onChange={(e) => set('activity', e.target.value)} />
              </Field>
              <Field label="Notas">
                <textarea className="input min-h-[60px]" value={v.notes} onChange={(e) => set('notes', e.target.value)} />
              </Field>

              <label className="flex items-start gap-2.5 rounded-xl border border-ink-200 bg-ink-50 p-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 accent-primary-500"
                  checked={Boolean(v.visible_in_pdf)}
                  onChange={(e) => set('visible_in_pdf', e.target.checked)}
                />
                <span>
                  <span className="block text-sm font-medium text-ink-800">Visible en PDF médico</span>
                  <span className="block text-xs text-ink-500">Este registro aparecerá en el PDF médico. Desmárcalo para ocultarlo.</span>
                </span>
              </label>

              <button type="submit" disabled={loading || filledCount === 0} className="btn-primary w-full">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Guardar registro
              </button>
              {current && (
                <button type="button" onClick={remove} disabled={loading} className="btn-danger w-full">
                  Eliminar registro del {format(new Date(date + 'T00:00:00'), "d 'de' MMMM", { locale: es })}
                </button>
              )}
            </form>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          {!hasAny ? (
            <EmptyState
              icon={HeartPulse}
              title="Comienza tu registro diario"
              description="Registra tu primer día: ánimo, peso, presión… y empieza a ver tus gráficas."
            />
          ) : (
            <>
              <div className="card p-4">
                <DateRangeFilter ranges={ranges} value={range} onChange={setRange} />
              </div>
              {filteredAll.length === 0 ? (
                <EmptyState title="Sin resultados" description="No hay registros en este rango de tiempo." />
              ) : (
                <HealthCharts items={filteredAll} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
