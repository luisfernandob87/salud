import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, ShieldCheck, Trash2, Loader2, Download, LogOut, KeyRound } from 'lucide-react';
import { api, friendlyError } from '../api/client';
import { useAuth } from '../stores/auth';
import { useUi } from '../stores/ui';
import { generateMedicalPdf } from '../components/pdf/generatePdf';

function Card({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-primary-50 text-primary-500 flex items-center justify-center">
          <Icon size={19} />
        </div>
        <div>
          <h2 className="font-semibold text-ink-900">{title}</h2>
          {subtitle && <p className="text-xs text-ink-400">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

export default function Settings() {
  const { user, profiles, activeProfile, setUser, setProfile, refreshProfiles, logout } = useAuth();
  const { toast, bumpRefresh } = useUi();
  const navigate = useNavigate();

  const active = activeProfile ? profiles.find((p) => p.id === activeProfile) : null;

  const [profile, setProfileForm] = useState({
    name: user?.name || '',
    birth_date: user?.birth_date || '',
    blood_type: user?.blood_type || '',
    height_cm: user?.height_cm ?? '',
  });
  const [password, setPassword] = useState({ current_password: '', new_password: '' });
  const [claimCode, setClaimCode] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function saveProfile(e) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const data = await api.put('/api/user/profile', profile);
      setUser(data.user);
      toast('Perfil actualizado.', 'success');
    } catch (err) {
      toast(friendlyError(err), 'error');
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    setSavingPassword(true);
    try {
      await api.put('/api/user/password', password);
      toast('Contraseña actualizada.', 'success');
      setPassword({ current_password: '', new_password: '' });
    } catch (err) {
      toast(friendlyError(err), 'error');
    } finally {
      setSavingPassword(false);
    }
  }

  async function claimHistory(e) {
    e.preventDefault();
    setClaiming(true);
    try {
      const data = await api.post('/api/family/claim', { code: claimCode });
      setUser(data.user);
      setProfile(null);
      await refreshProfiles();
      bumpRefresh();
      setClaimCode('');
      toast('¡Tu historial quedó asociado a esta cuenta!', 'success');
    } catch (err) {
      toast(friendlyError(err), 'error');
    } finally {
      setClaiming(false);
    }
  }

  async function downloadData() {
    toast('Generando tu PDF…', 'info');
    try {
      const data = await api.get('/api/timeline');
      const pdfUser = active
        ? { ...user, name: active.name || user?.name, birth_date: active.birth_date || user?.birth_date }
        : user;
      setTimeout(() => generateMedicalPdf({ user: pdfUser, items: data.items }), 100);
      toast('PDF descargado.', 'success');
    } catch (err) {
      toast(friendlyError(err), 'error');
    }
  }

  async function deleteAccount() {
    if (!window.confirm('¿Eliminar tu cuenta y TODOS tus datos? Esta acción es definitiva e irreversible.')) return;
    setDeleting(true);
    try {
      await api.del('/api/user');
      await logout();
      navigate('/login');
    } catch (err) {
      toast(friendlyError(err), 'error');
      setDeleting(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-ink-900 mb-1">Configuración</h1>
      <p className="text-sm text-ink-500 mb-6">Tu perfil, privacidad y cuenta.</p>

      <div className="space-y-5">
        <Card icon={User} title="Perfil" subtitle="Tu información personal">
          <form onSubmit={saveProfile} className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Nombre</label>
                <input className="input" value={profile.name} onChange={(e) => setProfileForm({ ...profile, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Fecha de nacimiento</label>
                <input type="date" className="input" value={profile.birth_date || ''} onChange={(e) => setProfileForm({ ...profile, birth_date: e.target.value })} />
              </div>
              <div>
                <label className="label">Tipo de sangre</label>
                <select className="input" value={profile.blood_type || ''} onChange={(e) => setProfileForm({ ...profile, blood_type: e.target.value })}>
                  <option value="">No sé / Prefiero no decir</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Altura (cm)</label>
                <input type="number" className="input" value={profile.height_cm ?? ''} onChange={(e) => setProfileForm({ ...profile, height_cm: e.target.value })} />
              </div>
            </div>
            <button type="submit" disabled={savingProfile} className="btn-primary">
              {savingProfile && <Loader2 size={15} className="animate-spin" />}
              Guardar perfil
            </button>
          </form>
        </Card>

        {user?.password_hash && (
          <Card icon={Lock} title="Cambiar contraseña" subtitle="Actualiza tu contraseña de acceso">
            <form onSubmit={savePassword} className="space-y-3">
              <input type="password" className="input" placeholder="Contraseña actual" value={password.current_password} onChange={(e) => setPassword({ ...password, current_password: e.target.value })} />
              <input type="password" className="input" placeholder="Nueva contraseña (mín. 6)" value={password.new_password} onChange={(e) => setPassword({ ...password, new_password: e.target.value })} />
              <button type="submit" disabled={savingPassword} className="btn-primary">
                {savingPassword && <Loader2 size={15} className="animate-spin" />}
                Actualizar contraseña
              </button>
            </form>
          </Card>
        )}

        <Card icon={KeyRound} title="Reclamar mi historial" subtitle="¿Tu familia llevó tu historial cuando eras menor?">
          <p className="text-sm text-ink-500 mb-3">
            Introduce el código de reclamación que te compartieron. Todo tu historial (síntomas, consultas, estudios y
            archivos) se asociará a esta cuenta y dejará de estar bajo la tutela de tu familia.
          </p>
          <form onSubmit={claimHistory} className="flex gap-2">
            <input
              className="input flex-1 font-mono tracking-widest"
              placeholder="Código de reclamación"
              value={claimCode}
              onChange={(e) => setClaimCode(e.target.value)}
            />
            <button type="submit" disabled={claiming || !claimCode.trim()} className="btn-primary shrink-0">
              {claiming && <Loader2 size={15} className="animate-spin" />}
              Reclamar
            </button>
          </form>
        </Card>

        <Card icon={Download} title="Tu información" subtitle="Descarga una copia de tu historial">
          <p className="text-sm text-ink-500 mb-3">
            Genera un PDF profesional con el historial {active ? `de ${active.name} ` : ''}completo, listo para entregar a un médico.
          </p>
          <button onClick={downloadData} className="btn-ghost">
            <Download size={16} />
            Descargar PDF{active ? ` de ${active.name}` : ' de mi historial'}
          </button>
        </Card>

        <Card icon={ShieldCheck} title="Privacidad" subtitle="Nuestro compromiso contigo">
          <ul className="space-y-2 text-sm text-ink-600">
            <li className="flex gap-2"><span className="text-mint-500">✓</span> Tus datos pertenecen únicamente a ti.</li>
            <li className="flex gap-2"><span className="text-mint-500">✓</span> Nunca se venden y nunca se usan para publicidad.</li>
            <li className="flex gap-2"><span className="text-mint-500">✓</span> Tu información está cifrada y aislada por usuario.</li>
            <li className="flex gap-2"><span className="text-mint-500">✓</span> Puedes eliminar todo en cualquier momento.</li>
          </ul>
        </Card>

        <div className="card p-5 border-red-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center">
              <Trash2 size={19} />
            </div>
            <div>
              <h2 className="font-semibold text-ink-900">Zona de peligro</h2>
              <p className="text-xs text-ink-400">Estas acciones son irreversibles.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleLogout} className="btn-ghost">
              <LogOut size={16} />
              Cerrar sesión
            </button>
            <button onClick={deleteAccount} disabled={deleting} className="btn-danger">
              {deleting && <Loader2 size={15} className="animate-spin" />}
              Eliminar mi cuenta y todos mis datos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
