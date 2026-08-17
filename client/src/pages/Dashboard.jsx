import { useEffect, useState, memo } from 'react';
import {
  Loader2,
  Activity,
  Stethoscope,
  Pill,
  Weight,
  HeartPulse,
  CalendarClock,
  Plus,
  FileText,
  ArrowRight,
  Sparkles,
  KeyRound,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api, friendlyError, fileUrl } from '../api/client';
import { useUi } from '../stores/ui';
import { useAuth } from '../stores/auth';
import { greeting, firstName, formatDate } from '../utils/format';
import { MOODS } from '../utils/entities';
import EventCard from '../components/timeline/EventCard';

const MetricCard = memo(function MetricCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className={`w-11 h-11 rounded-2xl ${color} flex items-center justify-center shrink-0`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-ink-400">{label}</p>
        <p className="text-base font-bold text-ink-900 truncate">{value || '—'}</p>
      </div>
    </div>
  );
});

export default function Dashboard() {
  const { refreshKey, toast, setQuickAddOpen } = useUi();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const { user, profiles, activeProfile } = useAuth();
  const activeName = activeProfile ? (profiles.find((p) => p.id === activeProfile)?.name || user?.name) : user?.name;
  const [hideClaimBanner, setHideClaimBanner] = useState(() => localStorage.getItem('salud_hide_claim_banner') === '1');

  useEffect(() => {
    let active = true;
    api
      .get('/api/dashboard')
      .then((data) => active && setSummary(data.summary))
      .catch((err) => toast(friendlyError(err), 'error'));
    return () => {
      active = false;
    };
  }, [refreshKey, toast]);

  function dismissClaimBanner() {
    localStorage.setItem('salud_hide_claim_banner', '1');
    setHideClaimBanner(true);
  }

  if (!summary) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-primary-500" size={28} />
      </div>
    );
  }

  const latest = summary.latestDaily && summary.latestDaily[0];
  const nextAppointment = summary.nextAppointments && summary.nextAppointments[0];
  const hasAny =
    summary.latestSymptoms.length > 0 ||
    summary.activeMedications.length > 0 ||
    summary.nextAppointments.length > 0 ||
    summary.latestDaily.length > 0 ||
    summary.latestFiles.length > 0;

  const miniTimeline = [
    ...summary.latestSymptoms.map((s) => ({ ...s, date: s.occurred_at.slice(0, 10) })),
    ...summary.nextAppointments,
    ...summary.activeMedications.map((m) => ({ ...m, date: m.start_date })),
  ]
    .sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0))
    .slice(0, 5);

  return (
    <div>
      <div className="mb-6 fade-up">
        <h1 className="text-2xl font-bold text-ink-900">
          {greeting()}, {firstName(activeName)}.
        </h1>
        <p className="text-sm text-ink-500 mt-1">
          {activeProfile ? `Así ha estado la salud de ${firstName(activeName)} recientemente.` : 'Así ha estado tu salud recientemente.'}
        </p>
      </div>

      {!activeProfile && !hideClaimBanner && summary.hasData === false && (
        <div className="card p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3 border-primary-200 bg-gradient-to-r from-primary-50 to-mint-50">
          <div className="w-10 h-10 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
            <KeyRound size={19} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-ink-900 text-sm">¿Tu familia llevó tu historial?</p>
            <p className="text-xs text-ink-500">
              Si tienes un código de reclamación, puedes asociar todo tu historial (síntomas, consultas, estudios) a esta cuenta.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => navigate('/settings')} className="btn-primary">
              Reclamar mi historial
            </button>
            <button onClick={dismissClaimBanner} className="text-xs text-ink-400 hover:text-ink-600 px-2 py-2">
              No volver a mostrar
            </button>
          </div>
        </div>
      )}

      {!hasAny && (
        <div className="card p-6 mb-6 text-center sm:text-left sm:flex sm:items-center sm:justify-between gap-4 bg-gradient-to-br from-primary-50 to-mint-50 border-primary-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white text-primary-500 flex items-center justify-center shadow-soft shrink-0">
              <Sparkles size={22} />
            </div>
            <div>
              <p className="font-semibold text-ink-900">Bienvenido a tu historia de salud</p>
              <p className="text-sm text-ink-500">Registra tu primer síntoma, medicamento o una nota. Toma menos de un minuto.</p>
            </div>
          </div>
          <button onClick={() => setQuickAddOpen(true)} className="btn-primary sm:shrink-0 mt-4 sm:mt-0">
            <Plus size={16} />
            Registrar
          </button>
        </div>
      )}

      {latest && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <MetricCard icon={Weight} label="Peso" value={latest.weight_kg ? `${latest.weight_kg} kg` : '—'} color="bg-amber-100 text-amber-600" />
          <MetricCard
            icon={HeartPulse}
            label="Presión"
            value={latest.bp_sys ? `${latest.bp_sys}/${latest.bp_dia}` : '—'}
            color="bg-red-100 text-red-500"
          />
          <MetricCard
            icon={HeartPulse}
            label="Ánimo"
            value={latest.mood ? MOODS.find((m) => m.value === latest.mood)?.emoji : '—'}
            color="bg-rose-100 text-rose-500"
          />
          <MetricCard
            icon={Activity}
            label="Glucosa"
            value={latest.glucose ? `${latest.glucose}` : '—'}
            color="bg-cyan-100 text-cyan-600"
          />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {nextAppointment && (
            <button
              onClick={() => navigate('/appointments')}
              className="card p-5 w-full text-left hover:shadow-lift transition flex items-start gap-4"
            >
              <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <CalendarClock size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Próxima cita</p>
                <p className="font-semibold text-ink-900 mt-0.5">
                  {nextAppointment.doctor || nextAppointment.specialty || 'Consulta'}
                </p>
                <p className="text-sm text-ink-500">{formatDate(nextAppointment.date)}</p>
                {nextAppointment.reason && <p className="text-sm text-ink-500 mt-1 truncate">{nextAppointment.reason}</p>}
              </div>
              <ArrowRight size={18} className="text-ink-300 shrink-0 ml-auto" />
            </button>
          )}

          {summary.activeMedications.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-ink-800">Medicamentos activos</h2>
                <button onClick={() => navigate('/medications')} className="text-xs text-primary-600 hover:underline">
                  Ver todos
                </button>
              </div>
              <div className="space-y-2">
                {summary.activeMedications.map((m) => (
                  <div key={m.id} className="card p-3.5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                      <Pill size={17} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink-900 text-sm">{m.name}</p>
                      <p className="text-xs text-ink-400">
                        {[m.dosage, m.frequency].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    {m.reminder_at && <span className="chip bg-primary-50 text-primary-600 border-primary-100">{m.reminder_at}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {summary.latestSymptoms.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-ink-800">Últimos síntomas</h2>
                <button onClick={() => navigate('/timeline')} className="text-xs text-primary-600 hover:underline">
                  Ver todo
                </button>
              </div>
              <div className="space-y-2">
                {summary.latestSymptoms.map((s) => (
                  <div key={s.id} className="card p-3.5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                      <Activity size={17} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink-900 text-sm">{s.notes || 'Síntoma'}</p>
                      <p className="text-xs text-ink-400">{formatDate(s.occurred_at)}</p>
                    </div>
                    {s.intensity && <span className="chip bg-red-50 text-red-600 border-red-200">{s.intensity}/10</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {miniTimeline.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-ink-800">Resumen reciente</h2>
                <button onClick={() => navigate('/timeline')} className="text-xs text-primary-600 hover:underline">
                  Línea de tiempo
                </button>
              </div>
              <div className="space-y-3">
                {miniTimeline.map((item) => (
                  <EventCard key={`${item.type}-${item.id}`} item={item} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          {summary.latestFiles.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-ink-800 mb-3">Últimos archivos</h2>
              <div className="card p-4">
                <div className="grid grid-cols-3 gap-2">
                  {summary.latestFiles.map((f) =>
                    (f.mime_type || '').startsWith('image') ? (
                      <a key={f.id} href={fileUrl(f.id)} target="_blank" rel="noreferrer">
                        <img
                          src={fileUrl(f.id)}
                          alt={f.original_name}
                          className="w-full h-16 rounded-lg object-cover border border-ink-100 hover:opacity-90 transition"
                        />
                      </a>
                    ) : (
                      <a
                        key={f.id}
                        href={fileUrl(f.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="h-16 rounded-lg bg-mint-50 border border-mint-200 flex flex-col items-center justify-center text-mint-700 text-[10px] font-medium"
                      >
                        <FileText size={14} />
                        <span className="max-w-[70px] truncate px-1">{f.original_name}</span>
                      </a>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => navigate('/share')}
            className="card p-5 w-full text-left hover:shadow-lift transition flex items-center gap-3 bg-gradient-to-br from-mint-50 to-white border-mint-100"
          >
            <div className="w-11 h-11 rounded-2xl bg-mint-100 text-mint-600 flex items-center justify-center shrink-0">
              <Stethoscope size={20} />
            </div>
            <div>
              <p className="font-semibold text-ink-900 text-sm">Compartir con tu médico</p>
              <p className="text-xs text-ink-500">Genera un enlace de solo lectura o un PDF.</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
