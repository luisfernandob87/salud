import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Lock, Download, FileText, ShieldCheck } from 'lucide-react';
import { api, friendlyError } from '../api/client';
import { useUi } from '../stores/ui';
import EventCard from '../components/timeline/EventCard';
import { generateMedicalPdf } from '../components/pdf/generatePdf';
import { formatDate, initials } from '../utils/format';
import { APP_NAME } from '../utils/app';
import { ENTITY_META } from '../utils/entities';

export default function SharedView() {
  const { token } = useParams();
  const { toast } = useUi();
  const [status, setStatus] = useState('checking');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [passwordRequired, setPasswordRequired] = useState(false);

  async function load(pwd) {
    const qs = pwd ? `?password=${encodeURIComponent(pwd)}` : '';
    try {
      const res = await api.get(`/api/share/public/${token}${qs}`);
      setData(res.data);
      setStatus('ready');
    } catch (err) {
      if (err.status === 401) {
        setPasswordRequired(true);
        setStatus('locked');
      } else if (err.status === 403) {
        setError(err.message);
        setStatus('error');
      } else {
        setError(friendlyError(err));
        setStatus('error');
      }
    }
  }

  useEffect(() => {
    load('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function verify(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/api/share/verify', { token, password });
      await load(password);
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  async function downloadPdf() {
    toast('Generando PDF…', 'info');
    setTimeout(() => {
      try {
        generateMedicalPdf(data);
        toast('PDF descargado.', 'success');
      } catch (err) {
        toast('No se pudo generar el PDF.', 'error');
      }
    }, 100);
  }

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-50">
        <Loader2 className="animate-spin text-primary-500" size={30} />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-50 px-4">
        <div className="card p-8 max-w-sm text-center">
          <div className="w-14 h-14 rounded-3xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={26} />
          </div>
          <h1 className="text-lg font-bold text-ink-900 mb-1">Enlace no disponible</h1>
          <p className="text-sm text-ink-500">{error}</p>
        </div>
      </div>
    );
  }

  if (status === 'locked') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-50 px-4">
        <form onSubmit={verify} className="card p-8 w-full max-w-sm fade-up">
          <div className="w-14 h-14 rounded-3xl bg-amber-50 text-amber-500 flex items-center justify-center mb-4">
            <Lock size={24} />
          </div>
          <h1 className="text-lg font-bold text-ink-900 mb-1">Historial protegido</h1>
          <p className="text-sm text-ink-500 mb-5">Este enlace está protegido con contraseña.</p>
          <input
            type="password"
            className="input mb-3"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
          <button type="submit" className="btn-primary w-full">Ver historial</button>
        </form>
      </div>
    );
  }

  const { user, items } = data;
  const groups = [];
  const map = new Map();
  for (const item of items) {
    const key = item.date || '';
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  for (const [date, evts] of map) groups.push([date, evts]);
  groups.sort((a, b) => (a[0] > b[0] ? -1 : a[0] < b[0] ? 1 : 0));

  return (
    <div className="min-h-screen bg-ink-50">
      <div className="bg-gradient-to-b from-primary-500 to-primary-600 text-white">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-xl font-bold">
              {initials(user?.name)}
            </div>
            <div>
              <h1 className="text-xl font-bold">{user?.name || 'Historial de salud'}</h1>
              <p className="text-sm text-white/80">
                {APP_NAME} · {user?.birth_date ? `Nacimiento: ${formatDate(user.birth_date)}` : 'Historial de salud'}
                {user?.blood_type ? ` · Sangre: ${user.blood_type}` : ''}
              </p>
            </div>
          </div>
          <button onClick={downloadPdf} className="inline-flex items-center gap-2 rounded-xl bg-white text-primary-700 px-4 py-2.5 text-sm font-semibold hover:bg-primary-50 shadow-soft">
            <Download size={16} />
            Descargar PDF médico
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-start gap-2 rounded-2xl bg-mint-50 border border-mint-200 p-3.5 mb-6">
          <ShieldCheck size={16} className="text-mint-600 shrink-0 mt-0.5" />
          <p className="text-xs text-mint-800">Vista de solo lectura compartida por el usuario. No reemplaza una consulta médica.</p>
        </div>

        {groups.length === 0 ? (
          <div className="card p-10 text-center text-ink-500">Este historial aún no tiene registros.</div>
        ) : (
          <div className="space-y-7">
            {groups.map(([date, evts]) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-3">
                  <FileText size={14} className="text-primary-500" />
                  <h2 className="text-sm font-semibold text-primary-700 uppercase tracking-wide">{formatDate(date)}</h2>
                  <div className="h-px flex-1 bg-ink-100" />
                </div>
                <div className="space-y-3">
                  {evts.map((item) => (
                    <EventCard key={`${item.type}-${item.id}`} item={item} token={token} password={password} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
