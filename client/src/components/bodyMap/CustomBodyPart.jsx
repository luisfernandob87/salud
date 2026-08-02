import { useState } from 'react';
import { Plus, X, MapPin } from 'lucide-react';
import { BODY_PARTS, BODY_PARTS_DETAIL } from '../../utils/entities';

const KNOWN = new Set([...BODY_PARTS.map((p) => p.id), ...BODY_PARTS_DETAIL.map((p) => p.id)]);

export default function CustomBodyPart({ value = [], onChange }) {
  const [text, setText] = useState('');

  const customs = value.filter((id) => !KNOWN.has(id));

  function add() {
    const clean = text.trim().toLowerCase();
    if (!clean) return;
    if (value.includes(clean)) {
      setText('');
      return;
    }
    onChange([...value, clean]);
    setText('');
  }

  function remove(id) {
    onChange(value.filter((x) => x !== id));
  }

  return (
    <div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            className="input pl-8"
            placeholder="Escribe otra zona (ej. dedo pequeño del pie derecho)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                add();
              }
            }}
          />
        </div>
        <button type="button" onClick={add} className="btn-ghost px-3" title="Agregar">
          <Plus size={16} />
        </button>
      </div>

      {customs.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {customs.map((id) => (
            <span key={id} className="chip bg-primary-50 text-primary-700 border border-primary-200">
              {id}
              <button type="button" onClick={() => remove(id)} className="text-primary-400 hover:text-primary-600">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
