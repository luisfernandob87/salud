import { memo } from 'react';
import { Pencil, Trash2, FileText, Download, MapPin } from 'lucide-react';
import { ENTITY_META, SYMPTOM_KINDS, MED_STATUS, MOODS, bodyPartLabel } from '../../utils/entities';
import { fileUrl } from '../../api/client';
import { formatDateTime } from '../../utils/format';

function KindLabel({ kind }) {
  const found = SYMPTOM_KINDS.find((k) => k.value === kind);
  return found ? found.label : null;
}

function StatusBadge({ status }) {
  const s = MED_STATUS.find((m) => m.value === status);
  const cls =
    status === 'active'
      ? 'bg-mint-50 text-mint-700 border-mint-200'
      : status === 'suspended'
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-ink-100 text-ink-500 border-ink-200';
  return <span className={`chip border ${cls}`}>{s ? s.label : status}</span>;
}

function IntensityBar({ intensity }) {
  if (!intensity) return null;
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <div
            key={n}
            className={`w-1.5 h-4 rounded-full ${n <= intensity ? (n <= 3 ? 'bg-mint-400' : n <= 6 ? 'bg-amber-400' : 'bg-red-400') : 'bg-ink-100'}`}
          />
        ))}
      </div>
      <span className="text-xs font-semibold text-ink-600">{intensity}/10</span>
    </div>
  );
}

function FileGallery({ files, token, password }) {
  if (!files || files.length === 0) return null;
  const images = files.filter((f) => (f.mime_type || '').startsWith('image'));
  const videos = files.filter((f) => (f.mime_type || '').startsWith('video'));
  const docs = files.filter((f) => !(f.mime_type || '').startsWith('image') && !(f.mime_type || '').startsWith('video'));
  const url = (id) => fileUrl(id, { token, password });

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {images.map((f) => (
        <a key={f.id} href={url(f.id)} target="_blank" rel="noreferrer">
          <img
            src={url(f.id)}
            alt={f.original_name}
            className="w-20 h-20 rounded-xl object-cover border border-ink-100 shadow-softer hover:opacity-90 transition"
          />
        </a>
      ))}
      {videos.map((f) => (
        <a
          key={f.id}
          href={url(f.id)}
          target="_blank"
          rel="noreferrer"
          className="w-20 h-20 rounded-xl bg-ink-900 flex items-center justify-center text-white text-xs font-medium border border-ink-100"
        >
          ▶ Video
        </a>
      ))}
      {docs.map((f) => (
        <a
          key={f.id}
          href={url(f.id)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl bg-mint-50 border border-mint-200 text-mint-700 px-3 py-2 text-xs font-medium hover:bg-mint-100 transition"
        >
          <Download size={14} />
          {f.original_name}
        </a>
      ))}
    </div>
  );
}

function Row({ label, value }) {
  if (!value) return null;
  return (
    <p className="text-sm text-ink-700">
      <span className="font-medium text-ink-500">{label}: </span>
      {value}
    </p>
  );
}

