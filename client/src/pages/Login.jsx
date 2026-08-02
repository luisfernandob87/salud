import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Activity, Loader2 } from 'lucide-react';
import { useAuth } from '../stores/auth';
import { useUi } from '../stores/ui';
import { friendlyError } from '../api/client';
import { APP_NAME } from '../utils/app';
import { useSearchParams } from 'react-router-dom';

export default function Login() {
  const { login } = useAuth();
  const { toast } = useUi();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(params.get('error') === 'google' ? 'No se pudo iniciar sesión con Google.' : '');

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      toast('¡Hola de nuevo!', 'success');
      navigate('/dashboard');
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-50 via-white to-mint-50 px-4">
      <div className="w-full max-w-sm fade-up">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-primary-400 to-mint-400 flex items-center justify-center text-white shadow-soft mb-4">
            <Activity size={32} />
          </div>
          <h1 className="text-2xl font-bold text-ink-900">{APP_NAME}</h1>
          <p className="text-sm text-ink-500 mt-1">Tu historia de salud, siempre contigo.</p>
        </div>

        <div className="card p-6">
          <button
            onClick={() => (window.location.href = '/api/auth/google')}
            className="btn-ghost w-full border-ink-200 mb-4"
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.2 6.2 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.2 6.2 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.7-3.3-11.3-8l-6.5 5C9.7 39.7 16.3 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.2 4.3-4 5.7l6.2 5.2C43.1 36.5 44 30.9 44 24c0-1.3-.1-2.6-.4-3.9z"/>
            </svg>
            Continuar con Google
          </button>

          <div className="flex items-center gap-3 my-4">
            <div className="h-px flex-1 bg-ink-100" />
            <span className="text-xs text-ink-400">o con tu correo</span>
            <div className="h-px flex-1 bg-ink-100" />
          </div>

          <form onSubmit={submit} className="space-y-3">
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type="email"
                className="input pl-10"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type="password"
                className="input pl-10"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading && <Loader2 size={16} className="animate-spin" />}
              Iniciar sesión
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-ink-500 mt-5">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}
