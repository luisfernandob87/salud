import { useState, useMemo } from 'react';
import { subDays, subMonths, subYears, startOfDay } from 'date-fns';

const RANGES = [
  { value: '30d', label: '30 días' },
  { value: '3m', label: '3 meses' },
  { value: '6m', label: '6 meses' },
  { value: '1y', label: '1 año' },
  { value: 'all', label: 'Todo' },
];

function cutoffDate(range) {
  const now = startOfDay(new Date());
  switch (range) {
    case '30d': return subDays(now, 30).toISOString().slice(0, 10);
    case '3m': return subMonths(now, 3).toISOString().slice(0, 10);
    case '6m': return subMonths(now, 6).toISOString().slice(0, 10);
    case '1y': return subYears(now, 1).toISOString().slice(0, 10);
    default: return null;
  }
}

function itemDate(item) {
  return item.occurred_at
    ? item.occurred_at.slice(0, 10)
    : item.date || item.start_date || '';
}

export function useDateFilter(defaultRange = '30d') {
  const [range, setRange] = useState(defaultRange);
  const cutoff = useMemo(() => cutoffDate(range), [range]);

  const filterItems = useMemo(() => {
    return (items) => {
      if (!items || !cutoff) return items;
      return items.filter((item) => itemDate(item) >= cutoff);
    };
  }, [cutoff]);

  return { range, setRange, filterItems, ranges: RANGES };
}
