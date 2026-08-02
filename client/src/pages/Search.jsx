import { useEffect, useState } from 'react';
import { Search as SearchIcon, Loader2, X } from 'lucide-react';
import { api, friendlyError } from '../api/client';
import { useUi } from '../stores/ui';
import EventCard from '../components/timeline/EventCard';
import { ENTITY_META } from '../utils/entities';

const SUGGESTIONS = ['Dolor de cabeza', 'Ibuprofeno', 'Radiografía', 'Cardiólogo', 'Pie derecho'];

export default function Search() {
  const { toast } = useUi();
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) {
      setResults(null);
      return;
    }
    let active = true;
    setLoading(true);
    api
      .get(`/api/search?q=${encodeURIComponent(query)}`)
      .then((data) => active && setResults(data.results))
      .catch((err) => toast(friendlyError(err), 'error'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [query, toast]);

  function submit(e) {
    e.preventDefault();
    setQuery(q.trim());
  }

  const groups = results
    ? Object.entries(results)
        .filter(([, items]) => items.length > 0)
        .map(([type, items]) => ({ type, items }))
    : [];

  const total = groups.reduce((acc, g) => acc + g.items.length, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900 mb-1">Buscar</h1>
      <p className="text-sm text-ink-500 mb-5">Encuentra cualquier cosa en tu historial de salud.</p>

      <form onSubmit={submit} className="relative mb-5">
        <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          autoFocus
          className="input pl-11 pr-10 py-3.5 text-base rounded-2xl shadow-soft"
          placeholder="'Dolor de cabeza', 'Ibuprofeno', '2025'…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {q && (
          <button type="button" onClick={() => { setQ(''); setQuery(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-ink-400 hover:bg-ink-100">
            <X size={16} />
          </button>
        )}
      </form>

      {!query && (
        <div className="flex flex-wrap gap-2 mb-6">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => { setQ(s); setQuery(s); }} className="chip bg-white border border-ink-200 text-ink-600 hover:border-primary-300 hover:text-primary-600 px-3 py-1.5">
              {s}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary-500" size={28} />
        </div>
      )}

      {!loading && query && total === 0 && (
        <div className="card p-10 text-center">
          <p className="text-ink-500 text-sm">No encontramos resultados para “{query}”.</p>
        </div>
      )}

      {!loading && groups.length > 0 && (
        <div className="space-y-7">
          <p className="text-sm text-ink-500">
            <span className="font-semibold text-ink-800">{total}</span> resultado{total !== 1 && 's'} para “{query}”
          </p>
          {groups.map(({ type, items }) => {
            const meta = ENTITY_META[type];
            return (
              <div key={type}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`chip border ${meta.chip}`}>{meta.label}</span>
                  <span className="text-xs text-ink-400">{items.length}</span>
                  <div className="h-px flex-1 bg-ink-100" />
                </div>
                <div className="space-y-3">
                  {items.map((item) => (
                    <EventCard key={`${item.type}-${item.id}`} item={item} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