export default memo(function EventCard({ item, token, password, onEdit, onDelete }) {
  const meta = ENTITY_META[item.type] || ENTITY_META.note;
  const Icon = meta.icon;
  const tags = Array.isArray(item.tags) ? item.tags : [];
  const bodyLocations = Array.isArray(item.body_locations) ? item.body_locations : [];

  return (
    <div className="card p-4 sm:p-5 group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${meta.chip.split(' ')[0]} ${meta.chip.split(' ')[1]}`}>
            <Icon size={19} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink-800 flex items-center gap-2 flex-wrap">
              {item.type === 'symptom' && (
                <>{item.notes || 'Síntoma'} {item.intensity && <span className="chip bg-red-50 text-red-600 border-red-200">{item.intensity}/10</span>}</>
              )}
              {item.type === 'consultation' && <>{item.doctor || 'Consulta'} {item.specialty && <span className="chip bg-blue-50 text-blue-600 border-blue-200">{item.specialty}</span>}</>}
              {item.type === 'medication' && <>{item.name || 'Medicamento'} <StatusBadge status={item.status} /></>}
              {item.type === 'study' && <>{item.category || 'Estudio'} {item.description && <span className="text-ink-500 font-normal">{item.description}</span>}</>}
              {item.type === 'note' && <>{item.title || 'Nota'}</>}
              {item.type === 'daily' && <>Registro diario</>}
            </p>
            <p className="text-xs text-ink-400 mt-0.5">
              {item.type === 'symptom' ? formatDateTime(item.occurred_at) : item.date || item.start_date}
            </p>
          </div>
        </div>

        {(onEdit || onDelete) && (
          <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition">
            {onEdit && (
              <button onClick={() => onEdit(item)} className="p-2 rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-700" title="Editar">
                <Pencil size={15} />
              </button>
            )}
            {onDelete && (
              <button onClick={() => onDelete(item)} className="p-2 rounded-lg text-ink-400 hover:bg-red-50 hover:text-red-600" title="Eliminar">
                <Trash2 size={15} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mt-2.5 space-y-1 pl-[52px]">
        {item.type === 'symptom' && (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              <IntensityBar intensity={item.intensity} />
              {item.kind && <span className="chip bg-ink-100 text-ink-600">{<KindLabel kind={item.kind} />}</span>}
            </div>
            {bodyLocations.length > 0 && (
              <p className="text-sm text-ink-600 flex items-center gap-1.5 flex-wrap">
                <MapPin size={14} className="text-ink-400 shrink-0" />
                {bodyLocations.map((id) => bodyPartLabel(id)).join(', ')}
              </p>
            )}
            <Row label="Duración" value={item.duration} />
            <Row label="Posibles causas" value={item.causes} />
            <Row label="Actividad" value={item.activity} />
            <Row label="Ayudó" value={item.relief} />
            <Row label="Notas" value={item.notes} />
          </>
        )}

        {item.type === 'consultation' && (
          <>
            <Row label="Especialidad" value={item.specialty} />
            <Row label="Lugar" value={item.place} />
            <Row label="Motivo" value={item.reason} />
            <Row label="Diagnóstico" value={item.diagnosis} />
            <Row label="Tratamiento" value={item.treatment} />
            <Row label="Recomendaciones" value={item.recommendations} />
            {item.next_appointment && <Row label="Próxima cita" value={item.next_appointment} />}
          </>
        )}

        {item.type === 'medication' && (
          <>
            <Row label="Dosis" value={item.dosage} />
            <Row label="Frecuencia" value={item.frequency} />
            <Row label="Indicado por" value={item.prescribed_by} />
            <Row label="Inicio" value={item.start_date} />
            <Row label="Fin" value={item.end_date} />
            <Row label="Notas" value={item.notes} />
          </>
        )}

        {item.type === 'study' && (
          <>
            <Row label="Descripción" value={item.description} />
            <Row label="Observaciones" value={item.observations} />
          </>
        )}

        {item.type === 'note' && item.content && <p className="text-sm text-ink-700 whitespace-pre-wrap">{item.content}</p>}

        {item.type === 'daily' && (
          <div className="flex flex-wrap gap-1.5">
            {item.mood && <span className="chip bg-rose-50 text-rose-600">{MOODS.find((m) => m.value === item.mood)?.emoji} {MOODS.find((m) => m.value === item.mood)?.label}</span>}
            {item.weight_kg && <span className="chip bg-amber-50 text-amber-700">{item.weight_kg} kg</span>}
            {item.bp_sys && <span className="chip bg-red-50 text-red-600">{item.bp_sys}/{item.bp_dia} mmHg</span>}
            {item.glucose && <span className="chip bg-cyan-50 text-cyan-700">{item.glucose} mg/dL</span>}
            {item.temperature && <span className="chip bg-emerald-50 text-emerald-700">{item.temperature} °C</span>}
            {item.heart_rate && <span className="chip bg-purple-50 text-purple-600">{item.heart_rate} lpm</span>}
            {item.spo2 && <span className="chip bg-blue-50 text-blue-600">{item.spo2}% SpO₂</span>}
            {item.sleep_hours && <span className="chip bg-indigo-50 text-indigo-600">{item.sleep_hours} h sueño</span>}
          </div>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {tags.map((t) => (
              <span key={t} className="chip bg-primary-50 text-primary-600 border border-primary-100">
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>

      <FileGallery files={item.files} token={token} password={password} />
    </div>
  );
});
