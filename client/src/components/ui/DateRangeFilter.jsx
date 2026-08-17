import { CalendarDays } from 'lucide-react';

export default function DateRangeFilter({ ranges, value, onChange }) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
      <CalendarDays size={14} className="text-ink-400 shrink-0" />
      {ranges.map((r) => (
        <button
          key={r.value}
          onClick={() => onChange(r.value)}
          className={`chip border shrink-0 px-2.5 py-1 transition ${
            value === r.value
              ? 'bg-primary-500 text-white border-primary-500'
              : 'bg-white text-ink-600 border-ink-200 hover:border-primary-300'
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
