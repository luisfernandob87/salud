import { useEffect, useState, useMemo } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { api, friendlyError } from '../api/client';
import { useUi } from '../stores/ui';
import EventCard from './timeline/EventCard';
import EntityForm from './forms/EntityForm';
import EmptyState from './ui/EmptyState';
import DateRangeFilter from './ui/DateRangeFilter';
import { useDateFilter } from '../hooks/useDateFilter';

export default function EntityListPage({ type, title, subtitle, endpoint, emptyTitle, emptyDescription }) {
  const { refreshKey, toast } = useUi();
  const [items, setItems] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const { range, setRange, filterItems, ranges } = useDateFilter();

  useEffect(() => {
    let active = true;
    api
      .get(endpoint)
      .then((data) => active && setItems(data.items))
      .catch((err) => toast(friendlyError(err), 'error'));
    return () => {
      active = false;
    };
  }, [endpoint, refreshKey, toast]);

  const filtered = useMemo(() => filterItems(items), [items, filterItems]);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">{title}</h1>
          <p className="text-sm text-ink-500">{subtitle}</p>
        </div>
        <button onClick={() => setFormOpen(true)} className="btn-primary">
          <Plus size={16} />
          <span className="hidden sm:inline">Nuevo</span>
        </button>
      </div>

      {!items ? (
        <div className="flex justify-center py-24">
          <Loader2 className="animate-spin text-primary-500" size={28} />
        </div>
      ) : items.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} actionLabel="Registrar" onAction={() => setFormOpen(true)} />
      ) : (
        <>
          <div className="mb-4">
            <DateRangeFilter ranges={ranges} value={range} onChange={setRange} />
          </div>
          {filtered.length === 0 ? (
            <EmptyState title="Sin resultados" description="No hay registros en este rango de tiempo." />
          ) : (
            <div className="space-y-3">
              {filtered.map((item) => (
                <EventCard key={`${item.type}-${item.id}`} item={item} onEdit={(i) => { setEditing(i); setFormOpen(true); }} />
              ))}
            </div>
          )}
        </>
      )}

      <EntityForm
        key={formOpen ? (editing ? `${type}-${editing.id}` : `new-${type}`) : 'closed'}
        open={formOpen}
        type={type}
        initial={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
      />
    </div>
  );
}
