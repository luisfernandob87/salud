import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Loader2, User, Mail, Lock, ShieldCheck, KeyRound } from 'lucide-react';
import { useAuth } from '../stores/auth';
import { useUi } from '../stores/ui';
import { friendlyError } from '../api/client';
import { APP_NAME } from '../utils/app';

export default function Register() {
  const { register } = useAuth();
  const { toast } = useUi();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', claim_code: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(form.name, form.email, form.password, form.claim_code);
      toast('¡Bienvenido a ' + APP_NAME + '!', 'success');
      navigate('/dashboard');
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-50 via-white to-mint-50 px-4 py-8">
      <div className="w-full max-w-sm fade-up">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-primary-400 to-mint-400 flex items-center justify-center text-white shadow-soft mb-4">
            <Activity size={32} />
          </div>
          <h1 className="text-2xl font-bold text-ink-900">Crear tu cuenta</h1>
          <p className="text-sm text-ink-500 mt-1">Empieza a conservar tu historia de salud.</p>
        </div>

        <div className="card p-6">
          <form onSubmit={submit} className="space-y-3">
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input className="input pl-10" placeholder="Tu nombre" value={form.name} onChange={(e) => set('name', e.target.value)} required />
            </div>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input type="email" className="input pl-10" placeholder="correo@ejemplo.com" value={form.email} onChange={(e) => set('email', e.target.value)} required />
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input type="password" className="input pl-10" placeholder="Contraseña (mín. 6)" value={form.password} onChange={(e) => set('password', e.target.value)} required minLength={6} />
            </div>
            <div className="relative">
              <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input className="input pl-10 font-mono tracking-widest" placeholder="Código de reclamación (opcional)" value={form.claim_code} onChange={(e) => set('claim_code', e.target.value)} />
            </div>
            <p className="text-xs text-ink-400 -mt-1">
              ¿Tu familia llevó tu historial? Introduce el código para asociarlo a esta cuenta al crearla.
            </p>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading && <Loader2 size={16} className="animate-spin" />}
              Crear cuenta
            </button>
          </form>

          <div className="flex items-center gap-2 mt-4 text-xs text-ink-400">
            <ShieldCheck size={14} className="text-mint-500 shrink-0" />
            <p>Tus datos son privados. Te pertenecen solo a ti y puedes eliminarlos cuando quieras.</p>
          </div>
        </div>

        <p className="text-center text-sm text-ink-500 mt-5">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
