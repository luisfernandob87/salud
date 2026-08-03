import { BODY_PARTS, bodyPartLabel } from '../../utils/entities';
import CustomBodyPart from './CustomBodyPart';

const ZONES = [
  { id: 'cabeza', el: 'circle', x: 100, y: 35, r: 27 },
  { id: 'ojos', el: 'circle', x: 100, y: 33, r: 34 },
  { id: 'garganta', el: 'rect', x: 90, y: 62, w: 20, h: 16, rx: 6 },
  { id: 'cuello', el: 'rect', x: 90, y: 74, w: 20, h: 12, rx: 5 },
  { id: 'hombro-izq', el: 'circle', x: 55, y: 92, r: 15 },
  { id: 'hombro-der', el: 'circle', x: 145, y: 92, r: 15 },
  { id: 'brazo-izq', el: 'rect', x: 42, y: 100, w: 14, h: 62, rx: 7 },
  { id: 'brazo-der', el: 'rect', x: 144, y: 100, w: 14, h: 62, rx: 7 },
  { id: 'codo-izq', el: 'circle', x: 49, y: 162, r: 8 },
  { id: 'codo-der', el: 'circle', x: 151, y: 162, r: 8 },
  { id: 'antebrazo-izq', el: 'rect', x: 41, y: 168, w: 13, h: 56, rx: 6 },
  { id: 'antebrazo-der', el: 'rect', x: 146, y: 168, w: 13, h: 56, rx: 6 },
  { id: 'mano-izq', el: 'circle', x: 47, y: 228, r: 9 },
  { id: 'mano-der', el: 'circle', x: 153, y: 228, r: 9 },
  { id: 'pecho', el: 'rect', x: 68, y: 82, w: 64, h: 62, rx: 22 },
  { id: 'abdomen', el: 'rect', x: 68, y: 148, w: 64, h: 56, rx: 20 },
  { id: 'cadera', el: 'rect', x: 73, y: 208, w: 54, h: 28, rx: 14 },
  { id: 'muslo-izq', el: 'rect', x: 73, y: 236, w: 25, h: 72, rx: 12 },
  { id: 'muslo-der', el: 'rect', x: 102, y: 236, w: 25, h: 72, rx: 12 },
  { id: 'rodilla-izq', el: 'circle', x: 85, y: 312, r: 9 },
  { id: 'rodilla-der', el: 'circle', x: 115, y: 312, r: 9 },
  { id: 'pierna-izq', el: 'rect', x: 75, y: 319, w: 21, h: 58, rx: 10 },
  { id: 'pierna-der', el: 'rect', x: 104, y: 319, w: 21, h: 58, rx: 10 },
  { id: 'pie-izq', el: 'rect', x: 58, y: 379, w: 44, h: 15, rx: 8 },
  { id: 'pie-der', el: 'rect', x: 98, y: 379, w: 44, h: 15, rx: 8 },
];

const EXTRA = ['espalda', 'espalda-baja'];

export default function BodyMap({ value = [], onChange }) {
  const toggle = (id) => {
    const next = value.includes(id) ? value.filter((x) => x !== id) : [...value, id];
    onChange(next);
  };

  const selected = new Set(value);

  const shapeProps = (z) => {
    const base = {
      fill: selected.has(z.id) ? '#3b82f6' : '#f1f5f9',
      stroke: selected.has(z.id) ? '#2563eb' : '#cbd5e1',
      strokeWidth: 1.5,
      className: 'cursor-pointer transition-all duration-150',
      onMouseEnter: (e) => {
        if (!selected.has(z.id)) e.currentTarget.setAttribute('fill', '#e0e7ff');
      },
      onMouseLeave: (e) => {
        if (!selected.has(z.id)) e.currentTarget.setAttribute('fill', '#f1f5f9');
      },
    };
    return base;
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex gap-4">
        <svg viewBox="0 0 200 410" className="w-44 h-auto">
          {ZONES.map((z) => {
            const p = shapeProps(z);
            const common = {
              ...p,
              onClick: () => toggle(z.id),
            };
            if (z.el === 'circle') return <circle key={z.id} {...common} cx={z.x} cy={z.y} r={z.r} />;
            return <rect key={z.id} {...common} x={z.x} y={z.y} width={z.w} height={z.h} rx={z.rx} />;
          })}
          <title>Mapa corporal</title>
        </svg>

        <div className="flex flex-col justify-center gap-2">
          <p className="text-xs font-medium text-ink-500">Toca el cuerpo para marcar la zona:</p>
          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1 no-scrollbar">
            {BODY_PARTS.filter((p) => ZONES.some((z) => z.id === p.id)).map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => toggle(p.id)}
                className={`chip border w-full justify-start ${
                  selected.has(p.id) ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-ink-600 border-ink-200'
                }`}
              >
                {bodyPartLabel(p.id)}
              </button>
            ))}
            {EXTRA.map((id) => (
              <button
                type="button"
                key={id}
                onClick={() => toggle(id)}
                className={`chip border w-full justify-start ${
                  selected.has(id) ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-ink-600 border-ink-200'
                }`}
              >
                {bodyPartLabel(id)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full mt-3">
        <CustomBodyPart value={value} onChange={onChange} />
      </div>
    </div>
  );
}
