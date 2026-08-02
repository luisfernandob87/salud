import { useRef, useState } from 'react';
import { Upload, X, Download } from 'lucide-react';
import { api, fileUrl, friendlyError } from '../../api/client';
import { useUi } from '../../stores/ui';

export default function FileUploader({ entityType, entityId, files = [], onChanged }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useUi();

  async function onFile(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!entityId) {
      toast('Guarda primero el registro y luego adjunta archivos.', 'info');
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('entity_type', entityType);
    fd.append('entity_id', entityId);
    try {
      await api.upload('/api/files', fd);
      toast('Archivo adjuntado.', 'success');
      onChanged && onChanged();
    } catch (err) {
      toast(friendlyError(err), 'error');
    } finally {
      setUploading(false);
    }
  }

  async function remove(id) {
    try {
      await api.del(`/api/files/${id}`);
      onChanged && onChanged();
    } catch (err) {
      toast(friendlyError(err), 'error');
    }
  }

  const images = files.filter((f) => (f.mime_type || '').startsWith('image'));

  return (
    <div>
      <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="btn-ghost w-full">
        <Upload size={16} />
        {uploading ? 'Subiendo…' : 'Adjuntar fotos, videos o PDF'}
      </button>
      <input ref={inputRef} type="file" className="hidden" onChange={onFile} accept="image/*,video/mp4,video/webm,application/pdf" />

      {files.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {files.map((f) => (
            <div key={f.id} className="group relative">
              {images.some((i) => i.id === f.id) ? (
                <img src={fileUrl(f.id)} alt={f.original_name} className="w-16 h-16 rounded-lg object-cover border border-ink-100" />
              ) : (
                <a
                  href={fileUrl(f.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="w-16 h-16 rounded-lg bg-mint-50 border border-mint-200 flex flex-col items-center justify-center text-mint-700 text-[10px] font-medium"
                >
                  <Download size={16} />
                  <span className="max-w-[56px] truncate px-1">{f.original_name}</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => remove(f.id)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-ink-800 text-white flex items-center justify-center shadow"
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
