import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = typeof dateStr === 'string' ? parseISO(dateStr.length === 10 ? `${dateStr}T00:00:00` : dateStr) : dateStr;
  if (isToday(d)) return 'Hoy';
  if (isYesterday(d)) return 'Ayer';
  return format(d, "d 'de' MMMM, yyyy", { locale: es });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const d = typeof dateStr === 'string' ? parseISO(dateStr.length === 10 ? `${dateStr}T00:00:00` : dateStr) : dateStr;
  return format(d, "d 'de' MMMM, yyyy '·' HH:mm", { locale: es });
}

export function formatShortDate(dateStr) {
  if (!dateStr) return '';
  return formatDate(dateStr);
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

export function firstName(name = '') {
  return name.split(' ')[0] || '';
}

export function ageFrom(birthDate) {
  if (!birthDate) return null;
  const b = parseISO(birthDate);
  const diff = Date.now() - b.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}
