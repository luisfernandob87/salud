import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Copy,
  RefreshCw,
  Trash2,
  Pencil,
  KeyRound,
  Eye,
  EyeOff,
  Check,
  Loader2,
} from 'lucide-react';
import { api, friendlyError } from '../api/client';
import { useAuth } from '../stores/auth';
import { useUi } from '../stores/ui';
import { initials, ageFrom } from '../utils/format';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';

const RELATIONS = ['hijo', 'hija', 'padre', 'madre', 'abuelo', 'abuela', 'pareja', 'otro'];
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function relationLabel(p) {
  const relation = p.relation ? p.relation.charAt(0).toUpperCase() + p.relation.slice(1) : 'Familiar';
  const age = ageFrom(p.birth_date);
  return age === null ? relation : `${relation} · ${age} años`;
}

function MemberForm({ initial, onSubmit, submitLabel, loading }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    relation: initial?.relation || 'hijo',
    birth_date: initial?.birth_date || '',
    blood_type: initial?.blood_type || '',
    height_cm: initial?.height_cm ?? '',
  });
  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="space-y-3"
    >
      <div>
        <label className="label">Nombre</label>
        <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Nombre completo" required />
      </div>
      <div>
        <label className="label">Parentesco</label>
        <select className="input" value={form.relation} onChange={(e) => set('relation', e.target.value)}>
          {RELATIONS.map((r) => (
            <option key={r} value={r}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Fecha de nacimiento</label>
          <input type="date" className="input" value={form.birth_date || ''} onChange={(e) => set('birth_date', e.target.value)} />
        </div>
        <div>
          <label className="label">Altura (cm)</label>
          <input type="number" className="input" value={form.height_cm ?? ''} onChange={(e) => set('height_cm', e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label">Tipo de sangre</label>
        <select className="input" value={form.blood_type || ''} onChange={(e) => set('blood_type', e.target.value)}>
          <option value="">No sé / Prefiero no decir</option>
          {BLOOD_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading && <Loader2 size={15} className="animate-spin" />}
        {submitLabel}
      </button>
    </form>
  );
}

function CodeModal({ profile, onClose }) {
  const { toast } = useUi();
  const { refreshProfiles } = useAuth();
  const [codes, setCodes] = useState({ family: profile.family_code, claim: profile.claim_code });
  const [visible, setVisible] = useState(false);
  const [regenerating, setRegenerating] = useState(null);
  const [copied, setCopied] = useState(null);

  async function copy(text, kind) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    } catch (err) {
      toast('No se pudo copiar. Cópialo manualmente.', 'info');
    }
  }

  async function regenerate(kind) {
    setRegenerating(kind);
    try {
      const data = await api.post(`/api/family/${profile.id}/${kind === 'family' ? 'family' : 'claim'}-code`);
      setCodes((c) => ({ ...c, [kind]: data.code }));
      await refreshProfiles();
      toast('Código regenerado. El anterior ya no funciona.', 'success');
    } catch (err) {
      toast(friendlyError(err), 'error');
    } finally {
      setRegenerating(null);
    }
  }

  const codeItem = (kind, label, hint, value) => (
    <div className="rounded-xl border border-ink-200 p-3.5">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-semibold text-ink-800">{label}</p>
        <button onClick={() => setVisible((v) => !v)} className="p-1.5 rounded-lg text-ink-400 hover:bg-ink-100" title="Mostrar/ocultar">
          {visible ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      <p className="text-xs text-ink-400 mb-2">{hint}</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 rounded-lg bg-ink-50 border border-ink-100 px-3 py-2 text-sm font-mono tracking-widest text-ink-800">
          {visible ? value : '••••••••••••'}
        </code>
        <button
          onClick={() => copy(value, kind)}
          className="p-2.5 rounded-xl bg-primary-50 text-primary-600 hover:bg-primary-100"
          title="Copiar"
        >
          {copied === kind ? <Check size={16} /> : <Copy size={16} />}
        </button>
        <button
          onClick={() => regenerate(kind)}
          disabled={regenerating === kind}
          className="p-2.5 rounded-xl bg-ink-50 text-ink-500 hover:bg-ink-100"
          title="Regenerar"
        >
          {regenerating === kind ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
        </button>
      </div>
    </div>
  );

  return (
    <Modal open onClose={onClose} title={`Códigos de ${profile.name}`}>
      <div className="space-y-3">
        {codeItem(
          'family',
          'Código de acceso',
          'Compártelo para que otro cuidador (p. ej. el otro padre) gestione este historial.',
          codes.family
        )}
        {codeItem(
          'claim',
          'Código de reclamación',
          'Lo usa el propio familiar al crear su cuenta para llevarse todo su historial. Úsalo solo cuando deba pasar a ser suyo.',
          codes.claim
        )}
        <p className="text-xs text-ink-400">
          Al regenerar un código, el anterior deja de funcionar inmediatamente.
        </p>
      </div>
    </Modal>
  );
}

export default function Family() {
  const { user, profiles, activeProfile, setProfile, refreshProfiles } = useAuth();
  const { toast, bumpRefresh } = useUi();
  const navigate = useNavigate();
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [codesFor, setCodesFor] = useState(null);
  const [joinCode, setJoinCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [joining, setJoining] = useState(false);

  const dependents = profiles.filter((p) => p.id !== user?.id);
  const me = profiles.find((p) => p.id === user?.id) || user;

  async function createMember(form) {
    setSaving(true);
    try {
      await api.post('/api/family', form);
      await refreshProfiles();
      setAddOpen(false);
      toast(`${form.name} añadido a tu familia.`, 'success');
    } catch (err) {
      toast(friendlyError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(form) {
    setSaving(true);
    try {
      await api.put(`/api/family/${editing.id}`, form);
      await refreshProfiles();
      setEditing(null);
      toast('Perfil actualizado.', 'success');
    } catch (err) {
      toast(friendlyError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function removeMember(p) {
    if (!window.confirm(`¿Eliminar el historial completo de ${p.name}? Esta acción es irreversible.`)) return;
    try {
      await api.del(`/api/family/${p.id}`);
      await refreshProfiles();
      if (activeProfile === p.id) {
        setProfile(null);
        bumpRefresh();
      }
      toast('Perfil eliminado.', 'success');
    } catch (err) {
      toast(friendlyError(err), 'error');
    }
  }

  async function join() {
    setJoining(true);
    try {
      const data = await api.post('/api/family/join', { code: joinCode });
      await refreshProfiles();
      setJoinCode('');
      toast(`Ya eres cuidador de ${data.profile.name}.`, 'success');
    } catch (err) {
      toast(friendlyError(err), 'error');
    } finally {
      setJoining(false);
    }
  }

  function openProfile(p) {
    setProfile(p.id === user?.id ? null : p.id);
    bumpRefresh();
    navigate('/dashboard');
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-ink-900 mb-1">Familia</h1>
      <p className="text-sm text-ink-500 mb-6">
        Lleva el historial de tus hijos, abuelos o de quien cuidas, y entrégalo cuando sea suyo.
      </p>

      <div className="card p-5 mb-6 bg-gradient-to-br from-mint-50 to-white border-mint-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-mint-100 text-mint-600 flex items-center justify-center">
            <KeyRound size={19} />
          </div>
          <div>
            <h2 className="font-semibold text-ink-900">Unirme como cuidador</h2>
            <p className="text-xs text-ink-400">Entra el código que te compartió otra persona para gestionar su historial.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <input
            className="input flex-1 font-mono tracking-widest"
            placeholder="Código de acceso"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
          />
          <button onClick={join} disabled={joining || !joinCode.trim()} className="btn-primary shrink-0">
            {joining ? <Loader2 size={15} className="animate-spin" /> : <Users size={15} />}
            Unirme
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-ink-700">Tus perfiles</h2>
        <button onClick={() => setAddOpen(true)} className="btn-primary">
          <Plus size={15} />
          Añadir familiar
        </button>
      </div>

      {dependents.length === 0 && (
        <div className="mb-4">
          <EmptyState
            icon={Users}
            title="Aún no has añadido a nadie"
            description="Añade a un hijo, abuelo o familiar para registrar sus síntomas, consultas y medicamentos."
          />
        </div>
      )}

      <div className="space-y-3">
        <div className="card p-4 flex items-center justify-between gap-3">
          <button onClick={() => openProfile({ id: user?.id, name: user?.name })} className="flex items-center gap-3 text-left min-w-0 flex-1">
            <div className="w-11 h-11 rounded-full bg-mint-100 text-mint-700 flex items-center justify-center font-semibold text-sm shrink-0">
              {initials(me?.name)}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-ink-900 truncate">{me?.name}</p>
              <p className="text-xs text-ink-400 truncate">Tu historial · {user?.email}</p>
            </div>
          </button>
          <button onClick={() => openProfile({ id: user?.id, name: user?.name })} className="chip bg-primary-50 text-primary-600 border-primary-100 shrink-0">
            Ver
          </button>
        </div>

        {dependents.map((p) => {
          const active = activeProfile === p.id;
          return (
            <div key={p.id} className="card p-4">
              <div className="flex items-center justify-between gap-3">
                <button onClick={() => openProfile(p)} className="flex items-center gap-3 text-left min-w-0 flex-1">
                  <div className="w-11 h-11 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-semibold text-sm shrink-0">
                    {initials(p.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-ink-900 truncate">{p.name}</p>
                    <p className="text-xs text-ink-400 truncate">{relationLabel(p)}</p>
                  </div>
                </button>
                <div className="flex items-center gap-1 shrink-0">
                  {active && <span className="chip bg-primary-50 text-primary-600 border-primary-100">En vista</span>}
                  <button
                    onClick={() => setCodesFor(p)}
                    className="p-2 rounded-lg text-ink-500 hover:bg-ink-100"
                    title="Códigos de acceso y reclamación"
                  >
                    <KeyRound size={16} />
                  </button>
                  <button
                    onClick={() => setEditing(p)}
                    className="p-2 rounded-lg text-ink-500 hover:bg-ink-100"
                    title="Editar"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => removeMember(p)}
                    className="p-2 rounded-lg text-ink-500 hover:bg-red-50 hover:text-red-600"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Añadir familiar" footer={null}>
        <MemberForm onSubmit={createMember} submitLabel="Añadir y generar códigos" loading={saving} />
      </Modal>

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={`Editar a ${editing?.name || ''}`} footer={null}>
        <MemberForm key={editing?.id} initial={editing} onSubmit={saveEdit} submitLabel="Guardar cambios" loading={saving} />
      </Modal>

      {codesFor && <CodeModal profile={codesFor} onClose={() => setCodesFor(null)} />}
    </div>
  );
}
