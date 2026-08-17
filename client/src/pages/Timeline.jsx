import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, CalendarDays, Loader2 } from 'lucide-react';
import { api, friendlyError } from '../api/client';
import { useUi } from '../stores/ui';
import EventCard from '../components/timeline/EventCard';
import EntityForm from '../components/forms/EntityForm';
import EmptyState from '../components/ui/EmptyState';
import DateRangeFilter from '../components/ui/DateRangeFilter';
import { useDateFilter } from '../hooks/useDateFilter';
import { formatDate } from '../utils/format';
import { ENTITY_META } from '../utils/entities';

const FILTERS = [
  { value: 'all', label: 'Todo' },
  ...Object.entries(ENTITY_META).map(([value, m]) => ({ value, label: m.label })),
];

export default function Timeline() {
  const { refreshKey, toast, setQuickAddOpen } = useUi();
  const navigate = useNavigate();
  const [items, setItems] = useState(null);
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [editingType, setEditingType] = useState('symptom');
  const { range, setRange, filterItems, ranges } = useDateFilter();

  useEffect(() => {
    let active = true;
    api
      .get('/api/timeline')
      .then((data) => active && setItems(data.items))
      .catch((err) => toast(friendlyError(err), 'error'));
    return () => {
      active = false;
    };
  }, [refreshKey, toast]);

  const groups = useMemo(() => {
    if (!items) return [];
    const dateFiltered = filterItems(items);
    const filtered = filter === 'all' ? dateFiltered : dateFiltered.filter((i) => i.type === filter);
    const map = new Map();
    for (const item of filtered) {
      const key = item.date || '';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    }
    return [...map.entries()].sort((a, b) => (a[0] > b[0] ? -1 : a[0] < b[0] ? 1 : 0));
  }, [items, filter, filterItems]);

  if (!items) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-primary-500" size={28} />
      </div>
    );
  }

  function openEdit(item) {
    if (item.type === 'daily') {
      navigate('/health', { state: { date: item.date || new Date().toISOString().slice(0, 10) } });
      return;
    }
    setEditingType(item.type);
    setEditing(item);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Línea de tiempo</h1>
          <p className="text-sm text-ink-500">Tu historia de salud, en orden cronológico.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <DateRangeFilter ranges={ranges} value={range} onChange={setRange} />
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`chip border shrink-0 px-3 py-1.5 ${
                filter === f.value ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-ink-600 border-ink-200 hover:border-primary-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon={History}
          title="Tu historia comienza aquí"
          description="Registra tu primer síntoma, medicamento o consulta para empezar a construir tu línea de tiempo."
          actionLabel="Registrar"
          onAction={() => setQuickAddOpen(true)}
        />
      ) : (
        <div className="space-y-7">
          {groups.map(([date, events]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-3">
                <CalendarDays size={15} className="text-primary-500" />
                <h2 className="text-sm font-semibold text-primary-700 uppercase tracking-wide">{formatDate(date)}</h2>
                <div className="h-px flex-1 bg-ink-100" />
              </div>
              <div className="space-y-3">
                {events.map((item) => (
                  <EventCard key={`${item.type}-${item.id}`} item={item} onEdit={openEdit} onDelete={openEdit} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <EntityForm
        key={editing ? `${editing.type}-${editing.id}` : 'none'}
        open={Boolean(editing)}
        type={editingType}
        initial={editing}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}
