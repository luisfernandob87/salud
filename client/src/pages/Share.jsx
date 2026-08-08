import { useEffect, useState } from 'react';
import { Share2, Copy, Trash2, Loader2, ShieldCheck, Link2, Clock } from 'lucide-react';
import { api, friendlyError } from '../api/client';
import { useUi } from '../stores/ui';
import { useAuth } from '../stores/auth';
import EmptyState from '../components/ui/EmptyState';
import { formatDate } from '../utils/format';

const EXPIRY_OPTIONS = [
  { value: '24h', label: '24 horas' },
  { value: '7d', label: '7 días' },
  { value: '30d', label: '30 días' },
];

const RANGE_OPTIONS = [
  { value: '30d', label: 'Últimos 30 días' },
  { value: '3m', label: '3 meses atrás' },
  { value: '6m', label: '6 meses atrás' },
  { value: 'all', label: 'Historial completo' },
];

const TYPE_OPTIONS = [
  { value: 'symptom', label: 'Síntomas' },
  { value: 'consultation', label: 'Consultas' },
  { value: 'medication', label: 'Medicamentos' },
  { value: 'study', label: 'Estudios' },
  { value: 'daily', label: 'Salud diaria' },
  { value: 'note', label: 'Notas' },
];

const ALL_TYPES = TYPE_OPTIONS.map((t) => t.value);

function rangeLabel(link) {
  if (!link.date_from || !link.date_to) return 'Historial completo';
  const diffDays = Math.round((new Date(link.date_to) - new Date(link.date_from)) / 86400000);
  if (diffDays <= 31) return 'Últimos 30 días';
  if (diffDays <= 100) return '3 meses atrás';
  if (diffDays <= 200) return '6 meses atrás';
  return 'Historial completo';
}

function typesLabel(link) {
  if (!link.types) return 'Todos los tipos';
  try {
    const arr = JSON.parse(link.types);
    if (!Array.isArray(arr) || arr.length === 0) return 'Todos los tipos';
    return `Incluye: ${arr.map((t) => TYPE_OPTIONS.find((o) => o.value === t)?.label || t).join(' · ')}`;
  } catch (err) {
    return 'Todos los tipos';
  }
}

function isExpired(link) {
  return !!(link.expires_at && new Date(link.expires_at) < new Date());
}

