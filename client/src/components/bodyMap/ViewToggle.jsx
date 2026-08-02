export default function ViewToggle({ value, onChange }) {
  const opts = [
    { id: '2d', label: 'Mapa 2D' },
    { id: '3d', label: 'Cuerpo 3D' },
  ];

  return (
    <div className="inline-flex rounded-full bg-ink-100 p-0.5 text-xs font-semibold">
      {opts.map((o) => (
        <button
          type="button"
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`px-3.5 py-1.5 rounded-full transition-all ${
            value === o.id ? 'bg-white text-primary-600 shadow-soft' : 'text-ink-500 hover:text-ink-700'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