export default function Share() {
  const { refreshKey, toast } = useUi();
  const { profiles, activeProfile } = useAuth();
  const activeName = activeProfile ? profiles.find((p) => p.id === activeProfile)?.name : null;
  const [links, setLinks] = useState(null);
  const [expiry, setExpiry] = useState('7d');
  const [range, setRange] = useState('all');
  const [types, setTypes] = useState(ALL_TYPES);
  const [password, setPassword] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .get('/api/share')
      .then((data) => active && setLinks(data.items.filter((l) => !isExpired(l))))
      .catch((err) => toast(friendlyError(err), 'error'));
    return () => {
      active = false;
    };
  }, [refreshKey, toast]);

  async function create(e) {
    e.preventDefault();
    if (types.length === 0) return;
    setCreating(true);
    try {
      const body = { expires: expiry, password: password || undefined, range };
      if (types.length !== ALL_TYPES.length) body.types = types;
      const data = await api.post('/api/share', body);
      const url = `${window.location.origin}/s/${data.item.token}`;
      try {
        await navigator.clipboard.writeText(url);
        toast('Enlace creado y copiado al portapapeles.', 'success');
      } catch (err) {
        toast('Enlace creado.', 'success');
      }
      setLinks((prev) => (prev ? [data.item, ...prev] : [data.item]));
      setPassword('');
    } catch (err) {
      toast(friendlyError(err), 'error');
    } finally {
      setCreating(false);
    }
  }

  async function copy(link) {
    const url = `${window.location.origin}/s/${link.token}`;
    try {
      await navigator.clipboard.writeText(url);
      toast('Enlace copiado.', 'success');
    } catch (err) {
      toast(url, 'info');
    }
  }

  async function revoke(id) {
    if (!window.confirm('¿Revocar este enlace? El médico ya no podrá ver tu información.')) return;
    try {
      await api.del(`/api/share/${id}`);
      setLinks((prev) => prev.filter((l) => l.id !== id));
      toast('Enlace revocado.', 'success');
    } catch (err) {
      toast(friendlyError(err), 'error');
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900 mb-1">Compartir con tu médico</h1>
      <p className="text-sm text-ink-500 mb-6">
        Genera un enlace temporal de solo lectura del historial{' '}
        {activeName ? `de ${activeName}. ` : ''}El médico lo verá sin crear cuenta.
      </p>

      <div className="card p-5 mb-6">
        <form onSubmit={create} className="space-y-4">
          <div>
            <label className="label">Duración del enlace</label>
            <div className="flex gap-2">
              {EXPIRY_OPTIONS.map((o) => (
                <button
                  type="button"
                  key={o.value}
                  onClick={() => setExpiry(o.value)}
                  className={`chip border px-4 py-2 text-sm ${
                    expiry === o.value ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-ink-600 border-ink-200'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Qué compartir</label>
            <div className="flex flex-wrap gap-2">
              {RANGE_OPTIONS.map((o) => (
                <button
                  type="button"
                  key={o.value}
                  onClick={() => setRange(o.value)}
                  className={`chip border px-4 py-2 text-sm ${
                    range === o.value ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-ink-600 border-ink-200'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-ink-400 mt-1.5">
              {range === 'all'
                ? 'Compartirás todo el historial, tal como está.'
                : `Solo se compartirán los registros de ${range === '30d' ? 'los últimos 30 días' : range === '3m' ? 'los últimos 3 meses' : 'los últimos 6 meses'} hasta hoy.`}
            </p>
          </div>

          <div>
            <label className="label">Qué tipos de registros compartir</label>
            <div className="flex flex-wrap gap-2">
              {TYPE_OPTIONS.map((o) => {
                const on = types.includes(o.value);
                return (
                  <button
                    type="button"
                    key={o.value}
                    onClick={() => setTypes((prev) => (on ? prev.filter((t) => t !== o.value) : [...prev, o.value]))}
                    className={`chip border px-4 py-2 text-sm ${
                      on ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-ink-600 border-ink-200'
                    }`}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-ink-400 mt-1.5">
              {types.length === 0
                ? 'Selecciona al menos un tipo de registro.'
                : types.length === ALL_TYPES.length
                  ? 'Compartirás todos los tipos de registros.'
                  : `Compartirás: ${types.map((t) => TYPE_OPTIONS.find((o) => o.value === t)?.label || t).join(', ')}.`}
            </p>
          </div>

          <div>
            <label className="label">Contraseña (opcional)</label>
            <input
              className="input"
              placeholder="Deja vacío para acceso sin contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" disabled={creating || types.length === 0} className="btn-primary w-full">
            {creating ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />}
            Crear enlace de solo lectura
          </button>
        </form>
      </div>

      <div className="flex items-start gap-2.5 rounded-2xl bg-mint-50 border border-mint-200 p-4 mb-6">
        <ShieldCheck size={18} className="text-mint-600 shrink-0 mt-0.5" />
        <p className="text-sm text-mint-800">
          Solo compartes una vista de solo lectura. No se puede editar nada desde el enlace, y puedes revocarlo cuando quieras.
        </p>
      </div>

      {!links ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-primary-500" size={26} />
        </div>
      ) : links.length === 0 ? (
        <EmptyState
          icon={Share2}
          title="Aún no compartes nada"
          description="Crea tu primer enlace para mostrar tu historial a un médico."
        />
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-ink-700">Tus enlaces activos</h2>
          {links.map((l) => (
            <div key={l.id} className="card p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink-800 truncate flex items-center gap-2">
                  <Link2 size={14} className="text-primary-500 shrink-0" />
                  /s/{l.token.slice(0, 12)}…
                  {l.password_hash && <span className="chip bg-amber-50 text-amber-600 border-amber-200">con contraseña</span>}
                  <span className="chip bg-ink-100 text-ink-600 border-ink-200">{rangeLabel(l)}</span>
                  <span className="chip bg-ink-100 text-ink-600 border-ink-200">{typesLabel(l)}</span>
                </p>
                <p className="text-xs text-ink-400 mt-1 flex items-center gap-1">
                  <Clock size={12} />
                  Expira: {formatDate(l.expires_at)}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => copy(l)} className="p-2 rounded-lg text-ink-500 hover:bg-ink-100" title="Copiar enlace">
                  <Copy size={16} />
                </button>
                <button onClick={() => revoke(l.id)} className="p-2 rounded-lg text-ink-500 hover:bg-red-50 hover:text-red-600" title="Revocar">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
